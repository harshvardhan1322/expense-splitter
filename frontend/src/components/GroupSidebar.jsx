import { useState } from 'react';

export default function GroupSidebar({ groups, activeGroupId, onSelect, onCreate }) {
  const [name, setName] = useState('');
  const [memberText, setMemberText] = useState('');

  const members = memberText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const canCreate = name.trim() && members.length >= 2;

  function submit(e) {
    e.preventDefault();
    if (!canCreate) return;
    onCreate(name.trim(), members);
    setName('');
    setMemberText('');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <span className="eyebrow">Groups</span>
        <ul className="group-list">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                className={`group-list__item ${
                  g.id === activeGroupId ? 'is-active' : ''
                }`}
                onClick={() => onSelect(g.id)}
              >
                {g.name}
              </button>
            </li>
          ))}
          {groups.length === 0 && (
            <li className="faint small">No groups yet</li>
          )}
        </ul>
      </div>

      <div className="sidebar__section">
        <span className="eyebrow">New group</span>
        <form className="new-group" onSubmit={submit}>
          <input
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Members, comma-separated"
            value={memberText}
            onChange={(e) => setMemberText(e.target.value)}
          />
          <button type="submit" className="btn btn--primary" disabled={!canCreate}>
            Create group
          </button>
          <span className="faint small">Needs at least 2 members.</span>
        </form>
      </div>
    </aside>
  );
}
