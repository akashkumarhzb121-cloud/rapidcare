const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

async function testCHWLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Find CHW user
    const chw = await User.findOne({ email: 'chw@rapidcare.com' });
    console.log('CHW User found:', chw?.name);
    console.log('Role:', chw?.role);
    console.log('Password hash exists:', !!chw?.password);
    console.log('Password hash length:', chw?.password?.length);
    
    if (chw) {
      // Test password comparison
      const isMatch = await chw.comparePassword('password123');
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('\nPassword mismatch! Re-hashing...');
        chw.password = 'password123';
        await chw.save();
        console.log('Password re-hashed successfully');
        
        // Test again
        const reTest = await chw.comparePassword('password123');
        console.log('Password match after fix:', reTest);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCHWLogin();
