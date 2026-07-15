/**
 * Settlement engine.
 *
 * Given a set of expenses (who paid, and how the cost is split), we compute:
 *   1. Each member's *net balance* in integer cents
 *        netBalance = (total this member paid) - (total this member owes)
 *      A positive balance means the group owes them money (a creditor).
 *      A negative balance means they owe the group money (a debtor).
 *
 *   2. A minimized list of transactions that settles everyone up, using a
 *      greedy "min cash flow" strategy: repeatedly settle the biggest
 *      creditor against the biggest debtor. This produces at most (n - 1)
 *      transactions for n people with non-zero balances.
 *
 * All money is handled as integer cents to avoid floating-point rounding
 * errors (e.g. 0.1 + 0.2 !== 0.3 in IEEE-754 doubles).
 */

/**
 * Split an amount equally among participants, in cents, with no lost pennies.
 * Any indivisible remainder is distributed one cent at a time to the first
 * participants, so the shares always sum back to the original amount.
 *
 * @param {number} amountCents  total to split (integer cents)
 * @param {string[]} participantIds  member ids sharing the cost
 * @returns {Map<string, number>} memberId -> owed cents
 */
export function splitEqually(amountCents, participantIds) {
  const shares = new Map();
  const n = participantIds.length;
  if (n === 0) return shares;

  const base = Math.floor(amountCents / n);
  let remainder = amountCents - base * n; // 0 .. n-1 leftover cents

  for (const id of participantIds) {
    let share = base;
    if (remainder > 0) {
      share += 1;
      remainder -= 1;
    }
    shares.set(id, (shares.get(id) ?? 0) + share);
  }
  return shares;
}

/**
 * Compute each member's net balance in cents from a list of expenses.
 *
 * @param {string[]} memberIds
 * @param {Array<{paidBy: string, amountCents: number, participantIds: string[]}>} expenses
 * @returns {Map<string, number>} memberId -> net balance cents
 */
export function computeBalances(memberIds, expenses) {
  const balances = new Map(memberIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    // The payer fronted the whole amount -> credit them.
    balances.set(
      expense.paidBy,
      (balances.get(expense.paidBy) ?? 0) + expense.amountCents
    );

    // Everyone sharing the expense owes their split -> debit them.
    const shares = splitEqually(expense.amountCents, expense.participantIds);
    for (const [memberId, owed] of shares) {
      balances.set(memberId, (balances.get(memberId) ?? 0) - owed);
    }
  }

  return balances;
}

/**
 * Greedily minimize the number of transactions needed to settle up.
 *
 * Strategy (max-heap greedy / "min cash flow"):
 *   - Split members into creditors (balance > 0) and debtors (balance < 0).
 *   - Repeatedly match the largest creditor with the largest debtor and
 *     transfer min(credit, debt). At least one of them is zeroed out each
 *     step, so the loop runs at most (n - 1) times.
 *
 * Note: finding the provably fewest transactions is NP-hard (it reduces to
 * subset-sum partitioning). This greedy approach is the standard, efficient
 * solution and is optimal in the common case; it always yields <= n-1
 * transfers, far fewer than the naive "everyone pays everyone" O(n^2).
 *
 * @param {Map<string, number>} balances  memberId -> net balance cents
 * @returns {Array<{from: string, to: string, amountCents: number}>}
 */
export function minimizeTransactions(balances) {
  const creditors = []; // { id, amount } amount > 0
  const debtors = []; // { id, amount } amount > 0 (magnitude of debt)

  for (const [id, amount] of balances) {
    if (amount > 0) creditors.push({ id, amount });
    else if (amount < 0) debtors.push({ id, amount: -amount });
  }

  // Sort descending so we always take the biggest first. Re-sorting each
  // iteration keeps the logic simple and clear; n is small in practice.
  const transactions = [];
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const creditor = creditors[0];
    const debtor = debtors[0];
    const transfer = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amountCents: transfer,
    });

    creditor.amount -= transfer;
    debtor.amount -= transfer;

    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }

  return transactions;
}

/**
 * Convenience wrapper: expenses -> settlement plan.
 *
 * @returns {{
 *   balances: Array<{memberId: string, netCents: number}>,
 *   settlements: Array<{from: string, to: string, amountCents: number}>
 * }}
 */
export function settle(memberIds, expenses) {
  const balances = computeBalances(memberIds, expenses);
  const settlements = minimizeTransactions(balances);
  return {
    balances: [...balances].map(([memberId, netCents]) => ({
      memberId,
      netCents,
    })),
    settlements,
  };
}
