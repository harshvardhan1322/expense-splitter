import { formatMoney } from '../api.js';
import { initials, tintFor } from '../ui.js';

function Person({ name, align }) {
  return (
    <span className={`person ${align === 'right' ? 'to' : ''}`}>
      {align !== 'right' && (
        <span className="avatar avatar--sm" style={{ background: tintFor(name) }}>
          {initials(name)}
        </span>
      )}
      <span className="person__name">{name}</span>
      {align === 'right' && (
        <span className="avatar avatar--sm" style={{ background: tintFor(name) }}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}

/**
 * Shows each member's net position and the minimized list of "who pays whom"
 * transactions returned by the settlement engine.
 */
export default function SettlementPanel({ settlement }) {
  if (!settlement) return null;
  const { balances, settlements } = settlement;

  return (
    <section className="card card--feature">
      <h3 className="card__title">Settle up</h3>

      <div className="balances">
        {balances.map((b) => {
          const state =
            b.netCents > 0 ? 'positive' : b.netCents < 0 ? 'negative' : 'zero';
          return (
            <div key={b.memberId} className={`balance balance--${state}`}>
              <Person name={b.name} />
              <span className="balance__amount num">
                {b.netCents === 0 ? (
                  'settled up'
                ) : (
                  <>
                    <span className="faint small">
                      {b.netCents > 0 ? 'gets back ' : 'owes '}
                    </span>
                    {formatMoney(Math.abs(b.netCents))}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="plan">
        <div className="plan__head">
          <span className="eyebrow">Payment plan</span>
          <span className="plan__count num">
            {settlements.length} transfer{settlements.length === 1 ? '' : 's'}
          </span>
        </div>

        {settlements.length === 0 ? (
          <p className="settled">Everyone is square</p>
        ) : (
          <ul className="settlement-list">
            {settlements.map((s, i) => (
              <li key={i} className="settlement-list__item">
                <Person name={s.fromName} />
                <span className="arrow">→</span>
                <Person name={s.toName} align="right" />
                <span className="amount num">{formatMoney(s.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
