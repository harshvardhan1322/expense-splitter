import { formatMoney } from '../api.js';

/**
 * Shows each member's net position and the minimized list of "who pays whom"
 * transactions returned by the settlement engine.
 */
export default function SettlementPanel({ settlement }) {
  if (!settlement) return null;
  const { balances, settlements } = settlement;

  return (
    <section className="card settlement">
      <h3>Settle up</h3>

      <div className="balances">
        {balances.map((b) => {
          const state =
            b.netCents > 0 ? 'positive' : b.netCents < 0 ? 'negative' : 'zero';
          return (
            <div key={b.memberId} className={`balance balance--${state}`}>
              <span>{b.name}</span>
              <span>
                {b.netCents > 0 && 'gets back '}
                {b.netCents < 0 && 'owes '}
                {b.netCents === 0
                  ? 'settled up'
                  : formatMoney(Math.abs(b.netCents))}
              </span>
            </div>
          );
        })}
      </div>

      <h4 className="settlement__heading">
        Payment plan{' '}
        <span className="muted small">
          ({settlements.length} transfer{settlements.length === 1 ? '' : 's'})
        </span>
      </h4>

      {settlements.length === 0 ? (
        <p className="muted">Everyone's square — nothing to settle. 🎉</p>
      ) : (
        <ul className="settlement-list">
          {settlements.map((s, i) => (
            <li key={i} className="settlement-list__item">
              <span className="from">{s.fromName}</span>
              <span className="arrow">→</span>
              <span className="to">{s.toName}</span>
              <span className="amount">{formatMoney(s.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
