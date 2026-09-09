const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000';

async function testAll() {
  console.log('=== RapidCare Full System Test ===\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Health Check');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✓ Server running:', health.data.status);
    console.log('');
    
    // Test 2: Login as CHW
    console.log('2. Login as CHW');
    const chwLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'chw@rapidcare.com',
      password: 'password123'
    });
    console.log('✓ CHW login successful:', chwLogin.data.user.name);
    console.log('  Role:', chwLogin.data.user.role);
    const chwToken = chwLogin.data.token;
    console.log('');
    
    // Test 3: Register Patient
    console.log('3. Register Patient');
    const patientResponse = await axios.post(`${API_URL}/api/patients`, {
      name: 'Test Patient',
      age: 35,
      gender: 'female',
      village: 'Test Village',
      district: 'Nagpur',
      phone: '+91-1234567890',
      languagePreference: 'hindi',
      chronicConditions: ['diabetes'],
      highRiskFlags: ['chronic']
    }, {
      headers: { 'Authorization': `Bearer ${chwToken}` }
    });
    console.log('✓ Patient registered:', patientResponse.data.patient.name);
    const patientId = patientResponse.data.patient._id;
    console.log('');
    
    // Test 4: Get Facilities
    console.log('4. List Facilities');
    const facilitiesResponse = await axios.get(`${API_URL}/api/facilities`);
    console.log('✓ Facilities found:', facilitiesResponse.data.facilities.length);
    facilitiesResponse.data.facilities.forEach(f => {
      console.log(`  - ${f.name} (${f.facilityType})`);
    });
    const subCentreId = facilitiesResponse.data.facilities.find(f => f.facilityType === 'sub-centre')._id;
    const districtHospitalId = facilitiesResponse.data.facilities.find(f => f.facilityType === 'district-hospital')._id;
    console.log('');
    
    // Test 5: Create Referral (Mild Case)
    console.log('5. Create Referral (Mild Case)');
    const mildReferral = await axios.post(`${API_URL}/api/referrals`, {
      patientId,
      fromFacilityId: subCentreId,
      toFacilityId: districtHospitalId,
      patientDescription: 'Mild fever and body ache for 2 days',
      patientLocation: 'Test Village, Nagpur'
    }, {
      headers: { 'Authorization': `Bearer ${chwToken}` }
    });
    console.log('✓ Referral created');
    console.log('  Severity:', mildReferral.data.aiResponse.severity);
    console.log('  Type:', mildReferral.data.referral.referralType);
    console.log('  Status:', mildReferral.data.referral.status);
    console.log('  Incident created:', mildReferral.data.incident ? 'YES' : 'NO');
    console.log('');
    
    // Test 6: Create Referral (Critical Case)
    console.log('6. Create Referral (Critical Case)');
    const criticalReferral = await axios.post(`${API_URL}/api/referrals`, {
      patientId,
      fromFacilityId: subCentreId,
      toFacilityId: districtHospitalId,
      patientDescription: 'Severe chest pain with difficulty breathing, sweating profusely',
      patientLocation: 'Test Village, Nagpur'
    }, {
      headers: { 'Authorization': `Bearer ${chwToken}` }
    });
    console.log('✓ Referral created');
    console.log('  Severity:', criticalReferral.data.aiResponse.severity);
    console.log('  Type:', criticalReferral.data.referral.referralType);
    console.log('  Incident created:', criticalReferral.data.incident ? 'YES ✓' : 'NO');
    if (criticalReferral.data.incident) {
      console.log('  Incident ID:', criticalReferral.data.incident._id);
      console.log('  Incident Status:', criticalReferral.data.incident.status);
    }
    console.log('');
    
    // Test 7: Patient History
    console.log('7. Patient History');
    const historyResponse = await axios.get(`${API_URL}/api/patients/${patientId}/history`, {
      headers: { 'Authorization': `Bearer ${chwToken}` }
    });
    console.log('✓ History retrieved');
    console.log('  Patient:', historyResponse.data.patient.name);
    console.log('  Total Referrals:', historyResponse.data.summary.totalReferrals);
    console.log('  Total Incidents:', historyResponse.data.summary.totalIncidents);
    console.log('');
    
    // Test 8: Facility Dashboard
    console.log('8. Facility Dashboard');
    const dashboardResponse = await axios.get(`${API_URL}/api/facilities/${districtHospitalId}/dashboard`, {
      headers: { 'Authorization': `Bearer ${chwToken}` }
    });
    console.log('✓ Dashboard retrieved');
    console.log('  Facility:', dashboardResponse.data.facility.name);
    console.log('  Beds:', `${dashboardResponse.data.facility.availableBeds}/${dashboardResponse.data.facility.totalBeds}`);
    console.log('  Medicine items:', dashboardResponse.data.stats.medicineItems);
    console.log('  Diagnostics:', dashboardResponse.data.stats.diagnosticServices);
    console.log('');
    
    // Test 9: Due Follow-ups
    console.log('9. Due Follow-ups');
    const followUpsResponse = await axios.get(`${API_URL}/api/followups/due`, {
      headers: { 'Authorization': `Bearer ${chwToken}` }
    });
    console.log('✓ Due follow-ups:', followUpsResponse.data.followUps.length);
    console.log('');
    
    // Test 10: Login as Operator
    console.log('10. Login as Operator');
    const operatorLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'operator@rapidcare.com',
      password: 'password123'
    });
    console.log('✓ Operator login:', operatorLogin.data.user.name);
    console.log('');
    
    // Test 11: Login as Hospital Staff
    console.log('11. Login as Hospital Staff');
    const staffLogin = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'staff@rapidcare.com',
      password: 'password123'
    });
    console.log('✓ Staff login:', staffLogin.data.user.name);
    console.log('');
    
    console.log('=== ALL TESTS PASSED ===');
    
  } catch (error) {
    console.error('\n✗ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Server not running! Start with: node server.js');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAll();
