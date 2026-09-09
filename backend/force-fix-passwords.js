const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function forceFixPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log(`Fixing: ${user.name} (${user.email})`);
      console.log(`  Old password field: "${user.password}"`);
      console.log(`  Old hash length: ${user.password?.length}`);
      
      // Directly hash the password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      console.log(`  New hash: ${hashedPassword.substring(0, 30)}...`);
      console.log(`  New hash length: ${hashedPassword.length}`);
      
      // Update directly in database (bypass pre-save hook)
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      // Verify from database
      const updatedUser = await User.findById(user._id);
      const isMatch = await bcrypt.compare('password123', updatedUser.password);
      console.log(`  Password match after direct update: ${isMatch ? 'YES ✓' : 'NO ✗'}`);
      console.log('');
    }
    
    console.log('=== Password Fix Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

forceFixPasswords();
