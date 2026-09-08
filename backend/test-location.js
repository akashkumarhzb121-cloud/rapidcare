const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000';

async function testCompleteSystem() {
  console.log('=== RapidCare Complete System Test ===\n');
  
  try {
    // Login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'operator@rapidcare.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✓ Login successful\n');
    
    // Test 1: Location-based incident
    console.log('Test 1: Create incident with address');
    const response1 = await axios.post(`${API_URL}/api/incidents`, {
      patientDescription: 'Elderly male with crushing chest pain',
      patientLocation: 'Connaught Place, New Delhi'
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✓ Incident created');
    console.log('  Severity:', response1.data.incident.severity);
    console.log('  Specialization:', response1.data.incident.requiredSpecialization);
    console.log('  Matched Hospitals:', response1.data.matchedHospitals.length);
    response1.data.matchedHospitals.forEach((h, i) => {
      console.log(`    ${i + 1}. ${h.name} - ${h.distance} km - ${h.availableBeds} beds - ${h.travelTime?.formatted || 'N/A'}`);
    });
    console.log('');
    
    // Test 2: Another location
    console.log('Test 2: Create incident in different area');
    const response2 = await axios.post(`${API_URL}/api/incidents`, {
      patientDescription: 'Young woman with severe asthma attack',
      patientLocation: 'Saket, New Delhi'
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('✓ Incident created');
    console.log('  Severity:', response2.data.incident.severity);
    console.log('  Matched Hospitals:', response2.data.matchedHospitals.length);
    console.log('');
    
    console.log('=== All Tests Passed ===');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
  }
}

testCompleteSystem();
