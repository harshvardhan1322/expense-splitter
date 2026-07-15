import { useEffect, useState, useCallback } from 'react';
import { api, formatMoney } from './api.js';
import { initials, tintFor } from './ui.js';
import GroupSidebar from './components/GroupSidebar.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import SettlementPanel from './components/SettlementPanel.jsx';

export default function App() {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [error, setError] = useState(null);

  const refreshGroups = useCallback(async () => {
    const list = await api.listGroups();
    setGroups(list);
    // Auto-select the first group if none is active yet.
    setActiveGroupId((current) => current ?? list[0]?.id ?? null);
  }, []);

  // Load everything for the currently selected group.
  const refreshActiveGroup = useCallback(async (groupId) => {
    if (!groupId) {
      setGroup(null);
      setExpenses([]);
      setSettlement(null);
      return;
    }
    const [g, e, s] = await Promise.all([
      api.getGroup(groupId),
      api.listExpenses(groupId),
      api.getSettlement(groupId),
    ]);
    setGroup(g);
    setExpenses(e);
    setSettlement(s);
  }, []);

  useEffect(() => {
    refreshGroups().catch((err) => setError(err.message));
  }, [refreshGroups]);

  useEffect(() => {
    refreshActiveGroup(activeGroupId).catch((err) => setError(err.message));
  }, [activeGroupId, refreshActiveGroup]);

  // Run an async action, then refresh derived data and surface any error.
  async function run(action) {
    setError(null);
    try {
      await action();
      await refreshActiveGroup(activeGroupId);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1>Expense Splitter</h1>
          <p className="masthead__sub">
            Settle group spending in the fewest transfers.
          </p>
        </div>
        {group && (
          <div className="masthead__stat">
            <span className="eyebrow">Total spent</span>
            <span className="value num">{formatMoney(totalCents)}</span>
          </div>
        )}
      </header>

      {error && <div className="banner banner--error">{error}</div>}

      <div className="layout">
        <GroupSidebar
          groups={groups}
          activeGroupId={activeGroupId}
          onSelect={setActiveGroupId}
          onCreate={async (name, members) => {
            setError(null);
            try {
              const created = await api.createGroup(name, members);
              await refreshGroups();
              setActiveGroupId(created.id);
            } catch (err) {
              setError(err.message);
            }
          }}
        />

        <main className="content">
          {!group ? (
            <div className="empty">
              <p>Create a group to get started.</p>
            </div>
          ) : (
            <>
              <section className="card">
                <div className="group-head">
                  <div>
                    <h2>{group.name}</h2>
                    <p className="group-head__meta">
                      {group.members.length} members · {expenses.length} expense
                      {expenses.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="avatar-stack">
                    {group.members.map((m) => (
                      <span
                        key={m.id}
                        className="avatar"
                        style={{ background: tintFor(m.name) }}
                        title={m.name}
                      >
                        {initials(m.name)}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <ExpenseForm
                members={group.members}
                onAdd={(expense) => run(() => api.addExpense(group.id, expense))}
              />

              <div className="two-col">
                <ExpenseList
                  expenses={expenses}
                  members={group.members}
                  onDelete={(id) => run(() => api.deleteExpense(id))}
                />
                <SettlementPanel settlement={settlement} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
