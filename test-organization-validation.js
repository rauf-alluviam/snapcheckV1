// Test organization validation issue
const API_URL = 'http://localhost:5000';

async function testOrganizationValidation() {
  console.log('Testing organization validation...');
  
  // Test data that should work
  const validOrgData = {
    name: 'ABC',
    address: '123 Main Street, City, State 12345',
    phone: '5551234567',  // Simple format without formatting
    email: 'contact@abc.com',
    industry: 'Technology',
    size: 'small',
    settings: {
      allowUserInvites: true,
      requireApproverReview: true
    }
  };
  // Test data with common phone formats that might fail
  const testCases = [
    {
      name: 'Phone with dashes',
      data: { ...validOrgData, name: 'ABC-Dashes', phone: '555-123-4567' }
    },
    {
      name: 'Phone with spaces',
      data: { ...validOrgData, name: 'ABC-Spaces', phone: '555 123 4567' }
    },
    {
      name: 'Phone with parentheses',
      data: { ...validOrgData, name: 'ABC-Parens', phone: '(555) 123-4567' }
    },
    {
      name: 'Phone with country code',
      data: { ...validOrgData, name: 'ABC-Country', phone: '+1 555 123 4567' }
    },
    {
      name: 'Phone starting with 0',
      data: { ...validOrgData, name: 'ABC-Zero', phone: '0123456789' }
    },
    {
      name: 'Valid simple phone',
      data: { ...validOrgData, name: 'ABC-Simple' }
    }
  ];
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      console.log(`Phone format: "${testCase.data.phone}"`);
      
      const response = await fetch(`${API_URL}/api/organizations/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });
      
      if (response.ok) {
        console.log('✅ SUCCESS:', response.status);
      } else {
        const errorData = await response.json();
        console.log('❌ FAILED:', response.status);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      }
      
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testOrganizationValidation().catch(console.error);
}

module.exports = { testOrganizationValidation };