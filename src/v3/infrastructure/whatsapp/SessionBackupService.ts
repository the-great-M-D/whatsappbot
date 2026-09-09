import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { DrizzleSessionBackupStore } from '../database/repositories/DrizzleSessionBackupStore'

interface BackupFile { path: string; data: string }
interface BackupEnvelope { version: 1; files: BackupFile[] }

export class SessionBackupService {
  private readonly key: Buffer
  private readonly keyVersion = 'aes-256-gcm-v1'

  constructor(private readonly store: DrizzleSessionBackupStore, secret: string) {
    this.key = createHash('sha256').update(secret).digest()
  }

  async backup(instanceId: string, sessionDir: string): Promise<void> {
    const files = await this.readFiles(sessionDir)
    if (!files.length) return
    const payload = Buffer.from(JSON.stringify({ version: 1, files } satisfies BackupEnvelope), 'utf8')
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()])
    const encryptedBackup = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')
    await this.store.save(instanceId, { encryptedBackup, keyVersion: this.keyVersion, backedUpAt: new Date() })
  }

  async restoreIfMissing(instanceId: string, sessionDir: string): Promise<boolean> {
    try {
      if ((await fs.readdir(sessionDir)).length) return false
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error
    }
    const backup = await this.store.find(instanceId)
    if (!backup) return false
    if (backup.keyVersion !== this.keyVersion) throw new Error(`Unsupported session backup key version: ${backup.keyVersion}`)
    const packed = Buffer.from(backup.encryptedBackup, 'base64')
    if (packed.length < 28) throw new Error('Invalid encrypted session backup')
    const decipher = createDecipheriv('aes-256-gcm', this.key, packed.subarray(0, 12))
    decipher.setAuthTag(packed.subarray(12, 28))
    const envelope = JSON.parse(Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8')) as BackupEnvelope
    if (envelope.version !== 1 || !Array.isArray(envelope.files)) throw new Error('Invalid session backup payload')
    await fs.mkdir(sessionDir, { recursive: true })
    const root = join(sessionDir, sep)
    for (const file of envelope.files) {
      const resolved = join(sessionDir, file.path)
      if (!resolved.startsWith(root)) throw new Error('Invalid session backup path')
      await fs.mkdir(join(resolved, '..'), { recursive: true })
      await fs.writeFile(resolved, Buffer.from(file.data, 'base64'), { mode: 0o600 })
    }
    return true
  }

  private async readFiles(root: string): Promise<BackupFile[]> {
    const result: BackupFile[] = []
    const walk = async (dir: string): Promise<void> => {
      let entries: import('node:fs').Dirent[]
      try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch (error: any) {
        if (error?.code === 'ENOENT') return
        throw error
      }
      for (const entry of entries) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) await walk(full)
        else if (entry.isFile()) result.push({ path: relative(root, full), data: (await fs.readFile(full)).toString('base64') })
      }
    }
    await walk(root)
    return result
  }
}
