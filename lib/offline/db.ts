// IndexedDB pour les transactions saisies hors ligne

const DB_NAME    = 'sikapoints-v1'
const DB_VERSION = 1
const STORE_TX   = 'pending_tx'

export interface PendingTx {
  localId:             string
  point_de_vente_id:   string
  reseau_id:           string
  type:                'DEPOT' | 'RETRAIT'
  montant:             number
  note:                string | null
  agent_id:            string | null
  created_at:          string           // ISO — horodatage de la saisie offline
  status:              'pending' | 'synced' | 'error'
  error?:              string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror        = () => reject(req.error)
    req.onsuccess      = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_TX)) {
        const store = db.createObjectStore(STORE_TX, { keyPath: 'localId' })
        store.createIndex('status', 'status', { unique: false })
      }
    }
  })
}

export async function addPendingTx(tx: Omit<PendingTx, 'status'>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_TX, 'readwrite')
    txn.objectStore(STORE_TX).add({ ...tx, status: 'pending' })
    txn.oncomplete = () => resolve()
    txn.onerror    = () => reject(txn.error)
  })
}

export async function getPendingTxs(): Promise<PendingTx[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_TX, 'readonly')
    const req = txn.objectStore(STORE_TX).index('status').getAll('pending')
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror   = () => reject(req.error)
  })
}

export async function countPending(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_TX, 'readonly')
    const req = txn.objectStore(STORE_TX).index('status').count(IDBKeyRange.only('pending'))
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

export async function markTxSynced(localId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const txn   = db.transaction(STORE_TX, 'readwrite')
    const store = txn.objectStore(STORE_TX)
    const get   = store.get(localId)
    get.onsuccess = () => {
      if (get.result) { get.result.status = 'synced'; store.put(get.result) }
    }
    txn.oncomplete = () => resolve()
    txn.onerror    = () => reject(txn.error)
  })
}

export async function markTxError(localId: string, error: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const txn   = db.transaction(STORE_TX, 'readwrite')
    const store = txn.objectStore(STORE_TX)
    const get   = store.get(localId)
    get.onsuccess = () => {
      if (get.result) { get.result.status = 'error'; get.result.error = error; store.put(get.result) }
    }
    txn.oncomplete = () => resolve()
    txn.onerror    = () => reject(txn.error)
  })
}
