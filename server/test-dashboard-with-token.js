import mongoose from 'mongoose';
import User from './models/User.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testDashboardWithToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the approver user
    const approverUser = await User.findOne({ email: 'aprover@gmail.com' });
    if (!approverUser) {
      console.log('Approver user not found');
      return;
    }
    
    console.log('Found approver user:', approverUser.email, 'ID:', approverUser._id);
    
    // Create a JWT token for this user
    const payload = {
      user: {
        id: approverUser._id,
        _id: approverUser._id,
        email: approverUser.email,
        role: approverUser.role,
        organizationId: approverUser.organizationId
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'jwtSecret', { expiresIn: '1h' });
    console.log('Created token for user');
    
    // Test the dashboard API
    const response = await fetch('http://localhost:5000/api/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Dashboard API response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Dashboard API failed, status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testDashboardWithToken();
