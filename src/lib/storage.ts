import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Walk } from './types';

interface WanderloopDB extends DBSchema {
  walks: {
    key: string;
    value: Walk;
    indexes: { 'by-createdAt': number };
  };
}

const DB_NAME = 'wanderloop';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WanderloopDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<WanderloopDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('walks', { keyPath: 'id' });
        store.createIndex('by-createdAt', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function saveWalk(walk: Walk): Promise<void> {
  const db = await getDB();
  await db.put('walks', walk);
}

export async function listWalks(): Promise<Walk[]> {
  const db = await getDB();
  const walks = await db.getAllFromIndex('walks', 'by-createdAt');
  return walks.reverse();
}

export async function deleteWalk(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('walks', id);
}
