const express = require('express');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors({ origin: 'https://leewaller93.github.io' }));
app.use(express.json());

// MongoDB/Mongoose Setup
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schemas and Models
const PhaseSchema = new mongoose.Schema({
  phase: String,
  goal: String,
  need: String,
  comments: String,
  execute: String,
  stage: String,
  commentArea: String,
  assigned_to: String
});
const Phase = mongoose.model('Phase', PhaseSchema);

const TeamSchema = new mongoose.Schema({
  username: String,
  email: String,
  org: { type: String, default: 'PHG' },
  not_working: { type: Boolean, default: false }
});
const Team = mongoose.model('Team', TeamSchema);

const ProjectSchema = new mongoose.Schema({
  _id: { type: Number, default: 1 },
  name: String
});
const Project = mongoose.model('Project', ProjectSchema);

const WhiteboardSchema = new mongoose.Schema({
  canvasImage: String,
  stickyNotes: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
});
const Whiteboard = mongoose.model('Whiteboard', WhiteboardSchema);

const WhiteboardStateSchema = new mongoose.Schema({
  _id: { type: Number, default: 1 },
  state_json: mongoose.Schema.Types.Mixed
});
const WhiteboardState = mongoose.model('WhiteboardState', WhiteboardStateSchema);

// Seed Demo Data if Collections are Empty
async function seedDemoData() {
  if ((await Team.countDocuments()) === 0) {
    const demoTeam = [
      { username: 'Alice Johnson', email: 'alice.johnson@demo.com', org: 'PHG' },
      { username: 'Bob Smith', email: 'bob.smith@demo.com', org: 'PHG' },
      { username: 'Carol Lee', email: 'carol.lee@demo.com', org: 'PHG' },
      { username: 'David Kim', email: 'david.kim@demo.com', org: 'PHG' }
    ];
    await Team.insertMany(demoTeam);
    console.log('Demo team seeded');
  }
  if ((await Phase.countDocuments()) === 0) {
    const demoTasks = [
      { phase: 'Outstanding', goal: 'General Ledger Review', need: '', comments: 'Audit the hospital’s existing general ledger to verify account balances, identify errors, and ensure GAAP compliance.', execute: 'One-Time', stage: 'Outstanding', commentArea: '', assigned_to: 'Alice Johnson' },
      { phase: 'Outstanding', goal: 'Accrual Process Assessment', need: '', comments: 'Evaluate current accrual methods for revenue (e.g., unbilled patient services) and expenses (e.g., utilities, salaries) for accuracy and consistency.', execute: 'One-Time', stage: 'Outstanding', commentArea: '', assigned_to: 'Bob Smith' },
      { phase: 'Outstanding', goal: 'Chart of Accounts Validation', need: '', comments: 'Review and align the hospital’s chart of accounts to ensure proper categorization for journal entries and financial reporting.', execute: 'One-Time', stage: 'Outstanding', commentArea: '', assigned_to: 'Carol Lee' },
      { phase: 'Outstanding', goal: 'Prior Period Entry Analysis', need: '', comments: 'Examine historical journal entries to identify recurring issues or misclassifications, preparing correcting entries as needed.', execute: 'One-Time', stage: 'Outstanding', commentArea: '', assigned_to: 'David Kim' },
      { phase: 'Outstanding', goal: 'Financial Statement Baseline Review', need: '', comments: 'Assess prior financial statements (balance sheet, income statement, cash flow statement) to establish a baseline for ongoing preparation and ensure compliance with GAAP and HIPAA.', execute: 'One-Time', stage: 'Outstanding', commentArea: '', assigned_to: 'Alice Johnson' },
      { phase: 'In Process', goal: 'Revenue Accrual Entries', need: '', comments: 'Post journal entries for accrued revenue from unbilled patient services, using patient encounter data and estimated insurance reimbursements.', execute: 'Weekly', stage: 'In Process', commentArea: '', assigned_to: 'Bob Smith' },
      { phase: 'In Process', goal: 'Expense Accrual Entries', need: '', comments: 'Record accrued expenses for incurred but unpaid costs (e.g., utilities, vendor services) based on historical data or pending invoices.', execute: 'Weekly', stage: 'In Process', commentArea: '', assigned_to: 'Carol Lee' },
      { phase: 'In Process', goal: 'Cash Receipt Journal Entries', need: '', comments: 'Log journal entries for cash receipts from patients or insurers, debiting cash and crediting revenue or accounts receivable.', execute: 'Weekly', stage: 'In Process', commentArea: '', assigned_to: 'David Kim' },
      { phase: 'In Process', goal: 'Preliminary Journal Review', need: '', comments: 'Review weekly journal entries for correct account coding, completeness, and supporting documentation (e.g., payment records).', execute: 'Weekly', stage: 'In Process', commentArea: '', assigned_to: 'Alice Johnson' },
      { phase: 'In Process', goal: 'Adjusting Entry Corrections', need: '', comments: 'Prepare and post adjusting entries to correct errors or discrepancies identified during weekly general ledger reviews.', execute: 'Weekly', stage: 'In Process', commentArea: '', assigned_to: 'Bob Smith' },
      { phase: 'Review/Discussion', goal: 'Month-End Accrual Finalization', need: '', comments: 'Finalize and post accrual entries for revenue (e.g., unbilled procedures, pending claims) and expenses (e.g., salaries, leases) to align with GAAP.', execute: 'Monthly', stage: 'Review/Discussion', commentArea: '', assigned_to: 'Carol Lee' },
      { phase: 'Review/Discussion', goal: 'Depreciation Journal Entries', need: '', comments: 'Record monthly depreciation entries for hospital assets (e.g., medical equipment, facilities) using established schedules.', execute: 'Monthly', stage: 'Review/Discussion', commentArea: '', assigned_to: 'David Kim' },
      { phase: 'Review/Discussion', goal: 'Prepaid Expense Amortization', need: '', comments: 'Post journal entries to amortize prepaid expenses (e.g., insurance, software licenses) over their applicable periods.', execute: 'Monthly', stage: 'Review/Discussion', commentArea: '', assigned_to: 'Alice Johnson' },
      { phase: 'Resolved', goal: 'Financial Statement Preparation', need: '', comments: 'Prepare monthly financial statements (balance sheet, income statement, cash flow statement) using journal entry data, ensuring accuracy and GAAP compliance.', execute: 'Monthly', stage: 'Resolved', commentArea: '', assigned_to: 'Bob Smith' },
      { phase: 'Resolved', goal: 'Comprehensive Ledger and Financial Review', need: '', comments: 'Conduct a detailed review of all monthly journal entries and financial statements, verifying accuracy, accrual integrity, and compliance with GAAP and HIPAA.', execute: 'Monthly', stage: 'Resolved', commentArea: '', assigned_to: 'Carol Lee' },
      { phase: 'Resolved', goal: 'Accrual Reversal Entries', need: '', comments: 'Post reversing entries for prior month’s accruals (e.g., paid invoices, settled claims) to prevent double-counting in the ledger.', execute: 'Monthly', stage: 'Resolved', commentArea: '', assigned_to: 'David Kim' }
    ];
    await Phase.insertMany(demoTasks);
    console.log('Demo phases seeded');
  }
  if ((await Project.countDocuments()) === 0) {
    await Project.create({ _id: 1, name: '' });
    console.log('Demo project seeded');
  }
  if ((await WhiteboardState.countDocuments()) === 0) {
    await WhiteboardState.create({ _id: 1, state_json: {} });
    console.log('Demo whiteboard state seeded');
  }
}

seedDemoData();

// --- Whiteboard State Endpoints ---
app.get('/api/whiteboard', async (req, res) => {
  try {
    const state = await WhiteboardState.findById(1);
    res.json(state ? state.state_json : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whiteboard', async (req, res) => {
  try {
    await WhiteboardState.findByIdAndUpdate(1, { state_json: req.body }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Whiteboard Save/Load Endpoints ---
app.post('/api/whiteboard/save', async (req, res) => {
  const { canvasImage, stickyNotes } = req.body;
  if (!canvasImage || !stickyNotes) {
    return res.status(400).json({ error: 'Missing canvasImage or stickyNotes' });
  }
  try {
    const wb = await Whiteboard.create({ canvasImage, stickyNotes });
    res.json({ saved: true, id: wb._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/whiteboard/latest', async (req, res) => {
  try {
    const wb = await Whiteboard.findOne().sort({ updatedAt: -1, _id: -1 });
    if (!wb) return res.json({ canvasImage: null, stickyNotes: [] });
    res.json({ canvasImage: wb.canvasImage, stickyNotes: wb.stickyNotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Project Name Endpoints ---
app.post('/api/project', async (req, res) => {
  const { name } = req.body;
  try {
    await Project.findByIdAndUpdate(1, { name }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/project', async (req, res) => {
  try {
    const project = await Project.findById(1);
    res.json({ name: project ? project.name : '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
app.get('/api/phases', async (req, res) => {
  try {
    const phases = await Phase.find();
    res.json(phases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phases', async (req, res) => {
  try {
    const phase = await Phase.create(req.body);
    res.json({ id: phase._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/phases/:id', async (req, res) => {
  try {
    const updated = await Phase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ updated: !!updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/phases/:id', async (req, res) => {
  try {
    const deleted = await Phase.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Team Endpoints ---
app.get('/api/team', async (req, res) => {
  try {
    const team = await Team.find();
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invite', async (req, res) => {
  const { username, email, org } = req.body;
  if (!username || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid username or email' });
  }
  try {
    await Team.create({ username, email, org: org || 'PHG' });
    res.json({ message: 'User added', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/team/:id/not-working', async (req, res) => {
  const { id } = req.params;
  const { reassign_to } = req.body;
  try {
    const member = await Team.findById(id);
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    // Reassign all tasks
    await Phase.updateMany({ assigned_to: member.username }, { assigned_to: reassign_to || 'team' });
    // Mark as not working
    await Team.findByIdAndUpdate(id, { not_working: true });
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/team/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const member = await Team.findById(id);
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    const count = await Phase.countDocuments({ assigned_to: member.username });
    if (count > 0) return res.status(400).json({ error: 'Cannot delete: member is assigned to tasks' });
    await Team.findByIdAndDelete(id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/join', (req, res) => {
  const { invite } = req.query;
  // In a real app, validate the invite ID and update team status
  res.json({ message: 'Joined successfully' });
});

app.listen(5000, () => console.log('Server running on port 5000')); 