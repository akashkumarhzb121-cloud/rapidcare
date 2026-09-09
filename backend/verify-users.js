const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function verifyUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const users = await User.find({});
    console.log('All users and password verification:\n');
    
    for (const user of users) {
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Password hash starts with: ${user.password?.substring(0, 4)}`);
      console.log(`  Password length: ${user.password?.length}`);
      
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log(`  Password 'password123' matches: ${isMatch ? 'YES ✓' : 'NO ✗'}`);
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyUsers();
