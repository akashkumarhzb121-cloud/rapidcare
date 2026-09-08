const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSystem() {
  console.log('=== RapidCare System Test (Groq AI) ===\n');
  
  try {
    // Test 1: Login
    console.log('1. Testing operator login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'operator@rapidcare.com',
      password: 'password123'
    });
    console.log('✓ Login successful');
    console.log('  User:', loginResponse.data.user.name);
    console.log('  Role:', loginResponse.data.user.role);
    const token = loginResponse.data.token;
    
    // Test 2: List hospitals
    console.log('\n2. Fetching hospitals...');
    const hospitalsResponse = await axios.get(`${API_URL}/api/hospitals`);
    console.log('✓ Hospitals fetched:', hospitalsResponse.data.hospitals.length);
    hospitalsResponse.data.hospitals.forEach(h => {
      console.log(`  - ${h.name}: ${h.availableBeds}/${h.totalBeds} beds`);
    });
    
    // Test 3: Create cardiac emergency
    console.log('\n3. Creating cardiac emergency incident...');
    const cardiacIncident = await axios.post(`${API_URL}/api/incidents`, {
      patientDescription: '65-year-old male complaining of severe chest pain radiating to left arm, sweating profusely, shortness of breath for 30 minutes',
      ambulanceLocation: { lat: 28.6139, lng: 77.2090 }
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const incident1 = cardiacIncident.data.incident;
    console.log('✓ Incident created');
    console.log('  Severity:', incident1.severity);
    console.log('  Specialization:', incident1.requiredSpecialization);
    console.log('  AI Reasoning:', incident1.aiReasoning);
    console.log('  Matched Hospitals:', cardiacIncident.data.matchedHospitals.length);
    cardiacIncident.data.matchedHospitals.forEach((h, i) => {
      console.log(`    ${i + 1}. ${h.name} - ${h.distance} km - ${h.availableBeds} beds`);
    });
    
    // Test 4: Create respiratory emergency
    console.log('\n4. Creating respiratory emergency incident...');
    const respiratoryIncident = await axios.post(`${API_URL}/api/incidents`, {
      patientDescription: 'Young adult with severe asthma attack, wheezing, difficulty breathing, lips turning blue',
      ambulanceLocation: { lat: 28.6304, lng: 77.2177 }
    }, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const incident2 = respiratoryIncident.data.incident;
    console.log('✓ Incident created');
    console.log('  Severity:', incident2.severity);
    console.log('  Specialization:', incident2.requiredSpecialization);
    console.log('  AI Reasoning:', incident2.aiReasoning);
    
    // Test 5: Dispatch first incident
    if (cardiacIncident.data.matchedHospitals.length > 0) {
      console.log('\n5. Dispatching incident to first hospital...');
      const dispatchResponse = await axios.patch(
        `${API_URL}/api/incidents/${incident1._id}/dispatch`,
        { hospitalId: cardiacIncident.data.matchedHospitals[0]._id },
        { headers: { 'Authorization': 'Bearer ' + token } }
      );
      console.log('✓ Dispatch successful');
      console.log('  Status:', dispatchResponse.data.incident.status);
      console.log('  Hospital:', dispatchResponse.data.incident.assignedHospitalId);
    }
    
    console.log('\n=== All Tests Passed ===');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

testSystem();
