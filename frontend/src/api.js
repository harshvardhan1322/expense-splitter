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

// Convert a "12.50" dollar string to integer cents, rounding safely.
export function toCents(dollars) {
  return Math.round(parseFloat(dollars) * 100);
}

export function formatMoney(cents) {
  return (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
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
