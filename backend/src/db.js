import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Store the SQLite file at backend/data/expenses.db. Use ":memory:" for tests.
const DB_PATH =
  process.env.DB_PATH ?? join(__dirname, '..', 'data', 'expenses.db');

export function createDb(path = DB_PATH) {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id       TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      name     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id           TEXT PRIMARY KEY,
      group_id     TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      description  TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      paid_by      TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Which members share each expense (equal split across these rows).
    CREATE TABLE IF NOT EXISTS expense_participants (
      expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      member_id  TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      PRIMARY KEY (expense_id, member_id)
    );

    CREATE INDEX IF NOT EXISTS idx_members_group   ON members(group_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_group  ON expenses(group_id);
  `);
}
