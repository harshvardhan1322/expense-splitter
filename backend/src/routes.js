import { Router } from 'express';
import { settle } from './settlement.js';

/**
 * REST API routes. Handlers stay thin: validate input, call the repository,
 * shape the response. All money crosses the wire as integer cents.
 */
export function createRouter(repo) {
  const router = Router();

  const asDollars = (cents) => cents / 100;

  // ---- Groups ---------------------------------------------------------
  router.get('/groups', (req, res) => {
    res.json(repo.listGroups());
  });

  router.post('/groups', (req, res) => {
    const { name, members } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const memberNames = Array.isArray(members)
      ? members.map((m) => String(m).trim()).filter(Boolean)
      : [];
    if (memberNames.length < 2) {
      return res
        .status(400)
        .json({ error: 'a group needs at least 2 members' });
    }
    res.status(201).json(repo.createGroup(name.trim(), memberNames));
  });

  router.get('/groups/:groupId', (req, res) => {
    const group = repo.getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'group not found' });
    res.json(group);
  });

  router.post('/groups/:groupId/members', (req, res) => {
    const group = repo.getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'group not found' });
    const name = String(req.body?.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(repo.addMember(group.id, name));
  });

  // ---- Expenses -------------------------------------------------------
  router.get('/groups/:groupId/expenses', (req, res) => {
    const group = repo.getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'group not found' });
    res.json(repo.listExpenses(group.id));
  });

  router.post('/groups/:groupId/expenses', (req, res) => {
    const group = repo.getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'group not found' });

    const { description, amountCents, paidBy, participantIds } = req.body ?? {};
    const memberIds = new Set(group.members.map((m) => m.id));

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required' });
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return res
        .status(400)
        .json({ error: 'amountCents must be a positive integer' });
    }
    if (!memberIds.has(paidBy)) {
      return res.status(400).json({ error: 'paidBy must be a group member' });
    }
    const participants = Array.isArray(participantIds) ? participantIds : [];
    if (participants.length === 0 || !participants.every((id) => memberIds.has(id))) {
      return res
        .status(400)
        .json({ error: 'participantIds must be non-empty group members' });
    }

    res.status(201).json(
      repo.addExpense(group.id, {
        description: description.trim(),
        amountCents,
        paidBy,
        participantIds: participants,
      })
    );
  });

  router.delete('/expenses/:expenseId', (req, res) => {
    const ok = repo.deleteExpense(req.params.expenseId);
    if (!ok) return res.status(404).json({ error: 'expense not found' });
    res.status(204).end();
  });

  // ---- Settlement -----------------------------------------------------
  router.get('/groups/:groupId/settlement', (req, res) => {
    const group = repo.getGroup(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'group not found' });

    const memberIds = group.members.map((m) => m.id);
    const expenses = repo.listExpenses(group.id).map((e) => ({
      paidBy: e.paid_by,
      amountCents: e.amount_cents,
      participantIds: e.participant_ids,
    }));

    const { balances, settlements } = settle(memberIds, expenses);
    const nameOf = Object.fromEntries(group.members.map((m) => [m.id, m.name]));

    res.json({
      balances: balances.map((b) => ({
        memberId: b.memberId,
        name: nameOf[b.memberId],
        netCents: b.netCents,
        net: asDollars(b.netCents),
      })),
      settlements: settlements.map((s) => ({
        from: s.from,
        fromName: nameOf[s.from],
        to: s.to,
        toName: nameOf[s.to],
        amountCents: s.amountCents,
        amount: asDollars(s.amountCents),
      })),
    });
  });

  return router;
}
