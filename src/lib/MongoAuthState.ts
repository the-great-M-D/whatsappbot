import { readdir, readFile, writeFile, ensureDir, pathExists } from 'fs-extra'
import { join } from 'path'

/**
 * Backs up all auth JSON files from the local auth directory into MongoDB.
 * Each file is stored as a document: { ID: filename_without_ext, session: raw_json_string }
 */
export const backupAuthToDB = async (model: any, authDir: string): Promise<void> => {
    try {
        const files = (await readdir(authDir)).filter((f) => f.endsWith('.json'))
        await Promise.all(
            files.map(async (file) => {
                const id = file.replace(/\.json$/, '')
                const raw = await readFile(join(authDir, file), 'utf8')
                await model.updateOne({ ID: id }, { $set: { session: raw } }, { upsert: true })
            })
        )
    } catch (err: any) {
        console.error('[DB] Auth backup error:', err.message)
    }
}

/**
 * Restores auth files from MongoDB to the local auth directory.
 * Only runs if the local creds.json does not exist yet.
 * Returns true if files were restored.
 */
export const restoreAuthFromDB = async (model: any, authDir: string): Promise<boolean> => {
    const credsFile = join(authDir, 'creds.json')
    if (await pathExists(credsFile)) return false // files already exist locally

    const docs = await model.find({}).lean()
    if (!docs || !docs.length) return false

    await ensureDir(authDir)
    await Promise.all(
        docs.map(async (doc: any) => {
            const raw = typeof doc.session === 'string' ? doc.session : JSON.stringify(doc.session)
            if (raw && raw !== 'null') {
                await writeFile(join(authDir, `${doc.ID}.json`), raw, 'utf8')
            }
        })
    )
    console.log(`[DB] Restored ${docs.length} auth files from MongoDB`)
    return true
}

/**
 * Wipes all session documents from MongoDB (used when re-pairing).
 */
export const clearAuthFromDB = async (model: any): Promise<void> => {
    try {
        await (model as any).deleteMany({})
    } catch { /* ignore */ }
}
