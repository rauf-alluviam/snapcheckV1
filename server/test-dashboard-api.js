import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testDashboardAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get the approver user
    const approverUser = await User.findOne({ role: 'approver' });
    console.log('Found approver user:', approverUser.email, 'ID:', approverUser._id);
    
    // Test login to get auth token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: approverUser.email,
        password: 'password123' // assuming default password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed, status:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.log('Login error:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful, got token');
    
    // Test dashboard API
    const dashboardResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!dashboardResponse.ok) {
      console.log('Dashboard API failed, status:', dashboardResponse.status);
      const errorText = await dashboardResponse.text();
      console.log('Dashboard error:', errorText);
      return;
    }
    
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard API response:', JSON.stringify(dashboardData, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testDashboardAPI();
