const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper: today's date as YYYY-MM-DD
function today() {
  return new Date().toISOString().split('T')[0];
}

// Helper: attach checkins + computed streak to a habit row
function attachDetails(habit) {
  const checkins = db
    .prepare('SELECT date FROM checkins WHERE habit_id = ? ORDER BY date DESC')
    .all(habit.id)
    .map((row) => row.date);

  return {
    ...habit,
    checkIns: checkins,
    streak: calculateStreak(checkins),
  };
}

function calculateStreak(checkInDates) {
  if (checkInDates.length === 0) return 0;

  const sorted = [...checkInDates].sort().reverse();
  let streak = 0;
  let cursor = new Date(today());

  for (const dateStr of sorted) {
    const expected = cursor.toISOString().split('T')[0];
    if (dateStr === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ============================================
// Root — health check
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Habit Tracker API (SQLite-backed) is running',
    endpoints: [
      'GET    /habits',
      'POST   /habits',
      'GET    /habits/:id',
      'PUT    /habits/:id',
      'DELETE /habits/:id',
      'POST   /habits/:id/checkin',
    ],
  });
});

// ============================================
// GET /habits — list all habits (READ / SELECT)
// ============================================
app.get('/habits', (req, res) => {
  const rows = db.prepare('SELECT * FROM habits ORDER BY created_at DESC').all();
  const habits = rows.map(attachDetails);
  res.status(200).json({ count: habits.length, habits });
});

// ============================================
// POST /habits — create a habit (CREATE / INSERT)
// ============================================
app.post('/habits', (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "name" is required and must be a non-empty string.',
    });
  }
  if (name.length > 80) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "name" must be 80 characters or fewer.',
    });
  }

  // Parameterized query — never string-concatenate user input into SQL
  const result = db
    .prepare('INSERT INTO habits (name) VALUES (?)')
    .run(name.trim());

  const habit = db
    .prepare('SELECT * FROM habits WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(attachDetails(habit));
});

// ============================================
// GET /habits/:id — read a single habit
// ============================================
app.get('/habits/:id', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);

  if (!habit) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  res.status(200).json(attachDetails(habit));
});

// ============================================
// PUT /habits/:id — update a habit's name (UPDATE)
// ============================================
app.put('/habits/:id', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);

  if (!habit) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "name" is required and must be a non-empty string.',
    });
  }
  if (name.length > 80) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "name" must be 80 characters or fewer.',
    });
  }

  db.prepare('UPDATE habits SET name = ? WHERE id = ?').run(name.trim(), req.params.id);

  const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  res.status(200).json(attachDetails(updated));
});

// ============================================
// DELETE /habits/:id — delete a habit (DELETE)
// Cascades to its checkins via ON DELETE CASCADE
// ============================================
app.delete('/habits/:id', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);

  if (!habit) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  res.status(200).json({ message: 'Habit deleted.', habit: attachDetails(habit) });
});

// ============================================
// POST /habits/:id/checkin — mark today done
// ============================================
app.post('/habits/:id/checkin', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);

  if (!habit) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  const todayDate = today();

  try {
    db.prepare('INSERT INTO checkins (habit_id, date) VALUES (?, ?)').run(
      req.params.id,
      todayDate
    );
  } catch (err) {
    // UNIQUE(habit_id, date) constraint caught a duplicate check-in
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Habit has already been checked in today.',
      });
    }
    throw err;
  }

  const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  res.status(200).json(attachDetails(updated));
});

// ============================================
// 404 fallback for unknown routes
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// ============================================
// Global error handler (500)
// ============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server.',
  });
});

app.listen(PORT, () => {
  console.log(`Habit Tracker API (SQLite) listening on http://localhost:${PORT}`);
});
