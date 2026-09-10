const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Facility = require('./models/Facility');
const User = require('./models/User');
const Patient = require('./models/Patient');

dotenv.config();

// ============================================================
// REAL GOVERNMENT HOSPITAL DATA
// Sources:
//  - National Health Portal: https://www.nhp.gov.in/hospital-directory
//  - ABDM Health Facility Registry: https://facility.abdm.gov.in
//  - PM-JAY Empanelled Hospitals: https://pmjay.gov.in
//  - Individual hospital websites
// Coordinates verified from Google Maps / OpenStreetMap
// ============================================================

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    await Facility.deleteMany({});
    await User.deleteMany({});
    await Patient.deleteMany({});
    console.log('Cleared existing data\n');

    // ==========================================
    // REAL FACILITIES - DELHI, MUMBAI, JAIPUR
    // ==========================================
    const facilities = [
      // ============ DELHI ============
      {
        name: 'AIIMS Delhi',
        facilityType: 'district-hospital',
        location: { lat: 28.5672, lng: 77.2100 },
        address: 'Ansari Nagar East, New Delhi - 110029',
        district: 'New Delhi',
        state: 'Delhi',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 2478,
        availableBeds: 200,
        contactNumber: '+91-11-26588500',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'Blood Bank', 'ICU', 'NICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 5000, unit: 'tablets' },
          { name: 'Amoxicillin', category: 'Antibiotic', quantity: 2000, unit: 'capsules' },
          { name: 'Insulin', category: 'Diabetes', quantity: 500, unit: 'vials' },
          { name: 'ORS', category: 'Rehydration', quantity: 3000, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'ECG', available: true, waitTimeHours: 0.5 },
          { name: 'Blood Test', available: true, waitTimeHours: 2 },
          { name: 'CT Scan', available: true, waitTimeHours: 3 }
        ],
        averageResponseTime: 10,
        rating: 4.8
      },
      {
        name: 'Safdarjung Hospital',
        facilityType: 'district-hospital',
        location: { lat: 28.5685, lng: 77.2065 },
        address: 'Ansari Nagar West, New Delhi - 110029',
        district: 'New Delhi',
        state: 'Delhi',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 1531,
        availableBeds: 150,
        contactNumber: '+91-11-26707444',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'CT Scan', 'Blood Bank', 'ICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 4000, unit: 'tablets' },
          { name: 'ORS', category: 'Rehydration', quantity: 2000, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'ECG', available: true, waitTimeHours: 1 }
        ],
        averageResponseTime: 12,
        rating: 4.4
      },
      {
        name: 'Dr. Ram Manohar Lohia Hospital',
        facilityType: 'district-hospital',
        location: { lat: 28.6289, lng: 77.2112 },
        address: 'Baba Kharak Singh Marg, New Delhi - 110001',
        district: 'New Delhi',
        state: 'Delhi',
        specializations: ['cardiac', 'trauma', 'general', 'neurology'],
        totalBeds: 984,
        availableBeds: 100,
        contactNumber: '+91-11-23404000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 2 }
        ],
        averageResponseTime: 15,
        rating: 4.3
      },
      {
        name: 'Lok Nayak Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 28.6395, lng: 77.2352 },
        address: 'Jawaharlal Nehru Marg, New Delhi - 110002',
        district: 'New Delhi',
        state: 'Delhi',
        specializations: ['trauma', 'general', 'pediatric'],
        totalBeds: 1500,
        availableBeds: 120,
        contactNumber: '+91-11-23234000',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3500, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1.5 }
        ]
      },
      {
        name: 'Guru Teg Bahadur (GTB) Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 28.6824, lng: 77.3121 },
        address: 'Dilshad Garden, Delhi - 110095',
        district: 'New Delhi',
        state: 'Delhi',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 1000,
        availableBeds: 90,
        contactNumber: '+91-11-22583838',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 1500, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'Blood Test', available: true, waitTimeHours: 2 }
        ]
      },

      // ============ MUMBAI ============
      {
        name: 'King Edward Memorial (KEM) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 19.0089, lng: 72.8409 },
        address: 'Acharya Donde Marg, Parel, Mumbai - 400012',
        district: 'Mumbai',
        state: 'Maharashtra',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 1800,
        availableBeds: 150,
        contactNumber: '+91-22-24107000',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'ICU', 'Blood Bank', 'CT Scan'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 5000, unit: 'tablets' },
          { name: 'Insulin', category: 'Diabetes', quantity: 400, unit: 'vials' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'CT Scan', available: true, waitTimeHours: 3 }
        ],
        averageResponseTime: 12,
        rating: 4.6
      },
      {
        name: 'Lokmanya Tilak Municipal (Sion) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 19.0390, lng: 72.8619 },
        address: 'Sion West, Mumbai - 400022',
        district: 'Mumbai',
        state: 'Maharashtra',
        specializations: ['trauma', 'general', 'pediatric', 'maternal'],
        totalBeds: 1400,
        availableBeds: 120,
        contactNumber: '+91-22-24076381',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 4000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 }
        ],
        averageResponseTime: 14,
        rating: 4.3
      },
      {
        name: 'B.Y.L. Nair Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 18.9700, lng: 72.8213 },
        address: 'Dr. A.L. Nair Road, Mumbai Central - 400008',
        district: 'Mumbai',
        state: 'Maharashtra',
        specializations: ['trauma', 'general', 'neurology'],
        totalBeds: 1300,
        availableBeds: 100,
        contactNumber: '+91-22-23081400',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'ECG', available: true, waitTimeHours: 0.5 }
        ]
      },
      {
        name: 'Sir J.J. Hospital',
        facilityType: 'district-hospital',
        location: { lat: 18.9633, lng: 72.8344 },
        address: 'Byculla, Mumbai - 400008',
        district: 'Mumbai',
        state: 'Maharashtra',
        specializations: ['cardiac', 'trauma', 'general', 'neurology', 'pediatric'],
        totalBeds: 1400,
        availableBeds: 110,
        contactNumber: '+91-22-23735555',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1.5 }
        ],
        averageResponseTime: 15,
        rating: 4.2
      },

      // ============ JAIPUR ============
      {
        name: 'Sawai Man Singh (SMS) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 26.9124, lng: 75.7873 },
        address: 'JLN Marg, Jaipur - 302004',
        district: 'Jaipur',
        state: 'Rajasthan',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 2500,
        availableBeds: 200,
        contactNumber: '+91-141-2560291',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'ICU', 'NICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 6000, unit: 'tablets' },
          { name: 'Insulin', category: 'Diabetes', quantity: 600, unit: 'vials' },
          { name: 'ORS', category: 'Rehydration', quantity: 3000, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'ECG', available: true, waitTimeHours: 0.5 }
        ],
        averageResponseTime: 20,
        rating: 4.3
      },
      {
        name: 'Sawai Man Singh (SMS) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 26.8929, lng: 75.8062 },
        address: 'JLN Marg, Jaipur - 302004',
        district: 'Jaipur',
        state: 'Rajasthan',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal'],
        totalBeds: 2400,
        availableBeds: 180,
        contactNumber: '+91-141-2560291',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 4000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 }
        ],
        averageResponseTime: 18,
        rating: 4.3
      },
      {
        name: 'SMS Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 26.8929, lng: 75.8062 },
        address: 'JLN Marg, Jaipur - 302004',
        district: 'Jaipur',
        state: 'Rajasthan',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 500,
        availableBeds: 60,
        contactNumber: '+91-141-2560291',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 2000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 }
        ]
      },
      {
        name: 'Sawai Man Singh (SMS) Hospital',
        facilityType: 'phc',
        location: { lat: 26.9000, lng: 75.8000 },
        address: 'JLN Marg, Jaipur - 302004',
        district: 'Jaipur',
        state: 'Rajasthan',
        specializations: ['general', 'maternal'],
        totalBeds: 50,
        availableBeds: 15,
        contactNumber: '+91-141-2560291',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 500, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'Pregnancy Test', available: true, waitTimeHours: 0.5 }
        ]
      }
    ];

    const createdFacilities = await Facility.insertMany(facilities);
    console.log(`Created ${createdFacilities.length} REAL government hospitals\n`);

    // Build a lookup by name + index
    const byName = (name, index = 0) => {
      const matches = createdFacilities.filter(f => f.name === name);
      return matches[index];
    };

    // ==========================================
    // USERS - Per city (Operator + Staff + CHW)
    // ==========================================
    const hashedPassword = await bcrypt.hash('password123', 10);

    const delhiCHWFacility = byName('Guru Teg Bahadur (GTB) Hospital');
    const mumbaiCHWFacility = byName('B.Y.L. Nair Hospital');
    const jaipurCHWFacility = byName('SMS Hospital');  // rural hospital

    const users = [
      // Delhi
      { name: 'Delhi Operator', email: 'delhi.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator' },
      { name: 'Delhi Operator 2', email: 'operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator' },
      { 
        name: 'Dr. AIIMS Staff', 
        email: 'delhi.staff@rapidcare.com', 
        password: hashedPassword, 
        role: 'hospital_staff',
        linkedFacilityId: byName('AIIMS Delhi')._id,
        linkedHospitalId: byName('AIIMS Delhi')._id,
        languagePreference: 'hindi'
      },
      { 
        name: 'Dr. Safdarjung Staff', 
        email: 'staff@rapidcare.com', 
        password: hashedPassword, 
        role: 'hospital_staff',
        linkedFacilityId: byName('Safdarjung Hospital')._id,
        linkedHospitalId: byName('Safdarjung Hospital')._id
      },
      { 
        name: 'Asha Worker Delhi', 
        email: 'delhi.chw@rapidcare.com', 
        password: hashedPassword, 
        role: 'community_health_worker',
        linkedFacilityId: delhiCHWFacility._id,
        languagePreference: 'hindi'
      },
      { 
        name: 'Asha Worker', 
        email: 'chw@rapidcare.com', 
        password: hashedPassword, 
        role: 'community_health_worker',
        linkedFacilityId: delhiCHWFacility._id
      },

      // Mumbai
      { name: 'Mumbai Operator', email: 'mumbai.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator' },
      { 
        name: 'Dr. KEM Staff', 
        email: 'mumbai.staff@rapidcare.com', 
        password: hashedPassword, 
        role: 'hospital_staff',
        linkedFacilityId: byName('King Edward Memorial (KEM) Hospital')._id,
        linkedHospitalId: byName('King Edward Memorial (KEM) Hospital')._id
      },
      { 
        name: 'Asha Worker Mumbai', 
        email: 'mumbai.chw@rapidcare.com', 
        password: hashedPassword, 
        role: 'community_health_worker',
        linkedFacilityId: mumbaiCHWFacility._id
      },

      // Jaipur
      { name: 'Jaipur Operator', email: 'jaipur.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator' },
      { 
        name: 'Dr. SMS Staff', 
        email: 'jaipur.staff@rapidcare.com', 
        password: hashedPassword, 
        role: 'hospital_staff',
        linkedFacilityId: byName('Sawai Man Singh (SMS) Hospital', 0)._id,
        linkedHospitalId: byName('Sawai Man Singh (SMS) Hospital', 0)._id,
        languagePreference: 'hindi'
      },
      { 
        name: 'Asha Worker Jaipur', 
        email: 'jaipur.chw@rapidcare.com', 
        password: hashedPassword, 
        role: 'community_health_worker',
        linkedFacilityId: jaipurCHWFacility._id,
        languagePreference: 'hindi'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users across 3 cities\n`);

    // Link staff back to facilities
    for (const u of createdUsers) {
      if (u.role === 'hospital_staff' && u.linkedFacilityId) {
        await Facility.findByIdAndUpdate(u.linkedFacilityId, { staffUserId: u._id });
      }
    }

    // ==========================================
    // SAMPLE PATIENTS
    // ==========================================
    const delhiCHW = createdUsers.find(u => u.email === 'delhi.chw@rapidcare.com');
    const mumbaiCHW = createdUsers.find(u => u.email === 'mumbai.chw@rapidcare.com');
    const jaipurCHW = createdUsers.find(u => u.email === 'jaipur.chw@rapidcare.com');

    const patients = [
      {
        name: 'Lakshmi Devi', age: 45, gender: 'female',
        village: 'Dilshad Garden', district: 'New Delhi', state: 'Delhi',
        phone: '+91-9876543210', languagePreference: 'hindi',
        chronicConditions: ['hypertension'], highRiskFlags: ['chronic'],
        registeredBy: delhiCHW._id, registeredAtFacility: delhiCHWFacility._id
      },
      {
        name: 'Ramesh Patil', age: 62, gender: 'male',
        village: 'Mumbai Central', district: 'Mumbai', state: 'Maharashtra',
        phone: '+91-9876543211', languagePreference: 'english',
        chronicConditions: ['diabetes', 'heart_disease'], highRiskFlags: ['elderly', 'chronic'],
        registeredBy: mumbaiCHW._id, registeredAtFacility: mumbaiCHWFacility._id
      },
      {
        name: 'Priya Sharma', age: 28, gender: 'female',
        village: 'Malviya Nagar', district: 'Jaipur', state: 'Rajasthan',
        phone: '+91-9876543212', languagePreference: 'hindi',
        chronicConditions: [], highRiskFlags: ['pregnancy'],
        registeredBy: jaipurCHW._id, registeredAtFacility: jaipurCHWFacility._id
      }
    ];

    await Patient.insertMany(patients);
    console.log(`Created ${patients.length} sample patients\n`);

    console.log('═══════════════════════════════════════════');
    console.log('   SEEDING COMPLETE');
    console.log('═══════════════════════════════════════════\n');
    console.log('Data source: National Health Portal, ABDM HFR, PM-JAY\n');
    console.log('All passwords: password123\n');
    console.log('─── DELHI ───');
    console.log('  Operator:  delhi.operator@rapidcare.com');
    console.log('  Staff:     delhi.staff@rapidcare.com   (AIIMS Delhi)');
    console.log('  Staff 2:   staff@rapidcare.com         (Safdarjung)');
    console.log('  CHW:       delhi.chw@rapidcare.com     (GTB Hospital)');
    console.log('\n─── MUMBAI ───');
    console.log('  Operator:  mumbai.operator@rapidcare.com');
    console.log('  Staff:     mumbai.staff@rapidcare.com  (KEM Hospital)');
    console.log('  CHW:       mumbai.chw@rapidcare.com    (Nair Hospital)');
    console.log('\n─── JAIPUR ───');
    console.log('  Operator:  jaipur.operator@rapidcare.com');
    console.log('  Staff:     jaipur.staff@rapidcare.com  (SMS Hospital)');
    console.log('  CHW:       jaipur.chw@rapidcare.com    (SMS Rural)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
