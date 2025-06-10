import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('Testing login...');
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'uday@alluvium.in',
        password: 'admin123'
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data.user.name, data.user.role);
    } else {
      const error = await response.json();
      console.error('Login error:', error);
      
      // Try with different password
      console.log('Trying with password123...');
      const response2 = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'uday@alluvium.in',
          password: 'password123'
        })
      });
      
      if (response2.ok) {
        const data2 = await response2.json();
        console.log('Login successful with password123:', data2.user.name, data2.user.role);
      } else {
        const error2 = await response2.json();
        console.error('Login error with password123:', error2);
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLogin();
