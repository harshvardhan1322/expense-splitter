import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createDb } from './db.js';
import { createRepository } from './repository.js';

/**
 * Seed the database with a sample "Goa Trip" group so the UI has something
 * to show on first launch. Safe to run repeatedly — it just adds another group.
 */
const dbPath =
  process.env.DB_PATH ??
  new URL('../data/expenses.db', import.meta.url).pathname;
mkdirSync(dirname(dbPath), { recursive: true });

const db = createDb(dbPath);
const repo = createRepository(db);

const group = repo.createGroup('Goa Trip', ['Alice', 'Bob', 'Carol']);
const [alice, bob, carol] = group.members; // sorted by name: Alice, Bob, Carol
const all = group.members.map((m) => m.id);

repo.addExpense(group.id, {
  description: 'Hotel (2 nights)',
  amountCents: 6000,
  paidBy: alice.id,
  participantIds: all,
});
repo.addExpense(group.id, {
  description: 'Dinner',
  amountCents: 3000,
  paidBy: bob.id,
  participantIds: all,
});
repo.addExpense(group.id, {
  description: 'Cab & fuel',
  amountCents: 1500,
  paidBy: carol.id,
  participantIds: all,
});

console.log(`Seeded group "${group.name}" (id: ${group.id}) with 3 expenses.`);
db.close();
