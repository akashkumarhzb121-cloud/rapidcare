const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Hospital = require('./models/Hospital');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    
    // Clear existing data
    await Hospital.deleteMany({});
    await User.deleteMany({});
    
    // Create hospitals across major Indian cities
    const hospitals = [
      // Delhi Hospitals
      {
        name: 'AIIMS Delhi',
        location: { lat: 28.5672, lng: 77.2100 },
        address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
        totalBeds: 500, availableBeds: 45,
        contactNumber: '+91-11-26588500',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'Blood Bank', 'ICU', 'NICU'],
        averageResponseTime: 10, rating: 4.8
      },
      {
        name: 'Max Super Speciality Hospital',
        location: { lat: 28.6013, lng: 77.1987 },
        address: 'Press Enclave Road, Saket, New Delhi',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology'],
        totalBeds: 300, availableBeds: 75,
        contactNumber: '+91-11-26515050',
        accreditation: 'JCI',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'ICU'],
        averageResponseTime: 12, rating: 4.6
      },
      
      // Mumbai Hospitals
      {
        name: 'Lilavati Hospital',
        location: { lat: 19.0507, lng: 72.8286 },
        address: 'Bandra Reclamation, Bandra West, Mumbai',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
        totalBeds: 350, availableBeds: 55,
        contactNumber: '+91-22-26751000',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'ICU', 'NICU'],
        averageResponseTime: 15, rating: 4.7
      },
      {
        name: 'Kokilaben Dhirubhai Ambani Hospital',
        location: { lat: 19.1126, lng: 72.8519 },
        address: 'Four Bungalows, Andheri West, Mumbai',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
        totalBeds: 750, availableBeds: 90,
        contactNumber: '+91-22-42699999',
        accreditation: 'JCI',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'Blood Bank', 'ICU', 'NICU'],
        averageResponseTime: 12, rating: 4.9
      },
      {
        name: 'Bombay Hospital',
        location: { lat: 18.9431, lng: 72.8231 },
        address: '12, New Marine Lines, Mumbai',
        specializations: ['cardiac', 'trauma', 'general', 'neurology'],
        totalBeds: 450, availableBeds: 40,
        contactNumber: '+91-22-22067676',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'CT Scan', 'MRI', 'ICU'],
        averageResponseTime: 18, rating: 4.5
      },
      
      // Jaipur Hospitals
      {
        name: 'SMS Hospital Jaipur',
        location: { lat: 26.9124, lng: 75.7873 },
        address: 'Jawahar Lal Nehru Marg, Jaipur',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
        totalBeds: 600, availableBeds: 80,
        contactNumber: '+91-141-2560291',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'ICU', 'NICU'],
        averageResponseTime: 20, rating: 4.3
      },
      {
        name: 'Fortis Escorts Hospital Jaipur',
        location: { lat: 26.8929, lng: 75.8062 },
        address: 'Jawahar Lal Nehru Marg, Malviya Nagar, Jaipur',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology'],
        totalBeds: 250, availableBeds: 35,
        contactNumber: '+91-141-2547000',
        accreditation: 'JCI',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'CT Scan', 'MRI', 'ICU'],
        averageResponseTime: 15, rating: 4.6
      },
      
      // Bangalore Hospitals
      {
        name: 'Apollo Hospital Bangalore',
        location: { lat: 12.9345, lng: 77.6097 },
        address: '154/11, Bannerghatta Road, Bangalore',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
        totalBeds: 400, availableBeds: 65,
        contactNumber: '+91-80-26304050',
        accreditation: 'JCI',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'ICU', 'NICU'],
        averageResponseTime: 14, rating: 4.7
      },
      {
        name: 'Manipal Hospital',
        location: { lat: 12.9401, lng: 77.6173 },
        address: '98, HAL Airport Road, Bangalore',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology'],
        totalBeds: 600, availableBeds: 70,
        contactNumber: '+91-80-25024444',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'ICU'],
        averageResponseTime: 16, rating: 4.5
      },
      
      // Chennai Hospitals
      {
        name: 'Apollo Hospital Chennai',
        location: { lat: 13.0621, lng: 80.2503 },
        address: '21, Greams Lane, Chennai',
        specializations: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
        totalBeds: 500, availableBeds: 60,
        contactNumber: '+91-44-28290200',
        accreditation: 'JCI',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'ICU', 'NICU'],
        averageResponseTime: 13, rating: 4.8
      },
      {
        name: 'Fortis Malar Hospital',
        location: { lat: 13.0342, lng: 80.2462 },
        address: '52, 1st Main Road, Adyar, Chennai',
        specializations: ['cardiac', 'trauma', 'general', 'neurology'],
        totalBeds: 300, availableBeds: 45,
        contactNumber: '+91-44-42892222',
        accreditation: 'NABH',
        emergencyServices: ['Cath Lab', 'Trauma Bay', 'CT Scan', 'ICU'],
        averageResponseTime: 17, rating: 4.4
      }
    ];
    
    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`Created ${createdHospitals.length} hospitals across India`);
    
    // Create sample users
    const operatorUser = new User({
      name: 'John Operator',
      email: 'operator@rapidcare.com',
      password: 'password123',
      role: 'ambulance_operator'
    });
    await operatorUser.save();
    
    // Create hospital staff for AIIMS
    const hospitalStaffUser = new User({
      name: 'Dr. Sarah Staff',
      email: 'staff@rapidcare.com',
      password: 'password123',
      role: 'hospital_staff',
      linkedHospitalId: createdHospitals[0]._id
    });
    await hospitalStaffUser.save();
    
    await Hospital.findByIdAndUpdate(createdHospitals[0]._id, {
      staffUserId: hospitalStaffUser._id
    });
    
    console.log('Created sample users');
    console.log('Operator: operator@rapidcare.com / password123');
    console.log('Staff: staff@rapidcare.com / password123 (AIIMS Delhi)');
    console.log('\nHospitals available in: Delhi, Mumbai, Jaipur, Bangalore, Chennai');
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
