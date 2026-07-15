import { randomUUID } from 'node:crypto';

/**
 * Thin data-access layer around the SQLite database. Keeping all SQL here
 * (instead of scattered through the routes) makes the API handlers easy to
 * read and the queries easy to test.
 */
export function createRepository(db) {
  return {
    // ---- Groups -------------------------------------------------------
    createGroup(name, memberNames) {
      const groupId = randomUUID();
      const insertGroup = db.prepare(
        'INSERT INTO groups (id, name) VALUES (?, ?)'
      );
      const insertMember = db.prepare(
        'INSERT INTO members (id, group_id, name) VALUES (?, ?, ?)'
      );

      // Wrap in a transaction so a group and its members are created atomically.
      const tx = db.transaction(() => {
        insertGroup.run(groupId, name);
        for (const memberName of memberNames) {
          insertMember.run(randomUUID(), groupId, memberName);
        }
      });
      tx();

      return this.getGroup(groupId);
    },

    listGroups() {
      return db
        .prepare('SELECT id, name, created_at FROM groups ORDER BY created_at DESC')
        .all();
    },

    getGroup(groupId) {
      const group = db
        .prepare('SELECT id, name, created_at FROM groups WHERE id = ?')
        .get(groupId);
      if (!group) return null;
      group.members = this.getMembers(groupId);
      return group;
    },

    getMembers(groupId) {
      return db
        .prepare('SELECT id, name FROM members WHERE group_id = ? ORDER BY name')
        .all(groupId);
    },

    addMember(groupId, name) {
      const id = randomUUID();
      db.prepare(
        'INSERT INTO members (id, group_id, name) VALUES (?, ?, ?)'
      ).run(id, groupId, name);
      return { id, name };
    },

    // ---- Expenses -----------------------------------------------------
    addExpense(groupId, { description, amountCents, paidBy, participantIds }) {
      const expenseId = randomUUID();
      const insertExpense = db.prepare(
        `INSERT INTO expenses (id, group_id, description, amount_cents, paid_by)
         VALUES (?, ?, ?, ?, ?)`
      );
      const insertParticipant = db.prepare(
        'INSERT INTO expense_participants (expense_id, member_id) VALUES (?, ?)'
      );

      const tx = db.transaction(() => {
        insertExpense.run(expenseId, groupId, description, amountCents, paidBy);
        for (const memberId of participantIds) {
          insertParticipant.run(expenseId, memberId);
        }
      });
      tx();

      return this.getExpense(expenseId);
    },

    getExpense(expenseId) {
      const expense = db
        .prepare(
          `SELECT id, group_id, description, amount_cents, paid_by, created_at
           FROM expenses WHERE id = ?`
        )
        .get(expenseId);
      if (!expense) return null;
      expense.participant_ids = db
        .prepare(
          'SELECT member_id FROM expense_participants WHERE expense_id = ?'
        )
        .all(expenseId)
        .map((r) => r.member_id);
      return expense;
    },

    listExpenses(groupId) {
      const rows = db
        .prepare(
          `SELECT id, description, amount_cents, paid_by, created_at
           FROM expenses WHERE group_id = ? ORDER BY created_at DESC`
        )
        .all(groupId);
      const participantsStmt = db.prepare(
        'SELECT member_id FROM expense_participants WHERE expense_id = ?'
      );
      for (const row of rows) {
        row.participant_ids = participantsStmt
          .all(row.id)
          .map((r) => r.member_id);
      }
      return rows;
    },

    deleteExpense(expenseId) {
      const info = db
        .prepare('DELETE FROM expenses WHERE id = ?')
        .run(expenseId);
      return info.changes > 0;
    },
  };
}
