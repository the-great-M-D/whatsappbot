import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

function makeCollection<T extends Record<string, any>>(
    filePath: string,
    idField: string,
    makeDefaults: (partial: Partial<T>) => T
) {
    const store = new Map<string, T>()

    if (existsSync(filePath)) {
        try {
            const items: T[] = JSON.parse(readFileSync(filePath, 'utf8'))
            for (const item of items) store.set(String(item[idField]), item)
        } catch {
            console.warn(`[DiskStore] Could not load ${filePath}, starting fresh`)
        }
    }

    const flush = () => {
        const snapshot = JSON.stringify(Array.from(store.values()))
        setImmediate(() => {
            try { writeFileSync(filePath, snapshot) } catch { /* ignore */ }
        })
    }

    const wrapDoc = (record: T): T & { save: () => Promise<void> } => {
        const doc: any = { ...record }
        doc.save = async () => {
            const { save, ...plain } = doc
            store.set(String(plain[idField]), plain as T)
            flush()
        }
        return doc
    }

    const matchQuery = (item: T, query: Partial<T>): boolean =>
        Object.entries(query).every(([k, v]) => item[k] === v)

    return {
        findOne: async (query: Partial<T>): Promise<(T & { save: () => Promise<void> }) | null> => {
            if (idField in query) {
                const item = store.get(String(query[idField]))
                return item ? wrapDoc(item) : null
            }
            for (const item of store.values()) {
                if (matchQuery(item, query)) return wrapDoc(item)
            }
            return null
        },

        find: async (): Promise<(T & { save: () => Promise<void> })[]> =>
            Array.from(store.values()).map(wrapDoc),

        create: async (partial: Partial<T>): Promise<T & { save: () => Promise<void> }> => {
            const record = makeDefaults(partial)
            store.set(String(record[idField]), record)
            flush()
            return wrapDoc(record)
        },

        updateOne: async (query: Partial<T>, update: { $set: Partial<T> }): Promise<void> => {
            if (idField in query) {
                const key = String(query[idField])
                const item = store.get(key)
                if (item) { store.set(key, { ...item, ...update.$set }); flush() }
                return
            }
            for (const [key, item] of store.entries()) {
                if (matchQuery(item, query)) {
                    store.set(key, { ...item, ...update.$set })
                    flush()
                    return
                }
            }
        },

        deleteOne: async (query: Partial<T>): Promise<void> => {
            if (idField in query) {
                store.delete(String(query[idField]))
                flush()
                return
            }
            for (const [key, item] of store.entries()) {
                if (matchQuery(item, query)) { store.delete(key); flush(); return }
            }
        }
    }
}

export const groupStore = makeCollection<{
    jid: string; events: boolean; nsfw: boolean; safe: boolean
    mod: boolean; cmd: boolean; invitelink: boolean
}>(
    join(DATA_DIR, 'groups.json'),
    'jid',
    (p) => ({ jid: p.jid!, events: false, nsfw: false, safe: false, mod: false, cmd: true, invitelink: false, ...p })
)

export const userStore = makeCollection<{
    jid: string; ban: boolean; warnings: number; Xp: number
}>(
    join(DATA_DIR, 'users.json'),
    'jid',
    (p) => ({ jid: p.jid!, ban: false, warnings: 0, Xp: 0, ...p })
)

export const disabledCommandsStore = makeCollection<{
    command: string; reason: string
}>(
    join(DATA_DIR, 'disabledCommands.json'),
    'command',
    (p) => ({ command: p.command!, reason: p.reason ?? '', ...p })
)

export const featureStore = makeCollection<{
    feature: string; state: boolean
}>(
    join(DATA_DIR, 'features.json'),
    'feature',
    (p) => ({ feature: p.feature!, state: p.state ?? false, ...p })
)
