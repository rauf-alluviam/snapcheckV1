/**
 * Test Registration Flow
 * This script tests the registration flow to ensure it works properly
 * Run with: node testRegistration.js
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';

/**
 * Test the registration flow
 */
async function testRegistration() {
  console.log('Starting registration flow test...');
  
  try {
    // 1. Get all organizations (public endpoint)
    console.log('\n1. Testing public organizations endpoint');
    const orgsResponse = await axios.get(`${API_URL}/api/organizations/public`);
    const organizations = orgsResponse.data;
    console.log(`Found ${organizations.length} organizations`);
    
    if (organizations.length === 0) {
      console.log('No organizations found, testing organization creation...');
      
      // 2. Create a test organization
      const newOrg = {
        name: `Test Org ${Date.now()}`,
        address: '123 Test Street',
        phone: '555-1234',
        email: `test${Date.now()}@example.com`,
        industry: 'Testing',
        size: 'small',
        settings: {
          allowUserInvites: true,
          requireApproverReview: true
        }
      };
      
      console.log('\n2. Testing organization creation');
      console.log('Creating organization:', newOrg.name);
      
      const createOrgResponse = await axios.post(`${API_URL}/api/organizations/register`, newOrg);
      const createdOrg = createOrgResponse.data;
      console.log('Organization created:', createdOrg._id);
      
      // 3. Register a test user with the created organization
      const testUser = {
        name: `Test User ${Date.now()}`,
        email: `user${Date.now()}@example.com`,
        password: 'Password123!',
        organizationId: createdOrg._id,
        role: 'admin'
      };
      
      console.log('\n3. Testing user registration');
      console.log('Registering user:', testUser.email);
      
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);
      console.log('Registration successful! User ID:', registerResponse.data.user._id);
      console.log('Auth token received:', registerResponse.data.token ? 'Yes' : 'No');
      
    } else {
      // Use existing organization for testing
      const testOrg = organizations[0];
      console.log('Using existing organization:', testOrg.name);
      
      // 3. Register a test user with an existing organization
      const testUser = {
        name: `Test User ${Date.now()}`,
        email: `user${Date.now()}@example.com`,
        password: 'Password123!',
        organizationId: testOrg.value,
        role: 'admin'
      };
      
      console.log('\n3. Testing user registration with existing org');
      console.log('Registering user:', testUser.email);
      
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);
      console.log('Registration successful! User ID:', registerResponse.data.user._id);
      console.log('Auth token received:', registerResponse.data.token ? 'Yes' : 'No');
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('\nTest failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testRegistration();
