# 💸 Expense Splitter with Settlement Algorithm

A full-stack app to split shared group expenses (trips, flatmates, dinners) and
settle everyone up in the **fewest possible payments**. Built as a portfolio
project to demonstrate REST API design, data modeling, a real algorithm, and a
React frontend.

![stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite-6366f1)

## Why this project is interesting

The core is the **settlement algorithm**. Naively, if 5 friends owe each other
money, you might make up to 5×4 = 20 payments. This app reduces that to **at
most `n − 1` transfers** using a greedy "min cash flow" strategy:

1. Compute each person's **net balance** = `(total they paid) − (total they owe)`.
2. Split people into **creditors** (owed money) and **debtors** (owe money).
3. Repeatedly settle the **largest creditor** against the **largest debtor**,
   transferring `min(credit, debt)`. Each step zeroes out at least one person,
   so the loop runs `≤ n − 1` times.

> Finding the *provably* fewest transactions is NP-hard (it reduces to
> subset-sum partitioning). This greedy approach is the standard, efficient
> solution and is optimal in the common case — a good talking point in
> interviews.

**Money is stored as integer cents everywhere** to avoid floating-point
rounding bugs (`0.1 + 0.2 !== 0.3`). Indivisible remainders (e.g. $10 split 3
ways) are distributed a penny at a time so shares always sum back to the total.

See the implementation in
[`backend/src/settlement.js`](backend/src/settlement.js) and its tests in
[`backend/tests/settlement.test.js`](backend/tests/settlement.test.js).

## Tech stack

| Layer     | Choice                                  |
| --------- | --------------------------------------- |
| Frontend  | React 18 + Vite                         |
| Backend   | Node.js + Express (REST API)            |
| Database  | SQLite (via `better-sqlite3`)           |
| Tests     | Node's built-in `node:test` runner      |

## Project structure

```
P1/
├── backend/
│   ├── src/
│   │   ├── settlement.js   # ⭐ the algorithm (pure, tested)
│   │   ├── db.js           # SQLite schema + connection
│   │   ├── repository.js   # data-access layer (all SQL lives here)
│   │   ├── routes.js       # REST endpoints
│   │   ├── server.js       # Express app entry point
│   │   └── seed.js         # sample "Goa Trip" data
│   └── tests/
│       └── settlement.test.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js          # fetch wrapper
        └── components/     # GroupSidebar, ExpenseForm, ExpenseList, SettlementPanel
```

## Getting started

**Prerequisites:** Node.js 18+.

### 1. Backend

```bash
cd backend
npm install
npm run seed     # optional: creates a sample group with expenses
npm start        # API on http://localhost:3001
```

Run the tests:

```bash
npm test
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev      # UI on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` calls to the
backend, so both run side by side.

## API reference

| Method   | Endpoint                          | Description                          |
| -------- | --------------------------------- | ------------------------------------ |
| `GET`    | `/api/groups`                     | List all groups                      |
| `POST`   | `/api/groups`                     | Create a group `{ name, members[] }` |
| `GET`    | `/api/groups/:id`                 | Group details + members              |
| `POST`   | `/api/groups/:id/members`         | Add a member `{ name }`              |
| `GET`    | `/api/groups/:id/expenses`        | List expenses                        |
| `POST`   | `/api/groups/:id/expenses`        | Add an expense (see below)           |
| `DELETE` | `/api/expenses/:id`               | Delete an expense                    |
| `GET`    | `/api/groups/:id/settlement`      | Balances + minimized payment plan    |

**Add expense body:**

```json
{
  "description": "Dinner",
  "amountCents": 3000,
  "paidBy": "<memberId>",
  "participantIds": ["<memberId>", "<memberId>"]
}
```

## Possible extensions

- Unequal / percentage / share-based splits (the schema already isolates
  participants per expense, so this is a natural next step).
- User accounts + authentication.
- Multi-currency support.
- Export a settlement summary as PDF.

## What I learned / demonstrated

- Designing a normalized relational schema with foreign keys and cascades.
- Keeping business logic (the algorithm) **pure and unit-tested**, separate
  from I/O.
- Avoiding floating-point money bugs by working in integer cents.
- Building a clean REST API and a React SPA that consumes it.
