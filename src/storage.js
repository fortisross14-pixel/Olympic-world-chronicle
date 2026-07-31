const DB_NAME = 'olympics-chronicle-db'
const DB_VERSION = 2
const STORE_NAME = 'saves'
const SAVE_ID = 'primary-v2'
const LEGACY_KEY = 'olympics-chronicle-save-v2'

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadGame() {
  try {
    const database = await openDatabase()
    const value = await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(SAVE_ID)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
    database.close()
    if (value?.version === 2) return value
  } catch (error) {
    console.warn('IndexedDB load failed; checking legacy storage.', error)
  }

  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    const parsed = legacy ? JSON.parse(legacy) : null
    return parsed?.version === 2 ? parsed : null
  } catch (error) {
    console.warn('Legacy save load failed.', error)
    return null
  }
}

export async function saveGame(state) {
  try {
    const database = await openDatabase()
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(state, SAVE_ID)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
    return true
  } catch (error) {
    console.warn('IndexedDB save failed.', error)
    return false
  }
}

export async function clearGame() {
  try {
    const database = await openDatabase()
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(SAVE_ID)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    database.close()
  } catch (error) {
    console.warn('Could not clear IndexedDB save.', error)
  }
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Ignore unavailable legacy storage.
  }
}
