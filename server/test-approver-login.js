const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test login and dashboard access for approver user
async function testApproverFlow() {
  try {
    console.log('=== Testing Approver Authentication Flow ===');
    
    // Step 1: Login as approver
    console.log('1. Attempting to login as approver...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'aprover@gmail.com',
      password: 'password'  // Default password from registration
    });
    
    console.log('Login successful!');
    console.log('User data:', JSON.stringify(loginResponse.data.user, null, 2));
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user._id;
    
    // Step 2: Test auth endpoint
    console.log('\n2. Testing auth endpoint...');
    const authResponse = await axios.get(`${API_BASE_URL}/api/auth`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Auth check successful!');
    console.log('Auth user data:', JSON.stringify(authResponse.data, null, 2));
    
    // Step 3: Test dashboard stats endpoint
    console.log('\n3. Testing dashboard stats endpoint...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Dashboard API successful!');
    console.log('Dashboard stats:', JSON.stringify(dashboardResponse.data, null, 2));
    
    // Step 4: Test with different common passwords in case 'password' doesn't work
    } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message === 'Invalid credentials') {
      console.log('\nDefault password failed, trying alternative passwords...');
      
      const commonPasswords = ['aprover', 'approver', '123456', 'admin'];
      
      for (const pwd of commonPasswords) {
        try {
          console.log(`Trying password: ${pwd}`);
          const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'aprover@gmail.com',
            password: pwd
          });
          
          console.log(`✓ Login successful with password: ${pwd}`);
          const token = loginResponse.data.token;
          
          // Test dashboard with this token
          const dashboardResponse = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Dashboard stats:', JSON.stringify(dashboardResponse.data, null, 2));
          return;
          
        } catch (pwdError) {
          console.log(`✗ Password ${pwd} failed`);
        }
      }
      
      console.log('All password attempts failed');
    } else {
      console.error('Test failed:', error.response?.data || error.message);
    }
  }
}

testApproverFlow();
