// Test approver authentication and dashboard API
async function testApproverAuth() {
  console.log('=== Testing Approver Authentication ===');
  
  const API_BASE_URL = 'http://localhost:5000';
  
  try {
    // First, login as the approver user
    console.log('1. Logging in as approver user...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'alex.smith@acmecorp.com', // The approver user from our database
        password: 'password123' // Assuming this is the password
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginResponse.ok && loginData.token) {
      const token = loginData.token;
      console.log('Login successful! Token received.');
      
      // Test auth endpoint
      console.log('\n2. Testing auth endpoint...');
      const authResponse = await fetch(`${API_BASE_URL}/api/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Auth response status:', authResponse.status);
      const authData = await authResponse.json();
      console.log('Auth data:', authData);
      
      // Test dashboard API
      console.log('\n3. Testing dashboard API...');
      const dashboardResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Dashboard response status:', dashboardResponse.status);
      const dashboardData = await dashboardResponse.json();
      console.log('Dashboard data:', dashboardData);
      
      // Store token in localStorage for manual testing
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('token', token);
        console.log('\n4. Token stored in localStorage for manual testing');
      }
      
    } else {
      console.error('Login failed:', loginData);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testApproverAuth();
