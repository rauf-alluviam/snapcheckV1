import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapcheck');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

const debugJWTToken = async () => {
  await connectDB();
  
  try {
    // Find the approver user
    const user = await User.findOne({ email: 'aprover@gmail.com' });
    if (!user) {
      console.log('Approver user not found');
      return;
    }
    
    console.log('Found user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });
    
    // Create JWT token exactly like the login route does
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        organizationId: user.organizationId
      }
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'jwtSecret';
    console.log('Using JWT Secret:', jwtSecret);
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
    
    console.log('Generated Token:', token);
    console.log('Token Length:', token.length);
    
    // Now try to verify the same token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Token verified successfully!');
      console.log('Decoded payload:', decoded);
      
      // Test the user lookup that the auth middleware does
      const dbUser = await User.findById(decoded.user.id).select('-password');
      if (dbUser) {
        console.log('User found in database:', {
          id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        });
      } else {
        console.log('User NOT found in database with ID:', decoded.user.id);
      }
      
    } catch (verifyErr) {
      console.error('Token verification failed:', verifyErr.message);
      console.error('Error type:', verifyErr.name);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  mongoose.connection.close();
};

debugJWTToken();
