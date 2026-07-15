/**
 * Tiny fetch wrapper around the backend REST API. Every call returns parsed
 * JSON and throws a readable Error on non-2xx responses.
 */
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Convert a "12.50" rupee string to integer paise (1 rupee = 100 paise),
// rounding safely so we never store a fractional smallest-unit.
export function toCents(rupees) {
  return Math.round(parseFloat(rupees) * 100);
}

export function formatMoney(paise) {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  });
}

export const api = {
  listGroups: () => request('/groups'),
  createGroup: (name, members) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, members }),
    }),
  getGroup: (id) => request(`/groups/${id}`),
  addMember: (groupId, name) =>
    request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  listExpenses: (groupId) => request(`/groups/${groupId}/expenses`),
  addExpense: (groupId, expense) =>
    request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense),
    }),
  deleteExpense: (expenseId) =>
    request(`/expenses/${expenseId}`, { method: 'DELETE' }),
  getSettlement: (groupId) => request(`/groups/${groupId}/settlement`),
};
