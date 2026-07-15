import { formatMoney } from '../api.js';

export default function ExpenseList({ expenses, members, onDelete }) {
  const nameOf = Object.fromEntries(members.map((m) => [m.id, m.name]));

  return (
    <section className="card">
      <h3>Expenses</h3>
      {expenses.length === 0 ? (
        <p className="muted">No expenses yet. Add one above.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((e) => (
            <li key={e.id} className="expense-list__item">
              <div>
                <strong>{e.description}</strong>
                <div className="muted small">
                  {formatMoney(e.amount_cents)} · paid by{' '}
                  {nameOf[e.paid_by] ?? '—'} · split{' '}
                  {e.participant_ids.length} ways
                </div>
              </div>
              <button
                className="btn btn--ghost"
                title="Delete expense"
                onClick={() => onDelete(e.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
