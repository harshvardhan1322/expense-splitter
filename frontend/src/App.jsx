import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
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

  return (
    <div className="app">
      <header className="app__header">
        <h1>💸 Expense Splitter</h1>
        <p className="app__subtitle">
          Split group expenses and settle up in the fewest possible payments.
        </p>
      </header>

      {error && <div className="banner banner--error">⚠️ {error}</div>}

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
              <p>Create a group to get started 👈</p>
            </div>
          ) : (
            <>
              <section className="card">
                <h2>{group.name}</h2>
                <div className="members">
                  {group.members.map((m) => (
                    <span key={m.id} className="chip">
                      {m.name}
                    </span>
                  ))}
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
