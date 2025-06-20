import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find().select('email role organizationId');
    console.log('All users:');
    users.forEach(user => {
      console.log(`Email: ${user.email}, Role: ${user.role}, ID: ${user._id}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
