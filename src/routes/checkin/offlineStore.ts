// FR-04-06 — the client-side offline retention store (ticket: "[Assumed store]" — the browser
// PWA/IndexedDB holding the entry until reconnect). IndexedDB is the chosen technology: it is the
// standard durable, structured, browser-native store for this shape of data in a PWA context —
// localStorage/sessionStorage are synchronous, string-only, and not designed for this; IndexedDB is
// a native browser API, so this adds no new dependency (same "reuse the platform" precedent as
// FR-04-03's `speechSynthesis` wiring).
//
// The public surface (`OfflineStore`) is storage-agnostic so the orchestration logic in
// `index.tsx` — the part that actually matters for the ticket's acceptance criteria — can be tested
// against an in-memory fake. jsdom (this project's test environment) does not implement IndexedDB,
// so `indexedDbStore` itself is exercised only by real-browser/manual verification, not vitest;
// keeping it this thin (open/put/get/delete, no business logic) is what makes that an acceptable
// trade rather than a coverage gap that hides a real bug.

export interface PendingCheckIn {
  clientEntryId: string
  moodValue: number
  reflectionText: string
}

export interface OfflineStore {
  save(entry: PendingCheckIn): Promise<void>
  get(): Promise<PendingCheckIn | null>
  clear(): Promise<void>
}

const DB_NAME = "youhue-offline"
const DB_VERSION = 1
const STORE_NAME = "pending-checkin"
// Ticket scope: "the retained entry" (singular) — one offline check-in retained at a time, matching
// the one-check-in-per-day domain rule this feature sits on top of.
const ENTRY_KEY = "current"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("Could not open the offline store"))
  })
}

export const indexedDbStore: OfflineStore = {
  async save(entry) {
    const db = await openDb()
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        tx.objectStore(STORE_NAME).put(entry, ENTRY_KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error("Could not save the offline check-in"))
      })
    } finally {
      db.close()
    }
  },

  async get() {
    const db = await openDb()
    try {
      return await new Promise<PendingCheckIn | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly")
        const req = tx.objectStore(STORE_NAME).get(ENTRY_KEY)
        req.onsuccess = () => resolve((req.result as PendingCheckIn | undefined) ?? null)
        req.onerror = () => reject(req.error ?? new Error("Could not read the offline check-in"))
      })
    } finally {
      db.close()
    }
  },

  async clear() {
    const db = await openDb()
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite")
        tx.objectStore(STORE_NAME).delete(ENTRY_KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error ?? new Error("Could not clear the offline check-in"))
      })
    } finally {
      db.close()
    }
  },
}
