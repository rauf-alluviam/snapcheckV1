import fetch from 'node-fetch';
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

const testDashboardAPI = async () => {
  await connectDB();
  
  try {
    // Find the approver user
    const user = await User.findOne({ email: 'aprover@gmail.com' });
    if (!user) {
      console.log('Approver user not found');
      return;
    }
    
    console.log('Testing with user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        organizationId: user.organizationId
      }
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'jwtSecret';
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
    
    console.log('Generated token for API test');
    
    // Test the dashboard API endpoint
    const response = await fetch('http://localhost:5000/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('API Response Body:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed Dashboard Data:', data);
      } catch (parseErr) {
        console.log('Failed to parse JSON response');
      }
    } else {
      console.log('API call failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  mongoose.connection.close();
};

testDashboardAPI();
