import { useState } from 'react';
import { toCents } from '../api.js';

export default function ExpenseForm({ members, onAdd }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? '');
  // Everyone is a participant by default (the common case for equal splits).
  const [participants, setParticipants] = useState(() =>
    new Set(members.map((m) => m.id))
  );

  function toggle(id) {
    setParticipants((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function submit(e) {
    e.preventDefault();
    const amountCents = toCents(amount);
    if (!description.trim() || !amountCents || amountCents <= 0) return;
    if (participants.size === 0) return;

    onAdd({
      description: description.trim(),
      amountCents,
      paidBy,
      participantIds: [...participants],
    });
    setDescription('');
    setAmount('');
  }

  const perHead =
    participants.size > 0 && amount
      ? (toCents(amount) / 100 / participants.size).toFixed(2)
      : null;

  return (
    <form className="card expense-form" onSubmit={submit}>
      <h3>Add an expense</h3>
      <div className="expense-form__row">
        <input
          className="grow"
          placeholder="What was it for? (e.g. Dinner)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              paid by {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="expense-form__participants">
        <span className="muted">Split equally between:</span>
        {members.map((m) => (
          <label key={m.id} className="check">
            <input
              type="checkbox"
              checked={participants.has(m.id)}
              onChange={() => toggle(m.id)}
            />
            {m.name}
          </label>
        ))}
      </div>

      <div className="expense-form__footer">
        {perHead && (
          <span className="muted">
            ${perHead} each · {participants.size} people
          </span>
        )}
        <button type="submit" className="btn btn--primary">
          Add expense
        </button>
      </div>
    </form>
  );
}
