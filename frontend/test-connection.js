/**
 * Test script to verify Frontend <-> Backend connection
 * Run with: node test-connection.js
 */

const API_BASE = 'http://localhost:8000';

async function testConnection() {
  console.log('\n🔍 Testing Frontend-Backend Connection\n');
  console.log(`Frontend Port: 5173`);
  console.log(`Backend Port: 8000\n`);

  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE}/health`,
      method: 'GET'
    },
    {
      name: 'API Health',
      url: `${API_BASE}/api/health`,
      method: 'GET'
    },
    {
      name: 'List Conversations',
      url: `${API_BASE}/api/conversations`,
      method: 'GET'
    },
    {
      name: 'User Login',
      url: `${API_BASE}/api/auth/login`,
      method: 'POST',
      body: { email: 'test@example.com', password: 'test123' }
    }
  ];

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const status = response.status;
      const statusText = response.statusText;

      if (response.ok || response.status < 500) {
        console.log(`✅ ${test.name}`);
        console.log(`   URL: ${test.url}`);
        console.log(`   Status: ${status} ${statusText}\n`);
      } else {
        console.log(`⚠️ ${test.name}`);
        console.log(`   URL: ${test.url}`);
        console.log(`   Status: ${status} ${statusText}\n`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  console.log('━'.repeat(50));
  console.log('Connection Test Complete!');
  console.log('━'.repeat(50) + '\n');
}

testConnection();
