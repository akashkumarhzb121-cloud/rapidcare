const axios = require('axios');

async function testMultipleCities() {
  try {
    const login = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'operator@rapidcare.com',
      password: 'password123'
    });
    const token = login.data.token;
    
    const cities = [
      { desc: 'Heart attack symptoms', location: 'Connaught Place, New Delhi' },
      { desc: 'Severe breathing problem', location: 'Andheri, Mumbai' },
      { desc: 'Accident with injuries', location: 'Malviya Nagar, Jaipur' },
      { desc: 'Stroke symptoms', location: 'Bannerghatta Road, Bangalore' }
    ];
    
    for (const test of cities) {
      console.log(`\n=== ${test.location} ===`);
      const response = await axios.post('http://127.0.0.1:5000/api/incidents', {
        patientDescription: test.desc,
        patientLocation: test.location
      }, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      console.log(`✓ Incident created`);
      console.log(`  Severity: ${response.data.incident.severity}`);
      console.log(`  Specialization: ${response.data.incident.requiredSpecialization}`);
      console.log(`  Hospitals: ${response.data.matchedHospitals.length}`);
      response.data.matchedHospitals.slice(0, 3).forEach(h => {
        console.log(`    - ${h.name}: ${h.distance} km, ${h.availableBeds} beds`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMultipleCities();
