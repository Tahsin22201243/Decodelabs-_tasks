-- ============================================
-- habits: one row per tracked habit
-- ============================================
CREATE TABLE IF NOT EXISTS habits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL CHECK (length(trim(name)) > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- checkins: one row per day a habit was completed
-- One habit has MANY checkins (1:Many relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS checkins (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id  INTEGER NOT NULL,
  date      TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE (habit_id, date)  -- prevents checking in twice on the same day
);

CREATE INDEX IF NOT EXISTS idx_checkins_habit_id ON checkins(habit_id);
