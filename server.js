const express = require('express');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// SQLite Database Setup
const db = new sqlite3.Database('whiteboard.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase TEXT,
    goal TEXT,
    need TEXT,
    comments TEXT,
    execute TEXT,
    stage TEXT,
    commentArea TEXT,
    assigned_to TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);

  // Ensure whiteboard table exists
  db.run(`CREATE TABLE IF NOT EXISTS whiteboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canvasImage TEXT,
    stickyNotes TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert initial phase data
  const initialPhases = [
    ['Design', 'Define UI/UX', 'Wireframes', 'Use Figma', 'Y', 'review', '', 'team'],
    ['Design', 'Plan architecture', 'Tech stack', 'React + Node.js', 'N', 'in dev', '', 'team'],
    ['Development', 'Build frontend', 'React setup', 'Use Tailwind', 'Y', 'in dev', '', 'team'],
    ['Alpha Usage', 'Test core features', 'User feedback', 'Internal testers', 'N', 'testing', '', 'team'],
    ['Beta Release (Web)', 'Public beta', 'Hosting', 'AWS deploy', 'N', 'review', '', 'team']
  ];
  db.run(`INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, initialPhases[0]);
  db.run(`INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, initialPhases[1]);
  db.run(`INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, initialPhases[2]);
  db.run(`INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, initialPhases[3]);
  db.run(`INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, initialPhases[4]);
});

// --- Whiteboard State Table and Endpoints ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS whiteboard_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    state_json TEXT
  )`);
  // Ensure a row always exists
  db.run(`INSERT OR IGNORE INTO whiteboard_state (id, state_json) VALUES (1, '{}')`);
});

// Get the latest whiteboard state
app.get('/api/whiteboard', (req, res) => {
  db.get('SELECT state_json FROM whiteboard_state WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row ? JSON.parse(row.state_json) : {});
  });
});

// Save the latest whiteboard state
app.post('/api/whiteboard', (req, res) => {
  const stateJson = JSON.stringify(req.body);
  db.run('UPDATE whiteboard_state SET state_json = ? WHERE id = 1', [stateJson], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Add endpoints for saving and loading whiteboard state
app.post('/api/whiteboard/save', (req, res) => {
  const { canvasImage, stickyNotes } = req.body;
  if (!canvasImage || !stickyNotes) {
    return res.status(400).json({ error: 'Missing canvasImage or stickyNotes' });
  }
  db.run(
    'INSERT INTO whiteboard (canvasImage, stickyNotes) VALUES (?, ?)',
    [canvasImage, JSON.stringify(stickyNotes)],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ saved: true, id: this.lastID });
    }
  );
});

app.get('/api/whiteboard/latest', (req, res) => {
  db.get(
    'SELECT canvasImage, stickyNotes FROM whiteboard ORDER BY updatedAt DESC, id DESC LIMIT 1',
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.json({ canvasImage: null, stickyNotes: [] });
      }
      res.json({
        canvasImage: row.canvasImage,
        stickyNotes: JSON.parse(row.stickyNotes)
      });
    }
  );
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Set in .env file
    pass: process.env.EMAIL_PASS, // Set in .env file
  },
});

// API Endpoints
app.get('/api/phases', (req, res) => {
  db.all('SELECT * FROM phases', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/phases', (req, res) => {
  const { phase, goal, need, comments, execute, stage, commentArea, assigned_to } = req.body;
  db.run(
    'INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [phase, goal, need, comments, execute, stage, commentArea, assigned_to || 'team'],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/phases/:id', (req, res) => {
  const { id } = req.params;
  const { goal, need, comments, execute, stage, commentArea, assigned_to } = req.body;
  db.run(
    'UPDATE phases SET goal = ?, need = ?, comments = ?, execute = ?, stage = ?, commentArea = ?, assigned_to = ? WHERE id = ?',
    [goal, need, comments, execute, stage, commentArea, assigned_to || 'team', id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
});

// Delete a phase by id
app.delete('/api/phases/:id', (req, res) => {
  const { id } = req.params;
  console.log('DELETE /api/phases/:id called with id:', id);
  db.run('DELETE FROM phases WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Rows deleted:', this.changes);
    if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

app.get('/api/team', (req, res) => {
  db.all('SELECT * FROM team', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/invite', (req, res) => {
  const { username, email } = req.body;
  if (!username || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid username or email' });
    return;
  }
  db.run('INSERT INTO team (username, email) VALUES (?, ?)', [username, email], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User added', username });
  });
});

app.get('/api/join', (req, res) => {
  const { invite } = req.query;
  // In a real app, validate the invite ID and update team status
  res.json({ message: 'Joined successfully' });
});

app.listen(5000, () => console.log('Server running on port 5000')); 