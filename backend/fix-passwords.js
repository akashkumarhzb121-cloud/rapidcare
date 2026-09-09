const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function fixPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log(`Fixing password for: ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Old password hash: ${user.password?.substring(0, 20)}...`);
      
      // Set password directly (will trigger pre-save hook)
      user.password = 'password123';
      await user.save();
      
      console.log(`  New password: password123`);
      console.log(`  New hash: ${user.password?.substring(0, 20)}...`);
      
      // Verify
      const isMatch = await user.comparePassword('password123');
      console.log(`  Password match: ${isMatch ? 'YES ✓' : 'NO ✗'}`);
      console.log('');
    }
    
    console.log('=== Password Fix Complete ===');
    console.log('All users now have password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPasswords();
