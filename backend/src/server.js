import express from 'express';
import cors from 'cors';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDb } from './db.js';
import { createRepository } from './repository.js';
import { createRouter } from './routes.js';

export function createApp(db) {
  const repo = createRepository(db);
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api', createRouter(repo));

  // Fallback error handler so a thrown query never crashes the process.
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

// Only start the HTTP server when run directly (not when imported by tests).
const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dbPath =
    process.env.DB_PATH ??
    new URL('../data/expenses.db', import.meta.url).pathname;
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = createDb(dbPath);
  const app = createApp(db);
  const port = process.env.PORT ?? 3001;
  app.listen(port, () => {
    console.log(`Expense splitter API listening on http://localhost:${port}`);
  });
}
