const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'habits.db');
const db = new Database(DB_PATH);

// Enforce foreign key constraints (off by default in SQLite)
db.pragma('foreign_keys = ON');

// Load and run schema.sql on startup — safe to run every time
// since every statement uses IF NOT EXISTS
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
