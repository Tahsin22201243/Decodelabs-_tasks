# Habit Tracker API

A simple in-memory REST API for tracking daily habits and streaks, built with
Node.js and Express. No database, no frameworks beyond Express — just
endpoints, validation, and clear status codes.

## Setup

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`.

For auto-restart on file changes during development:

```bash
npm run dev
```

## Endpoints

| Method | Route                    | Description                          |
|--------|---------------------------|---------------------------------------|
| GET    | `/`                        | Health check + endpoint list         |
| GET    | `/habits`                  | List all habits                      |
| POST   | `/habits`                  | Create a new habit                   |
| GET    | `/habits/:id`               | Get a single habit                   |
| POST   | `/habits/:id/checkin`       | Mark today as done for a habit       |
| DELETE | `/habits/:id`               | Delete a habit                       |

### Create a habit

```bash
curl -X POST http://localhost:3000/habits \
  -H "Content-Type: application/json" \
  -d '{"name": "Drink water"}'
```

Returns `201 Created` with the new habit object, or `400 Bad Request` if
`name` is missing, empty, or too long.

### Check in

```bash
curl -X POST http://localhost:3000/habits/<id>/checkin
```

Returns `200 OK` with the updated habit (streak incremented), `404 Not Found`
if the habit doesn't exist, or `409 Conflict` if already checked in today.

### List / Get / Delete

Standard REST behavior — `404` for unknown IDs, `200` on success.

## Status codes used

- `200` — successful GET / DELETE / checkin
- `201` — habit created
- `400` — invalid input (validation failure)
- `404` — habit or route not found
- `409` — duplicate check-in for the same day
- `500` — unexpected server error

## Notes

Data is stored in memory only — restarting the server clears all habits.
This project intentionally skips a database to focus on API design:
routing, validation, and status codes.
