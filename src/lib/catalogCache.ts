/**
 * IndexedDB cache for the full DestinyInventoryItemDefinition table.
 * localStorage can't hold ~40 MB so we use IDB which persists across sessions
 * and isn't subject to the 5 MB quota.
 *
 * The cache key encodes the manifest version + locale so a manifest bump
 * auto-invalidates stale data.
 */

import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2"

const DB_NAME = "cruzer-catalog"
const DB_VERSION = 1
const STORE = "manifest"
const META_KEY = "__meta__"

export type ItemTable = Record<number, DestinyInventoryItemDefinition>

interface CacheMeta {
  version: string
  locale: string
  savedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function readCachedCatalog(
  version: string,
  locale: string
): Promise<ItemTable | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, "readonly")
    const store = tx.objectStore(STORE)
    const meta = await promisifyRequest<CacheMeta | undefined>(
      store.get(META_KEY) as IDBRequest<CacheMeta | undefined>
    )
    if (!meta || meta.version !== version || meta.locale !== locale) {
      return null
    }
    const data = await promisifyRequest<ItemTable | undefined>(
      store.get("data") as IDBRequest<ItemTable | undefined>
    )
    return data ?? null
  } catch {
    return null
  }
}

export async function writeCachedCatalog(
  version: string,
  locale: string,
  data: ItemTable
): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)
    // Clear any previous contents (including stale versions) so we never
    // grow unbounded across manifest bumps.
    store.clear()
    store.put(data, "data")
    const meta: CacheMeta = { version, locale, savedAt: Date.now() }
    store.put(meta, META_KEY)
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } catch {
    // Fail silently — caching is a perf optimization, not critical.
  }
}
