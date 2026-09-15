const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Facility = require('./models/Facility');
const User = require('./models/User');
const Patient = require('./models/Patient');

dotenv.config();

// ============================================================
// MAHARASHTRA GOVERNMENT HOSPITALS & HEALTHCARE FACILITIES
//
// Data sources:
//  - National Health Portal (NHP)
//  - ABDM Health Facility Registry (HFR)
//  - PM-JAY Empanelled Hospitals
//  - Maharashtra Public Health Department
//  - Individual hospital websites
//
// Real districts: Mumbai, Pune, Nagpur, Nashik, Thane,
//                 Aurangabad (Chh. Sambhajinagar), Kolhapur,
//                 Solapur, Amravati, Jalgaon
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
    // REAL MAHARASHTRA FACILITIES
    // ==========================================
    const facilities = [
      // ============ MUMBAI CITY ============
      {
        name: 'King Edward Memorial (KEM) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 19.0089, lng: 72.8409 },
        address: 'Acharya Donde Marg, Parel, Mumbai - 400012',
        district: 'Mumbai City',
        state: 'Maharashtra',
        taluka: 'Parel',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 1800,
        availableBeds: 150,
        contactNumber: '+91-22-24107000',
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
        rating: 4.6
      },
      {
        name: 'Sir J.J. Hospital',
        facilityType: 'district-hospital',
        location: { lat: 18.9633, lng: 72.8344 },
        address: 'Byculla, Mumbai - 400008',
        district: 'Mumbai City',
        state: 'Maharashtra',
        taluka: 'Byculla',
        specializations: ['cardiac', 'trauma', 'general', 'neurology', 'pediatric'],
        totalBeds: 1400,
        availableBeds: 110,
        contactNumber: '+91-22-23735555',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1.5 }
        ],
        averageResponseTime: 15,
        rating: 4.2
      },
      {
        name: 'Gokuldas Tejpal Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 18.9427, lng: 72.8310 },
        address: 'Dr. D.N. Road, Fort, Mumbai - 400001',
        district: 'Mumbai City',
        state: 'Maharashtra',
        taluka: 'Fort',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 500,
        availableBeds: 45,
        contactNumber: '+91-22-22620512',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 1000, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'Blood Test', available: true, waitTimeHours: 2 }
        ]
      },

      // ============ MUMBAI SUBURBAN ============
      {
        name: 'Lokmanya Tilak Municipal (Sion) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 19.0390, lng: 72.8619 },
        address: 'Sion West, Mumbai - 400022',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        taluka: 'Kurla',
        specializations: ['trauma', 'general', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 1400,
        availableBeds: 120,
        contactNumber: '+91-22-24076381',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'ICU', 'NICU'],
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
        facilityType: 'district-hospital',
        location: { lat: 18.9700, lng: 72.8213 },
        address: 'Dr. A.L. Nair Road, Mumbai Central - 400008',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        taluka: 'Mumbai Central',
        specializations: ['trauma', 'general', 'neurology'],
        totalBeds: 1300,
        availableBeds: 100,
        contactNumber: '+91-22-23081400',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'ICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'ECG', available: true, waitTimeHours: 0.5 }
        ],
        averageResponseTime: 13,
        rating: 4.4
      },
      {
        name: 'Rajawadi Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 19.0757, lng: 72.8997 },
        address: 'Ghatkopar East, Mumbai - 400077',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        taluka: 'Ghatkopar',
        specializations: ['general', 'pediatric'],
        totalBeds: 500,
        availableBeds: 40,
        contactNumber: '+91-22-21025600',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 800, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 2 }
        ]
      },
      {
        name: 'Urban Health Centre - Dharavi',
        facilityType: 'phc',
        location: { lat: 19.0420, lng: 72.8540 },
        address: 'Dharavi, Mumbai - 400017',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        taluka: 'Dharavi',
        specializations: ['general', 'maternal'],
        totalBeds: 20,
        availableBeds: 8,
        contactNumber: '+91-22-24040000',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 500, unit: 'tablets' },
          { name: 'ORS', category: 'Rehydration', quantity: 400, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'Basic Blood Test', available: true, waitTimeHours: 4 }
        ]
      },

      // ============ PUNE ============
      {
        name: 'Sassoon General Hospital',
        facilityType: 'district-hospital',
        location: { lat: 18.5236, lng: 73.8701 },
        address: 'Sassoon Road, Pune - 411001',
        district: 'Pune',
        state: 'Maharashtra',
        taluka: 'Pune City',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 1300,
        availableBeds: 130,
        contactNumber: '+91-20-26128000',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 4000, unit: 'tablets' },
          { name: 'Insulin', category: 'Diabetes', quantity: 400, unit: 'vials' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'ECG', available: true, waitTimeHours: 0.5 }
        ],
        averageResponseTime: 12,
        rating: 4.5
      },
      {
        name: 'Aundh District Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 18.5607, lng: 73.8074 },
        address: 'Aundh, Pune - 411007',
        district: 'Pune',
        state: 'Maharashtra',
        taluka: 'Aundh',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 200,
        availableBeds: 25,
        contactNumber: '+91-20-25885000',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 600, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 2 }
        ]
      },
      {
        name: 'Primary Health Centre - Wagholi',
        facilityType: 'phc',
        location: { lat: 18.5800, lng: 73.9800 },
        address: 'Wagholi, Pune - 412207',
        district: 'Pune',
        state: 'Maharashtra',
        taluka: 'Haveli',
        specializations: ['general', 'maternal'],
        totalBeds: 10,
        availableBeds: 4,
        contactNumber: '+91-20-27050000',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 500, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'Pregnancy Test', available: true, waitTimeHours: 0.5 }
        ]
      },
      {
        name: 'Sub-Centre - Uruli Kanchan',
        facilityType: 'sub-centre',
        location: { lat: 18.4900, lng: 74.1400 },
        address: 'Uruli Kanchan, Pune - 412202',
        district: 'Pune',
        state: 'Maharashtra',
        taluka: 'Haveli',
        specializations: ['general'],
        totalBeds: 2,
        availableBeds: 1,
        contactNumber: '+91-20-26926000',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 200, unit: 'sachets' }
        ],
        diagnosticServices: []
      },

      // ============ NAGPUR ============
      {
        name: 'Government Medical College (GMC) Nagpur',
        facilityType: 'district-hospital',
        location: { lat: 21.1458, lng: 79.0882 },
        address: 'Hanuman Nagar, Nagpur - 440003',
        district: 'Nagpur',
        state: 'Maharashtra',
        taluka: 'Nagpur Urban',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 1400,
        availableBeds: 140,
        contactNumber: '+91-712-2706400',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 5000, unit: 'tablets' },
          { name: 'Insulin', category: 'Diabetes', quantity: 500, unit: 'vials' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'CT Scan', available: true, waitTimeHours: 3 }
        ],
        averageResponseTime: 15,
        rating: 4.4
      },
      {
        name: 'Mayo Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 21.1573, lng: 79.0836 },
        address: 'Central Avenue, Nagpur - 440018',
        district: 'Nagpur',
        state: 'Maharashtra',
        taluka: 'Nagpur Urban',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 300,
        availableBeds: 35,
        contactNumber: '+91-712-2726300',
        accreditation: 'NABH',
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 2000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 2 }
        ]
      },
      {
        name: 'Primary Health Centre - Kamptee',
        facilityType: 'phc',
        location: { lat: 21.2167, lng: 79.2000 },
        address: 'Kamptee, Nagpur - 441001',
        district: 'Nagpur',
        state: 'Maharashtra',
        taluka: 'Kamptee',
        specializations: ['general', 'maternal'],
        totalBeds: 15,
        availableBeds: 6,
        contactNumber: '+91-712-2855000',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 400, unit: 'sachets' }
        ],
        diagnosticServices: [
          { name: 'Pregnancy Test', available: true, waitTimeHours: 1 }
        ]
      },

      // ============ NASHIK ============
      {
        name: 'Nashik Civil Hospital',
        facilityType: 'district-hospital',
        location: { lat: 19.9975, lng: 73.7898 },
        address: 'Trimbak Road, Nashik - 422002',
        district: 'Nashik',
        state: 'Maharashtra',
        taluka: 'Nashik',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 700,
        availableBeds: 70,
        contactNumber: '+91-253-2572000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'Blood Test', available: true, waitTimeHours: 2 }
        ],
        averageResponseTime: 16,
        rating: 4.2
      },
      {
        name: 'Primary Health Centre - Igatpuri',
        facilityType: 'phc',
        location: { lat: 19.6960, lng: 73.5626 },
        address: 'Igatpuri, Nashik - 422403',
        district: 'Nashik',
        state: 'Maharashtra',
        taluka: 'Igatpuri',
        specializations: ['general', 'maternal'],
        totalBeds: 12,
        availableBeds: 5,
        contactNumber: '+91-2553-244000',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 300, unit: 'sachets' }
        ],
        diagnosticServices: []
      },

      // ============ THANE ============
      {
        name: 'Thane Civil Hospital',
        facilityType: 'district-hospital',
        location: { lat: 19.2183, lng: 72.9781 },
        address: 'Court Naka, Thane West - 400601',
        district: 'Thane',
        state: 'Maharashtra',
        taluka: 'Thane',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal'],
        totalBeds: 600,
        availableBeds: 55,
        contactNumber: '+91-22-25341000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 2500, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1.5 }
        ],
        averageResponseTime: 14,
        rating: 4.3
      },
      {
        name: 'Horizon Hospital',
        facilityType: 'rural-hospital',
        location: { lat: 19.2335, lng: 73.1307 },
        address: 'Kausa, Mumbra, Thane - 400612',
        district: 'Thane',
        state: 'Maharashtra',
        taluka: 'Mumbra',
        specializations: ['general', 'pediatric', 'maternal'],
        totalBeds: 250,
        availableBeds: 30,
        contactNumber: '+91-22-25400000',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 500, unit: 'sachets' }
        ],
        diagnosticServices: []
      },
      {
        name: 'Sub-Centre - Badlapur',
        facilityType: 'sub-centre',
        location: { lat: 19.1550, lng: 73.2680 },
        address: 'Badlapur, Thane - 421503',
        district: 'Thane',
        state: 'Maharashtra',
        taluka: 'Ambernath',
        specializations: ['general'],
        totalBeds: 3,
        availableBeds: 2,
        contactNumber: '+91-251-2695000',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 200, unit: 'sachets' }
        ],
        diagnosticServices: []
      },

      // ============ CHHATRAPATI SAMBHAJINAGAR (AURANGABAD) ============
      {
        name: 'Government Medical College (GMC) Chh. Sambhajinagar',
        facilityType: 'district-hospital',
        location: { lat: 19.8762, lng: 75.3433 },
        address: 'Panchakki Road, Chh. Sambhajinagar - 431001',
        district: 'Chhatrapati Sambhajinagar',
        state: 'Maharashtra',
        taluka: 'Aurangabad',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal'],
        totalBeds: 1100,
        availableBeds: 100,
        contactNumber: '+91-240-2402000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'CT Scan', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 4000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 },
          { name: 'CT Scan', available: true, waitTimeHours: 3 }
        ],
        averageResponseTime: 18,
        rating: 4.2
      },
      {
        name: 'Primary Health Centre - Paithan',
        facilityType: 'phc',
        location: { lat: 19.4750, lng: 75.3830 },
        address: 'Paithan, Chh. Sambhajinagar - 431107',
        district: 'Chhatrapati Sambhajinagar',
        state: 'Maharashtra',
        taluka: 'Paithan',
        specializations: ['general', 'maternal'],
        totalBeds: 15,
        availableBeds: 7,
        contactNumber: '+91-2431-222000',
        medicineStock: [
          { name: 'ORS', category: 'Rehydration', quantity: 300, unit: 'sachets' }
        ],
        diagnosticServices: []
      },

      // ============ KOLHAPUR ============
      {
        name: 'Chhatrapati Pramila Raje (CPR) Hospital',
        facilityType: 'district-hospital',
        location: { lat: 16.7050, lng: 74.2433 },
        address: 'Bhausinghji Road, Kolhapur - 416001',
        district: 'Kolhapur',
        state: 'Maharashtra',
        taluka: 'Kolhapur',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal', 'orthopedic'],
        totalBeds: 800,
        availableBeds: 80,
        contactNumber: '+91-231-2650000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'ICU', 'Blood Bank'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 }
        ],
        averageResponseTime: 15,
        rating: 4.3
      },

      // ============ SOLAPUR ============
      {
        name: 'Solapur Civil Hospital',
        facilityType: 'district-hospital',
        location: { lat: 17.6599, lng: 75.9064 },
        address: 'Civil Hospital Road, Solapur - 413003',
        district: 'Solapur',
        state: 'Maharashtra',
        taluka: 'Solapur',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal'],
        totalBeds: 700,
        availableBeds: 65,
        contactNumber: '+91-217-2322000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'ICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 2500, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1.5 }
        ],
        averageResponseTime: 17,
        rating: 4.1
      },

      // ============ AMRAVATI ============
      {
        name: 'Government Medical College (GMC) Amravati',
        facilityType: 'district-hospital',
        location: { lat: 20.9374, lng: 77.7796 },
        address: 'Irwin Hospital Campus, Amravati - 444601',
        district: 'Amravati',
        state: 'Maharashtra',
        taluka: 'Amravati',
        specializations: ['cardiac', 'trauma', 'general', 'pediatric', 'maternal'],
        totalBeds: 900,
        availableBeds: 85,
        contactNumber: '+91-721-2662200',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'Ventilator', 'ICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 3500, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 1 }
        ],
        averageResponseTime: 16,
        rating: 4.2
      },

      // ============ JALGAON ============
      {
        name: 'Jalgaon Civil Hospital',
        facilityType: 'district-hospital',
        location: { lat: 21.0077, lng: 75.5626 },
        address: 'Civil Hospital Road, Jalgaon - 425001',
        district: 'Jalgaon',
        state: 'Maharashtra',
        taluka: 'Jalgaon',
        specializations: ['general', 'pediatric', 'maternal', 'trauma'],
        totalBeds: 500,
        availableBeds: 45,
        contactNumber: '+91-257-2222000',
        accreditation: 'NABH',
        emergencyServices: ['Trauma Bay', 'ICU'],
        medicineStock: [
          { name: 'Paracetamol', category: 'Analgesic', quantity: 2000, unit: 'tablets' }
        ],
        diagnosticServices: [
          { name: 'X-Ray', available: true, waitTimeHours: 2 }
        ],
        averageResponseTime: 18,
        rating: 4.0
      }
    ];

    const createdFacilities = await Facility.insertMany(facilities);
    console.log(`Created ${createdFacilities.length} real Maharashtra facilities\n`);

    // Helper to find facility
    const byName = (name) => createdFacilities.find(f => f.name === name);
    const byDistrictAndType = (district, type) =>
      createdFacilities.find(f => f.district === district && f.facilityType === type);

    // ==========================================
    // USERS — Maharashtra Districts
    // ==========================================
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      // ===== MUMBAI CITY =====
      { name: 'Mumbai Operator', email: 'mumbai.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator', languagePreference: 'mr' },
      {
        name: 'Dr. KEM Staff',
        email: 'mumbai.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('King Edward Memorial (KEM) Hospital')._id,
        linkedHospitalId: byName('King Edward Memorial (KEM) Hospital')._id,
        languagePreference: 'mr'
      },
      {
        name: 'Asha Worker Mumbai',
        email: 'mumbai.chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: byDistrictAndType('Mumbai Suburban', 'phc')?._id,
        languagePreference: 'mr'
      },

      // ===== MUMBAI SUBURBAN =====
      {
        name: 'Dr. Sion Staff',
        email: 'sion.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Lokmanya Tilak Municipal (Sion) Hospital')._id,
        linkedHospitalId: byName('Lokmanya Tilak Municipal (Sion) Hospital')._id,
        languagePreference: 'mr'
      },
      {
        name: 'Dr. Nair Staff',
        email: 'nair.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('B.Y.L. Nair Hospital')._id,
        linkedHospitalId: byName('B.Y.L. Nair Hospital')._id
      },

      // ===== PUNE =====
      { name: 'Pune Operator', email: 'pune.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator', languagePreference: 'mr' },
      {
        name: 'Dr. Sassoon Staff',
        email: 'pune.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Sassoon General Hospital')._id,
        linkedHospitalId: byName('Sassoon General Hospital')._id,
        languagePreference: 'mr'
      },
      {
        name: 'Asha Worker Pune',
        email: 'pune.chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: byName('Sub-Centre - Uruli Kanchan')._id,
        languagePreference: 'mr'
      },

      // ===== NAGPUR =====
      { name: 'Nagpur Operator', email: 'nagpur.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator', languagePreference: 'mr' },
      {
        name: 'Dr. GMC Nagpur Staff',
        email: 'nagpur.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Government Medical College (GMC) Nagpur')._id,
        linkedHospitalId: byName('Government Medical College (GMC) Nagpur')._id,
        languagePreference: 'mr'
      },
      {
        name: 'Asha Worker Nagpur',
        email: 'nagpur.chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: byName('Primary Health Centre - Kamptee')._id,
        languagePreference: 'mr'
      },

      // ===== NASHIK =====
      { name: 'Nashik Operator', email: 'nashik.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator', languagePreference: 'mr' },
      {
        name: 'Dr. Nashik Civil Staff',
        email: 'nashik.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Nashik Civil Hospital')._id,
        linkedHospitalId: byName('Nashik Civil Hospital')._id,
        languagePreference: 'mr'
      },
      {
        name: 'Asha Worker Nashik',
        email: 'nashik.chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: byName('Primary Health Centre - Igatpuri')._id,
        languagePreference: 'mr'
      },

      // ===== THANE =====
      { name: 'Thane Operator', email: 'thane.operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator', languagePreference: 'mr' },
      {
        name: 'Dr. Thane Civil Staff',
        email: 'thane.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Thane Civil Hospital')._id,
        linkedHospitalId: byName('Thane Civil Hospital')._id,
        languagePreference: 'mr'
      },
      {
        name: 'Asha Worker Thane',
        email: 'thane.chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: byName('Sub-Centre - Badlapur')._id,
        languagePreference: 'mr'
      },

      // ===== CHH. SAMBHAJINAGAR =====
      {
        name: 'Dr. GMC Aurangabad Staff',
        email: 'aurangabad.staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Government Medical College (GMC) Chh. Sambhajinagar')._id,
        linkedHospitalId: byName('Government Medical College (GMC) Chh. Sambhajinagar')._id,
        languagePreference: 'mr'
      },

      // ===== LEGACY (for backwards compatibility) =====
      { name: 'John Operator', email: 'operator@rapidcare.com', password: hashedPassword, role: 'ambulance_operator' },
      {
        name: 'Dr. Sarah Staff',
        email: 'staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: byName('Sassoon General Hospital')._id,
        linkedHospitalId: byName('Sassoon General Hospital')._id
      },
      {
        name: 'Asha Worker',
        email: 'chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: byName('Sub-Centre - Uruli Kanchan')._id
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users across Maharashtra\n`);

    // Link staff to facilities
    for (const u of createdUsers) {
      if (u.role === 'hospital_staff' && u.linkedFacilityId) {
        await Facility.findByIdAndUpdate(u.linkedFacilityId, { staffUserId: u._id });
      }
    }

    // ==========================================
    // SAMPLE PATIENTS — Real Maharashtra villages
    // ==========================================
    const puneCHW = createdUsers.find(u => u.email === 'pune.chw@rapidcare.com');
    const nagpurCHW = createdUsers.find(u => u.email === 'nagpur.chw@rapidcare.com');
    const mumbaiCHW = createdUsers.find(u => u.email === 'mumbai.chw@rapidcare.com');

    const patients = [
      {
        name: 'Lakshmi Patil', age: 45, gender: 'female',
        village: 'Uruli Kanchan', district: 'Pune', state: 'Maharashtra',
        phone: '+91-9876543210', languagePreference: 'mr',
        chronicConditions: ['hypertension'], highRiskFlags: ['chronic'],
        registeredBy: puneCHW._id,
        registeredAtFacility: byName('Sub-Centre - Uruli Kanchan')._id
      },
      {
        name: 'Ramesh Deshmukh', age: 62, gender: 'male',
        village: 'Kamptee', district: 'Nagpur', state: 'Maharashtra',
        phone: '+91-9876543211', languagePreference: 'mr',
        chronicConditions: ['diabetes', 'heart_disease'], highRiskFlags: ['elderly', 'chronic'],
        registeredBy: nagpurCHW._id,
        registeredAtFacility: byName('Primary Health Centre - Kamptee')._id
      },
      {
        name: 'Priya Jadhav', age: 28, gender: 'female',
        village: 'Dharavi', district: 'Mumbai Suburban', state: 'Maharashtra',
        phone: '+91-9876543212', languagePreference: 'mr',
        chronicConditions: [], highRiskFlags: ['pregnancy'],
        registeredBy: mumbaiCHW._id,
        registeredAtFacility: byDistrictAndType('Mumbai Suburban', 'phc')._id
      }
    ];

    await Patient.insertMany(patients);
    console.log(`Created ${patients.length} sample patients\n`);

    console.log('═══════════════════════════════════════════');
    console.log('   MAHARASHTRA SEED COMPLETE');
    console.log('═══════════════════════════════════════════\n');
    console.log(`Facilities: ${createdFacilities.length}`);
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Patients: ${patients.length}\n`);
    console.log('Districts covered:');
    console.log('  • Mumbai City');
    console.log('  • Mumbai Suburban');
    console.log('  • Pune');
    console.log('  • Nagpur');
    console.log('  • Nashik');
    console.log('  • Thane');
    console.log('  • Chhatrapati Sambhajinagar (Aurangabad)');
    console.log('  • Kolhapur');
    console.log('  • Solapur');
    console.log('  • Amravati');
    console.log('  • Jalgaon\n');
    console.log('Demo credentials (all password: password123):');
    console.log('  Pune Operator:    pune.operator@rapidcare.com');
    console.log('  Pune Staff:       pune.staff@rapidcare.com');
    console.log('  Pune CHW:         pune.chw@rapidcare.com');
    console.log('  Nagpur Operator:  nagpur.operator@rapidcare.com');
    console.log('  Mumbai Staff:     mumbai.staff@rapidcare.com');
    console.log('  Legacy:           operator@rapidcare.com\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
