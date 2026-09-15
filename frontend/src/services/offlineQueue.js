import { openDB } from 'idb';

const DB_NAME = 'rapidcare-offline';
const DB_VERSION = 1;
const STORE = 'pending-requests';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('endpoint', 'endpoint');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Queue a request for later sync
 */
export async function queueRequest(endpoint, method, body, metadata = {}) {
  const db = await getDB();
  const item = {
    endpoint,
    method,
    body,
    metadata,
    timestamp: Date.now(),
    retries: 0,
  };

  const id = await db.add(STORE, item);
  console.log(`📦 Queued offline request #${id}:`, method, endpoint);
  return id;
}

/**
 * Get all pending requests
 */
export async function getPendingRequests() {
  const db = await getDB();
  return db.getAll(STORE);
}

/**
 * Get count of pending requests
 */
export async function getPendingCount() {
  const db = await getDB();
  return db.count(STORE);
}

/**
 * Remove a specific request by id
 */
export async function removeRequest(id) {
  const db = await getDB();
  return db.delete(STORE, id);
}

/**
 * Clear all pending requests (use with caution)
 */
export async function clearAll() {
  const db = await getDB();
  return db.clear(STORE);
}

/**
 * Sync all pending requests using the provided api client
 * Returns { synced, failed, total }
 */
export async function syncPendingRequests(apiClient) {
  const db = await getDB();
  const pending = await db.getAll(STORE);

  if (pending.length === 0) {
    return { synced: 0, failed: 0, total: 0 };
  }

  console.log(`🔄 Starting sync of ${pending.length} pending requests...`);

  let synced = 0;
  let failed = 0;
  const syncedData = [];

  for (const item of pending) {
    try {
      const response = await apiClient({
        method: item.method,
        url: item.endpoint,
        data: item.body,
      });

      await db.delete(STORE, item.id);
      synced++;
      syncedData.push({
        requestId: item.id,
        endpoint: item.endpoint,
        response: response.data,
      });

      console.log(`✅ Synced #${item.id}:`, item.endpoint);
    } catch (err) {
      console.warn(`❌ Sync failed for #${item.id}:`, err.message);

      // Increment retry count
      const updated = { ...item, retries: item.retries + 1 };
      await db.put(STORE, updated);
      failed++;

      // If too many retries, drop the request
      if (updated.retries >= 5) {
        console.warn(`🗑️  Dropping #${item.id} after 5 failed attempts`);
        await db.delete(STORE, item.id);
      }
    }
  }

  console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed, total: pending.length, syncedData };
}

/**
 * Check if we're currently online
 */
export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Register listeners for online/offline events
 */
export function registerConnectivityListeners({ onOnline, onOffline }) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('🌐 Back online');
    onOnline?.();
  };
  const handleOffline = () => {
    console.log('📴 Gone offline');
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
