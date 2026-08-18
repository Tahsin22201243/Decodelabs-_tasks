# Habit Tracker API — SQLite Edition (Project 3)

The Project 2 Habit Tracker API, upgraded from in-memory storage to a real
persistent database. Same concept, now with actual data longevity: habits
and check-ins survive server restarts.

## Stack

- **Node.js + Express** — HTTP layer
- **SQLite** via `better-sqlite3` — file-based relational database, no
  separate server process to install or run
- Raw parameterized SQL (no ORM) — so every query is visible and explicit

## Schema

Two tables with a **one-to-many relationship**: one habit has many check-ins.

```sql
habits
├── id          INTEGER PRIMARY KEY AUTOINCREMENT
├── name        TEXT NOT NULL CHECK (length(trim(name)) > 0)
└── created_at  TEXT NOT NULL DEFAULT (datetime('now'))

checkins
├── id          INTEGER PRIMARY KEY AUTOINCREMENT
├── habit_id    INTEGER NOT NULL  → FOREIGN KEY → habits.id (ON DELETE CASCADE)
├── date        TEXT NOT NULL
└── UNIQUE (habit_id, date)   -- enforced at the DB level, not just in code
```

Deleting a habit automatically deletes its check-ins (`ON DELETE CASCADE`) —
integrity is enforced by the schema itself, not by application logic.

See `schema.sql` for the full definition. It runs automatically on server
start (`db.js`), so the database file is created on first run.

## Setup

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`. A `habits.db` file is created in
the project folder — that file *is* your database. Restart the server and
your data is still there.

## Endpoints

| Method | Route                  | SQL operation |
|--------|-------------------------|----------------|
| GET    | `/habits`                | SELECT (all)  |
| POST   | `/habits`                | INSERT        |
| GET    | `/habits/:id`             | SELECT (one)  |
| PUT    | `/habits/:id`             | UPDATE        |
| DELETE | `/habits/:id`             | DELETE        |
| POST   | `/habits/:id/checkin`     | INSERT        |

This mirrors the standard CRUD → HTTP → SQL mapping:

```
Create = POST   = INSERT
Read   = GET    = SELECT
Update = PUT    = UPDATE
Delete = DELETE = DELETE
```

### Example requests

```bash
# Create
curl -X POST http://localhost:3000/habits \
  -H "Content-Type: application/json" \
  -d '{"name": "Drink water"}'

# Rename
curl -X PUT http://localhost:3000/habits/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Drink more water"}'

# Check in today
curl -X POST http://localhost:3000/habits/1/checkin

# Delete
curl -X DELETE http://localhost:3000/habits/1
```

## Status codes

- `200` — success (GET / PUT / DELETE / checkin)
- `201` — habit created
- `400` — invalid input
- `404` — habit or route not found
- `409` — duplicate check-in for the same day (caught by the database's
  `UNIQUE` constraint, not just a JS `if` check)
- `500` — unexpected server error

## Security note: parameterized queries

Every query uses `?` placeholders with values passed separately —
`db.prepare('INSERT INTO habits (name) VALUES (?)').run(name)` — never
raw string concatenation. This is what prevents SQL injection: user input
is always treated as data, never as executable SQL.

## What's different from Project 2

- Data is stored in `habits.db` (SQLite file) instead of a JS array —
  survives restarts
- Added `PUT /habits/:id` for updates (full CRUD, not just CR-D)
- Duplicate check-in prevention is now a database constraint
  (`UNIQUE(habit_id, date)`), not application logic
- Check-ins live in their own table with a foreign key, demonstrating a
  real one-to-many relationship
