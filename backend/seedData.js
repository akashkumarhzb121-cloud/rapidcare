const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Facility = require('./models/Facility');
const User = require('./models/User');
const Patient = require('./models/Patient');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    
    // Clear existing data
    await Facility.deleteMany({});
    await User.deleteMany({});
    await Patient.deleteMany({});
    
    // Create facilities (tiered)
    const facilities = [
      // District Hospitals
      {
        name: 'District Hospital - Nagpur',
        facilityType: 'district-hospital',
        location: { lat: 21.1458, lng: 79.0882 },
        address: 'District Hospital, Nagpur, Maharashtra',
        district: 'Nagpur',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 500,
        availableBeds: 85,
        contactNumber: '+91-712-2560000',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'ICU', 'NICU', 'Blood Bank', 'CT Scan', 'MRI'],
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
        ]
      },
      // Rural Hospital
      {
        name: 'Rural Hospital - Ramtek',
        facilityType: 'rural-hospital',
        location: { lat: 21.3956, lng: 79.3272 },
        address: 'Rural Hospital, Ramtek, Nagpur',
        district: 'Nagpur',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 100,
        availableBeds: 25,
        contactNumber: '+91-712-2550000',
        accreditation: 'ISO',
        emergencyServices: ['Emergency Room', 'Basic ICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 2000, unit: 'tablets' },
          { name: 'ORS', category: 'Rehydration', quantity: 1500, unit: 'sachets' },
          { name: 'Iron Supplements', category: 'Maternal', quantity: 800, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 2 },
          { name: 'Basic Blood Test', available: true, waitTimeHours: 3 }
        ]
      },
      // PHC
      {
        name: 'PHC - Khairi',
        facilityType: 'phc',
        location: { lat: 21.2500, lng: 79.2000 },
        address: 'Primary Health Centre, Khairi, Nagpur',
        district: 'Nagpur',
        specializations: ['general', 'maternal'],
        totalBeds: 10,
        availableBeds: 4,
        contactNumber: '+91-712-2540000',
        accreditation: 'None',
        emergencyServices: ['Basic First Aid'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 1000, unit: 'tablets' },
          { name: 'ORS', category: 'Rehydration', quantity: 800, unit: 'sachets' },
          { name: 'Iron Supplements', category: 'Maternal', quantity: 500, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'Basic Blood Test', available: true, waitTimeHours: 4 },
          { name: 'Pregnancy Test', available: true, waitTimeHours: 0.5 }
        ]
      },
      // Sub-centre
      {
        name: 'Sub-Centre - Chikna',
        facilityType: 'sub-centre',
        location: { lat: 21.2800, lng: 79.1500 },
        address: 'Sub-Centre, Chikna Village, Nagpur',
        district: 'Nagpur',
        specializations: ['general'],
        totalBeds: 2,
        availableBeds: 1,
        contactNumber: '+91-712-2530000',
        accreditation: 'None',
        emergencyServices: ['Basic First Aid'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 500, unit: 'tablets' },
          { name: 'ORS', category: 'Rehydration', quantity: 400, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'Pregnancy Test', available: true, waitTimeHours: 0.5 }
        ]
      }
    ];
    
    const createdFacilities = await Facility.insertMany(facilities);
    console.log(`Created ${createdFacilities.length} facilities`);
    
    // Set parent facility references
    await Facility.findByIdAndUpdate(createdFacilities[1]._id, { parentFacility: createdFacilities[0]._id });
    await Facility.findByIdAndUpdate(createdFacilities[2]._id, { parentFacility: createdFacilities[1]._id });
    await Facility.findByIdAndUpdate(createdFacilities[3]._id, { parentFacility: createdFacilities[2]._id });
    
    // Create users
    const users = [
      {
        name: 'John Operator',
        email: 'operator@rapidcare.com',
        password: 'password123',
        role: 'ambulance_operator'
      },
      {
        name: 'Dr. Sarah Staff',
        email: 'staff@rapidcare.com',
        password: 'password123',
        role: 'hospital_staff',
        linkedFacilityId: createdFacilities[0]._id,
        linkedHospitalId: createdFacilities[0]._id
      },
      {
        name: 'Asha Worker',
        email: 'chw@rapidcare.com',
        password: 'password123',
        role: 'community_health_worker',
        linkedFacilityId: createdFacilities[3]._id,
        languagePreference: 'hindi'
      }
    ];
    
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    
    // Update facility with staff user
    await Facility.findByIdAndUpdate(createdFacilities[0]._id, {
      staffUserId: createdUsers[1]._id
    });
    
    // Create sample patient
    const samplePatient = new Patient({
      name: 'Lakshmi Devi',
      age: 45,
      gender: 'female',
      village: 'Chikna',
      district: 'Nagpur',
      phone: '+91-9876543210',
      languagePreference: 'hindi',
      chronicConditions: ['hypertension'],
      highRiskFlags: ['chronic'],
      registeredBy: createdUsers[2]._id,
      registeredAtFacility: createdFacilities[3]._id
    });
    await samplePatient.save();
    console.log('Created sample patient');
    
    console.log('\n=== Seeding Complete ===');
    console.log('Facilities: sub-centre, PHC, rural-hospital, district-hospital');
    console.log('Users: operator, hospital_staff, community_health_worker');
    console.log('\nDemo Credentials:');
    console.log('Operator: operator@rapidcare.com / password123');
    console.log('Staff: staff@rapidcare.com / password123');
    console.log('CHW: chw@rapidcare.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
