import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME, SCHEMA_STATEMENTS } from './schema';

const sqlite = new SQLiteConnection(CapacitorSQLite);

let dbPromise: Promise<SQLiteDBConnection> | null = null;
let initialized = false;

async function setupConnection(): Promise<SQLiteDBConnection> {
  const platform = Capacitor.getPlatform();

  if (platform === 'web') {
    // jeep-sqlite custom element is mounted in main.tsx
    await customElements.whenDefined('jeep-sqlite');
    await sqlite.initWebStore();
  }

  const consistent = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  let db: SQLiteDBConnection;
  if (consistent.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  }

  await db.open();

  for (const stmt of SCHEMA_STATEMENTS) {
    await db.execute(stmt);
  }

  if (platform === 'web') {
    await sqlite.saveToStore(DB_NAME);
  }

  return db;
}

export function initSqlite(): Promise<SQLiteDBConnection> {
  if (!dbPromise) {
    dbPromise = setupConnection().then((db) => {
      initialized = true;
      return db;
    });
  }
  return dbPromise;
}

export async function getDb(): Promise<SQLiteDBConnection> {
  if (!dbPromise) {
    return initSqlite();
  }
  return dbPromise;
}

export function isDbInitialized(): boolean {
  return initialized;
}

export async function persistWeb(): Promise<void> {
  if (Capacitor.getPlatform() === 'web') {
    await sqlite.saveToStore(DB_NAME);
  }
}

export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  try {
    await sqlite.closeConnection(DB_NAME, false);
  } catch {
    // ignore
  }
  dbPromise = null;
  initialized = false;
}
