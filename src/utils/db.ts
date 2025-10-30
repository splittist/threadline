import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface ThreadlineDB extends DBSchema {
  documents: {
    key: string
    value: {
      id: string
      name: string
      content: ArrayBuffer
      createdAt: number
    }
  }
}

let dbInstance: IDBPDatabase<ThreadlineDB> | null = null

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDB<ThreadlineDB>('threadline-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' })
        }
      },
    })
  }
  return dbInstance
}

export async function saveDocument(
  id: string,
  name: string,
  content: ArrayBuffer
) {
  const db = await getDB()
  await db.put('documents', {
    id,
    name,
    content,
    createdAt: Date.now(),
  })
}

export async function getDocument(id: string) {
  const db = await getDB()
  return await db.get('documents', id)
}

export async function getAllDocuments() {
  const db = await getDB()
  return await db.getAll('documents')
}

export async function deleteDocument(id: string) {
  const db = await getDB()
  await db.delete('documents', id)
}
