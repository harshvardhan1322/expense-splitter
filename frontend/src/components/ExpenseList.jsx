import { formatMoney } from '../api.js';

export default function ExpenseList({ expenses, members, onDelete }) {
  const nameOf = Object.fromEntries(members.map((m) => [m.id, m.name]));

  return (
    <section className="card">
      <h3 className="card__title">Expenses</h3>
      {expenses.length === 0 ? (
        <p className="faint small">No expenses yet.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((e) => (
            <li key={e.id} className="expense-list__item">
              <div>
                <div className="desc">{e.description}</div>
                <div className="meta">
                  {nameOf[e.paid_by] ?? '—'} paid · split{' '}
                  {e.participant_ids.length} ways
                </div>
              </div>
              <div className="expense-list__right">
                <span className="expense-list__amount num">
                  {formatMoney(e.amount_cents)}
                </span>
                <button
                  className="btn btn--ghost"
                  title="Delete expense"
                  aria-label={`Delete ${e.description}`}
                  onClick={() => onDelete(e.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
