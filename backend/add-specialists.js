const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Facility = require('./models/Facility');

dotenv.config();

const addSpecialists = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Get a reference facility (Sassoon)
    const sassoon = await Facility.findOne({ name: 'Sassoon General Hospital' });

    const specialists = [
      {
        name: 'Dr. Anjali Deshmukh',
        email: 'cardio.specialist@rapidcare.com',
        password: hashedPassword,
        role: 'specialist',
        specialization: 'cardiac',
        linkedFacilityId: sassoon?._id,
        linkedHospitalId: sassoon?._id,
        languagePreference: 'mr',
        isAvailableForConsult: true
      },
      {
        name: 'Dr. Vikram Kulkarni',
        email: 'neuro.specialist@rapidcare.com',
        password: hashedPassword,
        role: 'specialist',
        specialization: 'neurology',
        linkedFacilityId: sassoon?._id,
        linkedHospitalId: sassoon?._id,
        languagePreference: 'mr',
        isAvailableForConsult: true
      },
      {
        name: 'Dr. Priya Naik',
        email: 'pediatric.specialist@rapidcare.com',
        password: hashedPassword,
        role: 'specialist',
        specialization: 'pediatric',
        linkedFacilityId: sassoon?._id,
        linkedHospitalId: sassoon?._id,
        languagePreference: 'mr',
        isAvailableForConsult: true
      },
      {
        name: 'Dr. Sanjay Patil',
        email: 'general.specialist@rapidcare.com',
        password: hashedPassword,
        role: 'specialist',
        specialization: 'general',
        linkedFacilityId: sassoon?._id,
        linkedHospitalId: sassoon?._id,
        languagePreference: 'mr',
        isAvailableForConsult: true
      },
      {
        name: 'Dr. Meera Joshi',
        email: 'respiratory.specialist@rapidcare.com',
        password: hashedPassword,
        role: 'specialist',
        specialization: 'respiratory',
        linkedFacilityId: sassoon?._id,
        linkedHospitalId: sassoon?._id,
        languagePreference: 'mr',
        isAvailableForConsult: true
      }
    ];

    // Upsert by email (in case they exist)
    for (const spec of specialists) {
      await User.findOneAndUpdate(
        { email: spec.email },
        spec,
        { upsert: true, new: true }
      );
      console.log(`✓ ${spec.name} (${spec.specialization})`);
    }

    console.log('\n✅ Specialists added successfully');
    console.log('All passwords: password123\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addSpecialists();
