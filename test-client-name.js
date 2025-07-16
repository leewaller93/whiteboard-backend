// test-client-name.js
const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'https://has-status-backend.onrender.com/api';
const testName = 'Test Client Lee Rule';

async function testClientName() {
  // Save the client name
  const saveRes = await fetch(`${API_URL}/project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testName })
  });
  const saveJson = await saveRes.json();
  console.log('Save response:', saveJson);

  // Load the client name
  const getRes = await fetch(`${API_URL}/project`);
  const getJson = await getRes.json();
  console.log('Loaded client name:', getJson);

  if (getJson.name === testName) {
    console.log('✅ Client name persisted successfully!');
  } else {
    console.log('❌ Client name did NOT persist.');
  }
}

testClientName().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
}); 