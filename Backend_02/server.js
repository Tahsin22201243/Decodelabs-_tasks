const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ============================================
// In-memory "database"
// ============================================
let habits = [];

// Helper: today's date as YYYY-MM-DD
function today() {
  return new Date().toISOString().split('T')[0];
}

// Helper: recalculate streak based on checkIns array
function calculateStreak(checkIns) {
  if (checkIns.length === 0) return 0;

  const sorted = [...checkIns].sort().reverse(); // newest first
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
// Root — simple health check
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Habit Tracker API is running',
    endpoints: [
      'GET    /habits',
      'POST   /habits',
      'GET    /habits/:id',
      'DELETE /habits/:id',
      'POST   /habits/:id/checkin',
    ],
  });
});

// ============================================
// GET /habits — list all habits
// ============================================
app.get('/habits', (req, res) => {
  res.status(200).json({ count: habits.length, habits });
});

// ============================================
// POST /habits — create a new habit
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

  const habit = {
    id: randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    checkIns: [],
    streak: 0,
  };

  habits.push(habit);
  res.status(201).json(habit);
});

// ============================================
// GET /habits/:id — get a single habit
// ============================================
app.get('/habits/:id', (req, res) => {
  const habit = habits.find((h) => h.id === req.params.id);

  if (!habit) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  res.status(200).json(habit);
});

// ============================================
// POST /habits/:id/checkin — mark today done
// ============================================
app.post('/habits/:id/checkin', (req, res) => {
  const habit = habits.find((h) => h.id === req.params.id);

  if (!habit) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  const todayDate = today();

  if (habit.checkIns.includes(todayDate)) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Habit has already been checked in today.',
    });
  }

  habit.checkIns.push(todayDate);
  habit.streak = calculateStreak(habit.checkIns);

  res.status(200).json(habit);
});

// ============================================
// DELETE /habits/:id — remove a habit
// ============================================
app.delete('/habits/:id', (req, res) => {
  const index = habits.findIndex((h) => h.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `No habit found with id "${req.params.id}".`,
    });
  }

  const [removed] = habits.splice(index, 1);
  res.status(200).json({ message: 'Habit deleted.', habit: removed });
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
  console.log(`Habit Tracker API listening on http://localhost:${PORT}`);
});
