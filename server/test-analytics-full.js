import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:5000';

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

const testAnalyticsAPIs = async () => {
  await connectDB();
  
  try {
    console.log('=== Testing Analytics APIs with Authentication ===\n');
    
    // Step 1: Find an approver user
    const user = await User.findOne({ role: 'approver' });
    if (!user) {
      console.log('❌ No approver user found');
      return;
    }
    
    console.log('📋 Found test user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });
    
    // Step 2: Create JWT token
    const payload = {
      user: {
        id: user._id,
        role: user.role,
        organizationId: user.organizationId
      }
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'jwtSecret';
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
    
    console.log('🔑 Generated JWT token for API testing\n');
    
    // Step 3: Test auth endpoint first
    console.log('1. Testing auth endpoint...');
    const authResponse = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Auth check successful');
      console.log('   User:', authData.name, '|', authData.role);
    } else {
      console.log('❌ Auth check failed:', authResponse.status);
      const errorText = await authResponse.text();
      console.log('   Error:', errorText);
      return;
    }
    
    // Step 4: Test categories API
    console.log('\n2. Testing inspections categories API...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/api/inspections/categories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categories API successful');
      console.log('   Categories:', categoriesData);
    } else {
      console.log('❌ Categories API failed:', categoriesResponse.status);
      const errorText = await categoriesResponse.text();
      console.log('   Error:', errorText);
    }
    
    // Step 5: Test users API with role filter
    console.log('\n3. Testing users API with role filter...');
    const usersResponse = await fetch(`${API_BASE_URL}/api/users?role=inspector`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users API successful');
      console.log('   Inspector count:', usersData.length);
      if (usersData.length > 0) {
        console.log('   First inspector:', usersData[0].name, '|', usersData[0].role);
      }
    } else {
      console.log('❌ Users API failed:', usersResponse.status);
      const errorText = await usersResponse.text();
      console.log('   Error:', errorText);
    }
    
    // Step 6: Test user-wise analytics API
    console.log('\n4. Testing user-wise analytics API...');
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    const analyticsResponse = await fetch(`${API_BASE_URL}/api/reports/user-wise?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log('✅ User-wise analytics API successful');
      
      // Handle the wrapped response structure
      const userDataArray = analyticsData.data || analyticsData;
      
      if (Array.isArray(userDataArray)) {
        console.log('   Total users with inspections:', userDataArray.length);
        
        let totalInspections = 0;
        userDataArray.forEach(userData => {
          const userName = userData.user?.name || userData.userName || 'Unknown';
          const total = userData.assigned?.total || userData.total || 0;
          const pending = userData.assigned?.pending || userData.pending || 0;
          const approved = userData.assigned?.approved || userData.approved || 0;
          const rejected = userData.assigned?.rejected || userData.rejected || 0;
          
          totalInspections += total;
          console.log(`   ${userName}: ${total} inspections (${pending}P, ${approved}A, ${rejected}R)`);
        });
        
        console.log(`   Grand Total: ${totalInspections} inspections`);
        
        if (analyticsData.summary) {
          console.log('   Summary:', JSON.stringify(analyticsData.summary, null, 2));
        }
      } else {
        console.log('   ⚠️  Expected array but got:', typeof analyticsData);
      }
    } else {
      console.log('❌ User-wise analytics API failed:', analyticsResponse.status);
      const errorText = await analyticsResponse.text();
      console.log('   Error:', errorText);
    }
    
    // Step 7: Test dashboard stats API
    console.log('\n5. Testing dashboard stats API...');
    const dashboardResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
      if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API successful');
      console.log('   Response data:', JSON.stringify(dashboardData, null, 2));
      
      // Check for different possible response structures
      if (dashboardData.totalInspections !== undefined) {
        console.log('   Total Inspections:', dashboardData.totalInspections);
        console.log('   Pending:', dashboardData.pendingInspections);
        console.log('   Approved:', dashboardData.approvedInspections);
        console.log('   Rejected:', dashboardData.rejectedInspections);
      } else if (dashboardData.stats) {
        console.log('   Stats:', JSON.stringify(dashboardData.stats, null, 2));
      } else {
        console.log('   ⚠️  Unexpected dashboard response structure');
      }
    } else {
      console.log('❌ Dashboard API failed:', dashboardResponse.status);
      const errorText = await dashboardResponse.text();
      console.log('   Error:', errorText);
    }
    
    console.log('\n🎉 Analytics API test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
  }
};

testAnalyticsAPIs();
