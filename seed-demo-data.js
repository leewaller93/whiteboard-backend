const fetch = require('node-fetch');

const API_URL = process.env.SEED_API_URL || 'http://localhost:5000/api';

const teamMembers = [
  { username: 'Alice Johnson', email: 'alice.johnson@demo.com', org: 'PHG' },
  { username: 'Bob Smith', email: 'bob.smith@demo.com', org: 'PHG' },
  { username: 'Carol Lee', email: 'carol.lee@demo.com', org: 'PHG' },
  { username: 'David Kim', email: 'david.kim@demo.com', org: 'PHG' }
];

const tasks = [
  { goal: 'General Ledger Review', comments: 'Audit the hospital’s existing general ledger to verify account balances, identify errors, and ensure GAAP compliance.', execute: 'One-Time', stage: 'Outstanding' },
  { goal: 'Accrual Process Assessment', comments: 'Evaluate current accrual methods for revenue (e.g., unbilled patient services) and expenses (e.g., utilities, salaries) for accuracy and consistency.', execute: 'One-Time', stage: 'Outstanding' },
  { goal: 'Chart of Accounts Validation', comments: 'Review and align the hospital’s chart of accounts to ensure proper categorization for journal entries and financial reporting.', execute: 'One-Time', stage: 'Outstanding' },
  { goal: 'Prior Period Entry Analysis', comments: 'Examine historical journal entries to identify recurring issues or misclassifications, preparing correcting entries as needed.', execute: 'One-Time', stage: 'Outstanding' },
  { goal: 'Financial Statement Baseline Review', comments: 'Assess prior financial statements (balance sheet, income statement, cash flow statement) to establish a baseline for ongoing preparation and ensure compliance with GAAP and HIPAA.', execute: 'One-Time', stage: 'Outstanding' },
  { goal: 'Revenue Accrual Entries', comments: 'Post journal entries for accrued revenue from unbilled patient services, using patient encounter data and estimated insurance reimbursements.', execute: 'Weekly', stage: 'In Process' },
  { goal: 'Expense Accrual Entries', comments: 'Record accrued expenses for incurred but unpaid costs (e.g., utilities, vendor services) based on historical data or pending invoices.', execute: 'Weekly', stage: 'In Process' },
  { goal: 'Cash Receipt Journal Entries', comments: 'Log journal entries for cash receipts from patients or insurers, debiting cash and crediting revenue or accounts receivable.', execute: 'Weekly', stage: 'In Process' },
  { goal: 'Preliminary Journal Review', comments: 'Review weekly journal entries for correct account coding, completeness, and supporting documentation (e.g., payment records).', execute: 'Weekly', stage: 'In Process' },
  { goal: 'Adjusting Entry Corrections', comments: 'Prepare and post adjusting entries to correct errors or discrepancies identified during weekly general ledger reviews.', execute: 'Weekly', stage: 'In Process' },
  { goal: 'Month-End Accrual Finalization', comments: 'Finalize and post accrual entries for revenue (e.g., unbilled procedures, pending claims) and expenses (e.g., salaries, leases) to align with GAAP.', execute: 'Monthly', stage: 'Review/Discussion' },
  { goal: 'Depreciation Journal Entries', comments: 'Record monthly depreciation entries for hospital assets (e.g., medical equipment, facilities) using established schedules.', execute: 'Monthly', stage: 'Review/Discussion' },
  { goal: 'Prepaid Expense Amortization', comments: 'Post journal entries to amortize prepaid expenses (e.g., insurance, software licenses) over their applicable periods.', execute: 'Monthly', stage: 'Review/Discussion' },
  { goal: 'Financial Statement Preparation', comments: 'Prepare monthly financial statements (balance sheet, income statement, cash flow statement) using journal entry data, ensuring accuracy and GAAP compliance.', execute: 'Monthly', stage: 'Resolved' },
  { goal: 'Comprehensive Ledger and Financial Review', comments: 'Conduct a detailed review of all monthly journal entries and financial statements, verifying accuracy, accrual integrity, and compliance with GAAP and HIPAA.', execute: 'Monthly', stage: 'Resolved' },
  { goal: 'Accrual Reversal Entries', comments: 'Post reversing entries for prior month’s accruals (e.g., paid invoices, settled claims) to prevent double-counting in the ledger.', execute: 'Monthly', stage: 'Resolved' }
];

async function addTeamMembers() {
  for (const member of teamMembers) {
    const res = await fetch(`${API_URL}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    if (res.ok) {
      console.log(`Added team member: ${member.username}`);
    } else {
      const err = await res.text();
      console.error(`Failed to add ${member.username}: ${err}`);
    }
  }
}

async function getTeam() {
  const res = await fetch(`${API_URL}/team`);
  return res.ok ? await res.json() : [];
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function addTasks(team) {
  for (const task of tasks) {
    const assigned_to = randomFromArray(team).username;
    const payload = {
      phase: task.stage,
      goal: task.goal,
      need: '',
      comments: task.comments,
      execute: task.execute,
      stage: task.stage,
      commentArea: '',
      assigned_to
    };
    const res = await fetch(`${API_URL}/phases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log(`Added task: ${task.goal} (assigned to ${assigned_to})`);
    } else {
      const err = await res.text();
      console.error(`Failed to add task ${task.goal}: ${err}`);
    }
  }
}

(async () => {
  await addTeamMembers();
  const team = await getTeam();
  if (team.length === 0) {
    console.error('No team members found, aborting task creation.');
    return;
  }
  await addTasks(team);
  console.log('All demo data uploaded!');
})(); 