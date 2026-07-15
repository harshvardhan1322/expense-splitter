import { useState } from 'react';

export default function GroupSidebar({ groups, activeGroupId, onSelect, onCreate }) {
  const [name, setName] = useState('');
  const [memberText, setMemberText] = useState('');

  function submit(e) {
    e.preventDefault();
    const members = memberText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || members.length < 2) return;
    onCreate(name.trim(), members);
    setName('');
    setMemberText('');
  }

  return (
    <aside className="sidebar">
      <h3>Groups</h3>
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
        {groups.length === 0 && <li className="muted">No groups yet</li>}
      </ul>

      <form className="new-group" onSubmit={submit}>
        <h4>New group</h4>
        <input
          placeholder="Group name (e.g. Goa Trip)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Members, comma-separated"
          value={memberText}
          onChange={(e) => setMemberText(e.target.value)}
        />
        <small className="muted">At least 2 members.</small>
        <button type="submit" className="btn btn--primary">
          Create group
        </button>
      </form>
    </aside>
  );
}
