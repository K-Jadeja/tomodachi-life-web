// Generic IndexedDB persistence. Hosts provide a typed wrapper that uses
// these functions. We keep the engine dependency-light: no idb helpers
// are used here, just the browser's indexedDB directly. Falls back
// gracefully if IDB is unavailable.

const SAVE_VERSION = 1;
const DB_NAME = 'tomo-engine';
const DB_VERSION = 1;
const STORE = 'saves';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveToIdb<T>(slot: string, payload: T): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id: slot, payload, version: SAVE_VERSION, savedAt: Date.now() });
    await txDone(tx);
    return true;
  } catch (e) {
    console.warn('[engine/storage] idb save failed', e);
    return false;
  }
}

export async function loadFromIdb<T>(slot: string): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const tx = db.transaction(STORE, 'readonly');
    const rec = await new Promise<{ payload: T; version: number } | undefined>((resolve, reject) => {
      const r = tx.objectStore(STORE).get(slot);
      r.onsuccess = () => resolve(r.result as { payload: T; version: number } | undefined);
      r.onerror = () => reject(r.error);
    });
    if (!rec) return null;
    if (rec.version !== SAVE_VERSION) {
      console.warn('[engine/storage] idb save version mismatch');
      return null;
    }
    return rec.payload;
  } catch (e) {
    console.warn('[engine/storage] idb load failed', e);
    return null;
  }
}

export async function listSlots(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const tx = db.transaction(STORE, 'readonly');
    const all = await new Promise<Array<{ id: string }>>((resolve, reject) => {
      const r = tx.objectStore(STORE).getAll();
      r.onsuccess = () => resolve(r.result as Array<{ id: string }>);
      r.onerror = () => reject(r.error);
    });
    return all.map((r) => r.id);
  } catch {
    return [];
  }
}

export async function deleteSlot(slot: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(slot);
    await txDone(tx);
    return true;
  } catch {
    return false;
  }
}
