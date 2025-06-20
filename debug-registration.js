// Debug the exact registration issue
const API_URL = 'http://localhost:5000';

async function debugRegistration() {
  console.log('Debugging registration issue...');
  
  // Test the exact data that might be sent from the frontend
  const registrationData = {
    name: 'ABC',
    address: '123 Main Street',
    phone: '555-123-4567',  // Common format with dashes
    email: 'contact@abc.com',
    industry: 'Technology',
    size: 'small',
    settings: {
      allowUserInvites: true,
      requireApproverReview: true
    }
  };

  try {
    console.log('Sending data:', JSON.stringify(registrationData, null, 2));
    
    const response = await fetch(`${API_URL}/api/organizations/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json();
      console.log('❌ FAILED:', response.status);
      console.log('Error details:', JSON.stringify(errorData, null, 2));
    }
    
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }
}

debugRegistration().catch(console.error);
