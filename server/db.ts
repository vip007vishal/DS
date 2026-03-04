import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    fileName TEXT NOT NULL,
    type TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence REAL NOT NULL,
    keyRequired INTEGER NOT NULL,
    validationStatus TEXT NOT NULL,
    fileSize TEXT NOT NULL,
    uploader TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS extracted_fields (
    id TEXT PRIMARY KEY,
    docId TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    confidence REAL NOT NULL,
    isPii INTEGER NOT NULL,
    redactedValue TEXT,
    FOREIGN KEY(docId) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS validation_rules (
    id TEXT PRIMARY KEY,
    docId TEXT NOT NULL,
    name TEXT NOT NULL,
    passed INTEGER NOT NULL,
    reason TEXT,
    FOREIGN KEY(docId) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    docId TEXT,
    metadata TEXT,
    FOREIGN KEY(docId) REFERENCES documents(id) ON DELETE CASCADE
  );
`);

export default db;
