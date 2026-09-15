const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function addAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const admins = [
      {
        name: 'Maharashtra Health Commissioner',
        email: 'admin@rapidcare.com',
        password: hashedPassword,
        role: 'district_admin',
        languagePreference: 'en'
      },
      {
        name: 'Pune District Health Officer',
        email: 'pune.admin@rapidcare.com',
        password: hashedPassword,
        role: 'district_admin',
        languagePreference: 'mr'
      }
    ];

    for (const a of admins) {
      await User.findOneAndUpdate(
        { email: a.email },
        a,
        { upsert: true, new: true }
      );
      console.log(`✓ ${a.name} (${a.email})`);
    }

    console.log('\n✅ District admin users created. Password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addAdmin();
