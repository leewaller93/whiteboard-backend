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
  console.log('--- DB SEEDING START ---');
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
  )`, (err) => { if (err) console.error('Error creating phases table:', err); else console.log('Phases table ready'); });

  db.run(`CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    org TEXT DEFAULT 'PHG',
    not_working INTEGER DEFAULT 0
  )`, (err) => { if (err) console.error('Error creating team table:', err); else console.log('Team table ready'); });

  db.run(`CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`, (err) => { if (err) console.error('Error creating project table:', err); else console.log('Project table ready'); });

  db.run(`CREATE TABLE IF NOT EXISTS whiteboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canvasImage TEXT,
    stickyNotes TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => { if (err) console.error('Error creating whiteboard table:', err); else console.log('Whiteboard table ready'); });

  // --- CLEAR EXISTING DATA ---
  db.run('DELETE FROM phases', (err) => { if (err) console.error('Error clearing phases:', err); else console.log('Phases cleared'); });
  db.run('DELETE FROM team', (err) => { if (err) console.error('Error clearing team:', err); else console.log('Team cleared'); });

  // --- INSERT DEMO TEAM MEMBERS ---
  const demoTeam = [
    ['Alice Johnson', 'alice.johnson@demo.com', 'PHG'],
    ['Bob Smith', 'bob.smith@demo.com', 'PHG'],
    ['Carol Lee', 'carol.lee@demo.com', 'PHG'],
    ['David Kim', 'david.kim@demo.com', 'PHG']
  ];
  for (const member of demoTeam) {
    db.run(`INSERT INTO team (username, email, org) VALUES (?, ?, ?)`, member, (err) => {
      if (err) console.error('Error inserting team member:', member, err);
      else console.log('Inserted team member:', member[0]);
    });
  }

  // --- INSERT DEMO TASKS ---
  const demoTasks = [
    ['Outstanding', 'General Ledger Review', '', 'Audit the hospital’s existing general ledger to verify account balances, identify errors, and ensure GAAP compliance.', 'One-Time', 'Outstanding', '', 'Alice Johnson'],
    ['Outstanding', 'Accrual Process Assessment', '', 'Evaluate current accrual methods for revenue (e.g., unbilled patient services) and expenses (e.g., utilities, salaries) for accuracy and consistency.', 'One-Time', 'Outstanding', '', 'Bob Smith'],
    ['Outstanding', 'Chart of Accounts Validation', '', 'Review and align the hospital’s chart of accounts to ensure proper categorization for journal entries and financial reporting.', 'One-Time', 'Outstanding', '', 'Carol Lee'],
    ['Outstanding', 'Prior Period Entry Analysis', '', 'Examine historical journal entries to identify recurring issues or misclassifications, preparing correcting entries as needed.', 'One-Time', 'Outstanding', '', 'David Kim'],
    ['Outstanding', 'Financial Statement Baseline Review', '', 'Assess prior financial statements (balance sheet, income statement, cash flow statement) to establish a baseline for ongoing preparation and ensure compliance with GAAP and HIPAA.', 'One-Time', 'Outstanding', '', 'Alice Johnson'],
    ['In Process', 'Revenue Accrual Entries', '', 'Post journal entries for accrued revenue from unbilled patient services, using patient encounter data and estimated insurance reimbursements.', 'Weekly', 'In Process', '', 'Bob Smith'],
    ['In Process', 'Expense Accrual Entries', '', 'Record accrued expenses for incurred but unpaid costs (e.g., utilities, vendor services) based on historical data or pending invoices.', 'Weekly', 'In Process', '', 'Carol Lee'],
    ['In Process', 'Cash Receipt Journal Entries', '', 'Log journal entries for cash receipts from patients or insurers, debiting cash and crediting revenue or accounts receivable.', 'Weekly', 'In Process', '', 'David Kim'],
    ['In Process', 'Preliminary Journal Review', '', 'Review weekly journal entries for correct account coding, completeness, and supporting documentation (e.g., payment records).', 'Weekly', 'In Process', '', 'Alice Johnson'],
    ['In Process', 'Adjusting Entry Corrections', '', 'Prepare and post adjusting entries to correct errors or discrepancies identified during weekly general ledger reviews.', 'Weekly', 'In Process', '', 'Bob Smith'],
    ['Review/Discussion', 'Month-End Accrual Finalization', '', 'Finalize and post accrual entries for revenue (e.g., unbilled procedures, pending claims) and expenses (e.g., salaries, leases) to align with GAAP.', 'Monthly', 'Review/Discussion', '', 'Carol Lee'],
    ['Review/Discussion', 'Depreciation Journal Entries', '', 'Record monthly depreciation entries for hospital assets (e.g., medical equipment, facilities) using established schedules.', 'Monthly', 'Review/Discussion', '', 'David Kim'],
    ['Review/Discussion', 'Prepaid Expense Amortization', '', 'Post journal entries to amortize prepaid expenses (e.g., insurance, software licenses) over their applicable periods.', 'Monthly', 'Review/Discussion', '', 'Alice Johnson'],
    ['Resolved', 'Financial Statement Preparation', '', 'Prepare monthly financial statements (balance sheet, income statement, cash flow statement) using journal entry data, ensuring accuracy and GAAP compliance.', 'Monthly', 'Resolved', '', 'Bob Smith'],
    ['Resolved', 'Comprehensive Ledger and Financial Review', '', 'Conduct a detailed review of all monthly journal entries and financial statements, verifying accuracy, accrual integrity, and compliance with GAAP and HIPAA.', 'Monthly', 'Resolved', '', 'Carol Lee'],
    ['Resolved', 'Accrual Reversal Entries', '', 'Post reversing entries for prior month’s accruals (e.g., paid invoices, settled claims) to prevent double-counting in the ledger.', 'Monthly', 'Resolved', '', 'David Kim']
  ];
  for (const task of demoTasks) {
    db.run(`INSERT INTO phases (phase, goal, need, comments, execute, stage, commentArea, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, task, (err) => {
      if (err) console.error('Error inserting task:', task[1], err);
      else console.log('Inserted task:', task[1]);
    });
  }
  console.log('--- DB SEEDING END ---');
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

// Update team endpoints to support org and not_working
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
  const { username, email, org } = req.body;
  if (!username || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid username or email' });
    return;
  }
  db.run('INSERT INTO team (username, email, org) VALUES (?, ?, ?)', [username, email, org || 'PHG'], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User added', username });
  });
});

// Mark team member as not working and reassign tasks
app.patch('/api/team/:id/not-working', (req, res) => {
  const { id } = req.params;
  const { reassign_to } = req.body;
  db.get('SELECT username FROM team WHERE id = ?', [id], (err, member) => {
    if (err || !member) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }
    // Reassign all tasks
    db.run('UPDATE phases SET assigned_to = ? WHERE assigned_to = ?', [reassign_to || 'team', member.username], function (err2) {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      // Mark as not working
      db.run('UPDATE team SET not_working = 1 WHERE id = ?', [id], function (err3) {
        if (err3) {
          res.status(500).json({ error: err3.message });
          return;
        }
        res.json({ updated: true });
      });
    });
  });
});

// Delete team member only if not assigned to any tasks
app.delete('/api/team/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT username FROM team WHERE id = ?', [id], (err, member) => {
    if (err || !member) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }
    db.get('SELECT COUNT(*) as count FROM phases WHERE assigned_to = ?', [member.username], (err2, row) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      if (row.count > 0) {
        res.status(400).json({ error: 'Cannot delete: member is assigned to tasks' });
        return;
      }
      db.run('DELETE FROM team WHERE id = ?', [id], function (err3) {
        if (err3) {
          res.status(500).json({ error: err3.message });
          return;
        }
        res.json({ deleted: true });
      });
    });
  });
});

app.get('/api/join', (req, res) => {
  const { invite } = req.query;
  // In a real app, validate the invite ID and update team status
  res.json({ message: 'Joined successfully' });
});

app.listen(5000, () => console.log('Server running on port 5000')); 