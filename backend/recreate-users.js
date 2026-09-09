const mongoose = require('mongoose');
const User = require('./models/User');
const Facility = require('./models/Facility');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function recreateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Delete all existing users
    await User.deleteMany({});
    console.log('Deleted all existing users\n');
    
    // Find facilities
    const districtHospital = await Facility.findOne({ facilityType: 'district-hospital' });
    const subCentre = await Facility.findOne({ facilityType: 'sub-centre' });
    
    console.log('District Hospital:', districtHospital?.name);
    console.log('Sub-Centre:', subCentre?.name);
    console.log('');
    
    // Pre-hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    console.log('Hashed password:', hashedPassword.substring(0, 30) + '...');
    console.log('');
    
    // Create users with pre-hashed passwords
    const users = [
      {
        name: 'John Operator',
        email: 'operator@rapidcare.com',
        password: hashedPassword,
        role: 'ambulance_operator'
      },
      {
        name: 'Dr. Sarah Staff',
        email: 'staff@rapidcare.com',
        password: hashedPassword,
        role: 'hospital_staff',
        linkedFacilityId: districtHospital?._id,
        linkedHospitalId: districtHospital?._id
      },
      {
        name: 'Asha Worker',
        email: 'chw@rapidcare.com',
        password: hashedPassword,
        role: 'community_health_worker',
        linkedFacilityId: subCentre?._id,
        languagePreference: 'hindi'
      }
    ];
    
    // Insert directly using insertMany (bypasses pre-save hook)
    const createdUsers = await User.insertMany(users);
    console.log('Created users:');
    
    for (const user of createdUsers) {
      console.log(`  - ${user.name} (${user.email})`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Hash: ${user.password.substring(0, 20)}...`);
      
      // Verify
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log(`    Password match: ${isMatch ? 'YES ✓' : 'NO ✗'}`);
      console.log('');
    }
    
    // Update facility with staff user
    if (districtHospital) {
      const staffUser = createdUsers.find(u => u.role === 'hospital_staff');
      await Facility.findByIdAndUpdate(districtHospital._id, { staffUserId: staffUser._id });
      console.log('Facility updated with staff user');
    }
    
    console.log('=== Users Recreated Successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

recreateUsers();
