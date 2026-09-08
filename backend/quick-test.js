const axios = require('axios');

async function quickTest() {
  try {
    console.log('Testing server...');
    
    // Test health
    const health = await axios.get('http://127.0.0.1:5000/health');
    console.log('✓ Health check:', health.data);
    
    // Test login
    const login = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'operator@rapidcare.com',
      password: 'password123'
    });
    console.log('✓ Login:', login.data.user.name);
    
    // Test incident with location
    const incident = await axios.post('http://127.0.0.1:5000/api/incidents', {
      patientDescription: '65-year-old male with severe chest pain',
      patientLocation: 'Connaught Place, New Delhi'
    }, {
      headers: { 'Authorization': 'Bearer ' + login.data.token }
    });
    
    console.log('✓ Incident created');
    console.log('  Severity:', incident.data.incident.severity);
    console.log('  Hospitals:', incident.data.matchedHospitals.length);
    incident.data.matchedHospitals.forEach(h => {
      console.log(`  - ${h.name}: ${h.distance} km, ${h.travelTime?.formatted}, ${h.availableBeds} beds`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

quickTest();
