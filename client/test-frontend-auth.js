// Test frontend authentication state and API calls
console.log('=== Frontend Authentication Test ===');

// Check localStorage for token
const token = localStorage.getItem('token');
console.log('Token in localStorage:', token ? 'Present' : 'Not Found');

if (token) {
  console.log('Token value (first 50 chars):', token.substring(0, 50) + '...');
  
  // Test API call directly
  const API_BASE_URL = 'http://localhost:5000';
  
  fetch(`${API_BASE_URL}/api/auth`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Auth check response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Auth check response data:', data);
    
    // Test dashboard API call
    return fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  })
  .then(response => {
    console.log('Dashboard API response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Dashboard API response data:', data);
  })
  .catch(error => {
    console.error('API test error:', error);
  });
}

// Check if React auth context has user data
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('React app detected - checking auth state...');
}
