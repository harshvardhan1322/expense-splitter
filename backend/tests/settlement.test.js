import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitEqually,
  computeBalances,
  minimizeTransactions,
  settle,
} from '../src/settlement.js';

test('splitEqually divides evenly with no remainder', () => {
  const shares = splitEqually(900, ['a', 'b', 'c']);
  assert.equal(shares.get('a'), 300);
  assert.equal(shares.get('b'), 300);
  assert.equal(shares.get('c'), 300);
});

test('splitEqually distributes leftover cents and never loses a penny', () => {
  // 1000 cents / 3 = 333.33..; remainder of 1 cent goes to the first person.
  const shares = splitEqually(1000, ['a', 'b', 'c']);
  assert.equal(shares.get('a'), 334);
  assert.equal(shares.get('b'), 333);
  assert.equal(shares.get('c'), 333);
  const total = [...shares.values()].reduce((s, v) => s + v, 0);
  assert.equal(total, 1000);
});

test('computeBalances: payer is credited, participants are debited', () => {
  // Alice pays $30 dinner split among all three.
  const balances = computeBalances(
    ['alice', 'bob', 'carol'],
    [{ paidBy: 'alice', amountCents: 3000, participantIds: ['alice', 'bob', 'carol'] }]
  );
  assert.equal(balances.get('alice'), 2000); // paid 3000, owes 1000
  assert.equal(balances.get('bob'), -1000);
  assert.equal(balances.get('carol'), -1000);
  // Balances of a closed system always sum to zero.
  const sum = [...balances.values()].reduce((s, v) => s + v, 0);
  assert.equal(sum, 0);
});

test('minimizeTransactions settles a simple two-person debt', () => {
  const txns = minimizeTransactions(
    new Map([
      ['alice', 1000],
      ['bob', -1000],
    ])
  );
  assert.deepEqual(txns, [{ from: 'bob', to: 'alice', amountCents: 1000 }]);
});

test('minimizeTransactions uses at most n-1 transfers', () => {
  // Classic case: one payer covered a $30 bill for 3 people.
  const balances = new Map([
    ['alice', 2000],
    ['bob', -1000],
    ['carol', -1000],
  ]);
  const txns = minimizeTransactions(balances);
  assert.ok(txns.length <= 2, `expected <= 2 transfers, got ${txns.length}`);
  // Every debtor is fully paid off and the creditor is fully repaid.
  assert.equal(sumTo(txns, 'alice'), 2000);
  assert.equal(sumFrom(txns, 'bob'), 1000);
  assert.equal(sumFrom(txns, 'carol'), 1000);
});

test('minimizeTransactions collapses a cycle into fewer transfers', () => {
  // A owes B, B owes C, C owes A — naively 3 transfers, but net balances
  // reveal it can settle in fewer.
  const balances = new Map([
    ['a', 500],
    ['b', 0],
    ['c', -500],
  ]);
  const txns = minimizeTransactions(balances);
  assert.equal(txns.length, 1);
  assert.deepEqual(txns[0], { from: 'c', to: 'a', amountCents: 500 });
});

test('settle: end-to-end trip with several expenses balances out', () => {
  const members = ['alice', 'bob', 'carol'];
  const expenses = [
    { paidBy: 'alice', amountCents: 6000, participantIds: members }, // hotel $60
    { paidBy: 'bob', amountCents: 3000, participantIds: members }, // dinner $30
    { paidBy: 'carol', amountCents: 1500, participantIds: members }, // gas $15
  ];
  const { balances, settlements } = settle(members, expenses);

  // Net balances sum to zero.
  const sum = balances.reduce((s, b) => s + b.netCents, 0);
  assert.equal(sum, 0);

  // Applying every settlement transfer must zero out all balances.
  const net = new Map(balances.map((b) => [b.memberId, b.netCents]));
  for (const s of settlements) {
    net.set(s.from, net.get(s.from) + s.amountCents);
    net.set(s.to, net.get(s.to) - s.amountCents);
  }
  for (const v of net.values()) assert.equal(v, 0);

  // Minimized: 3 people => at most 2 transfers.
  assert.ok(settlements.length <= 2);
});

function sumTo(txns, id) {
  return txns.filter((t) => t.to === id).reduce((s, t) => s + t.amountCents, 0);
}
function sumFrom(txns, id) {
  return txns.filter((t) => t.from === id).reduce((s, t) => s + t.amountCents, 0);
}
