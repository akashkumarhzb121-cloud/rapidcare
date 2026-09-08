const axios = require('axios');

// Use 127.0.0.1 instead of localhost to avoid IPv6 issues
const API_URL = 'http://127.0.0.1:5000';

async function testAuth() {
  try {
    console.log('=== Testing Authentication ===\n');
    console.log('API URL:', API_URL);
    
    // Test health endpoint first
    console.log('0. Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_URL}/health`);
      console.log('✓ Server is running:', healthResponse.data);
    } catch (healthError) {
      console.error('✗ Server not reachable:', healthError.message);
      console.log('Make sure the backend server is running with: npm run dev');
      return;
    }
    
    // Test login
    console.log('\n1. Testing operator login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'operator@rapidcare.com',
      password: 'password123'
    }, {
      timeout: 5000
    });
    
    console.log('✓ Login successful');
    console.log('Token received:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('User role:', loginResponse.data.user.role);
    
    // Test creating incident
    console.log('\n2. Testing incident creation...');
    const token = loginResponse.data.token;
    
    const incidentResponse = await axios.post(`${API_URL}/api/incidents`, {
      patientDescription: '25-year-old female with severe leg pain',
      ambulanceLocation: {
        lat: 28.5139,
        lng: 77.1090
      }
    }, {
      headers: {
        'Authorization': 'Bearer ' + token
      },
      timeout: 10000
    });
    
    console.log('✓ Incident created successfully');
    console.log('Severity:', incidentResponse.data.incident.severity);
    console.log('Specialization:', incidentResponse.data.incident.requiredSpecialization);
    console.log('AI Reasoning:', incidentResponse.data.incident.aiReasoning);
    console.log('Matched Hospitals:', incidentResponse.data.matchedHospitals.length);
    incidentResponse.data.matchedHospitals.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.name} - ${h.distance} km - ${h.availableBeds} beds`);
    });
    
    console.log('\n=== All Tests Passed ===');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Server not running. Start with: npm run dev');
    } else if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    }
  }
}

testAuth();
