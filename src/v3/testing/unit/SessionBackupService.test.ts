import { test } from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SessionBackupService } from '../../infrastructure/whatsapp/SessionBackupService'
import type { DrizzleSessionBackupStore } from '../../infrastructure/database/repositories/DrizzleSessionBackupStore'

class FakeBackupStore {
  saved = new Map<string, { encryptedBackup: string; keyVersion: string; backedUpAt: Date }>()
  async save(instanceId: string, backup: { encryptedBackup: string; keyVersion: string; backedUpAt: Date }): Promise<void> {
    this.saved.set(instanceId, backup)
  }
  async find(instanceId: string): Promise<{ encryptedBackup: string; keyVersion: string; backedUpAt: Date } | null> {
    return this.saved.get(instanceId) ?? null
  }
}

const mkdtemp = async () => fs.mkdtemp(join(tmpdir(), 'kaoi-backup-'))
const service = () => new SessionBackupService(new FakeBackupStore() as unknown as DrizzleSessionBackupStore, 'unit-test-secret')

test('backup then restore roundtrips files into an empty session dir', async () => {
  const store = new FakeBackupStore()
  const svc = new SessionBackupService(store as unknown as DrizzleSessionBackupStore, 'unit-test-secret')
  const sessionDir = await mkdtemp()
  await fs.mkdir(join(sessionDir, 'creds_nested'), { recursive: true })
  await fs.writeFile(join(sessionDir, 'creds.json'), 'session-data', 'utf8')
  await fs.writeFile(join(sessionDir, 'creds_nested', 'app-state.json'), 'nested-data', 'utf8')

  await svc.backup('inst', sessionDir)
  assert.ok(store.saved.has('inst'), 'backup stored')

  const emptyDir = await mkdtemp()
  const restored = await svc.restoreIfMissing('inst', emptyDir)
  assert.equal(restored, true)
  assert.equal(await fs.readFile(join(emptyDir, 'creds.json'), 'utf8'), 'session-data')
  assert.equal(await fs.readFile(join(emptyDir, 'creds_nested', 'app-state.json'), 'utf8'), 'nested-data')
})

test('restore skips when session dir already has files', async () => {
  const store = new FakeBackupStore()
  const svc = new SessionBackupService(store as unknown as DrizzleSessionBackupStore, 'unit-test-secret')
  const sessionDir = await mkdtemp()
  await fs.writeFile(join(sessionDir, 'creds.json'), 'live-data', 'utf8')
  await svc.backup('inst', sessionDir)
  const restored = await svc.restoreIfMissing('inst', sessionDir)
  assert.equal(restored, false)
})

test('restore rejects traversal paths (.., absolute, prefix tricks, null bytes)', async () => {
  const svc = service()
  const sessionDir = await mkdtemp()
  const write = (path: string) =>
    (svc as unknown as { writeRestoredFile(dir: string, p: string, data: string): Promise<void> }).writeRestoredFile(sessionDir, path, 'eA==')
  await assert.rejects(() => write('../escape.txt'), /Invalid session backup path/)
  await assert.rejects(() => write('a/../../escape.txt'), /Invalid session backup path/)
  await assert.rejects(() => write('/etc/passwd'), /Invalid session backup path/)
  await assert.rejects(() => write('weird' + String.fromCharCode(0) + 'name'), /Invalid session backup path/)
  await assert.rejects(() => write(''), /Invalid session backup path/)
  // legitimate nested path still works
  await write('creds/app-state.json')
  assert.equal(await fs.readFile(join(sessionDir, 'creds', 'app-state.json'), 'utf8'), 'x')
})

test('backup of a missing dir is a no-op', async () => {
  const store = new FakeBackupStore()
  const svc = new SessionBackupService(store as unknown as DrizzleSessionBackupStore, 'unit-test-secret')
  await svc.backup('inst', join(await mkdtemp(), 'does-not-exist'))
  assert.equal(store.saved.has('inst'), false)
})
