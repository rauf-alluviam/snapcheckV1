import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testDeleteInspection() {
  try {
    // First, login as admin to get token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },      body: JSON.stringify({
        email: 'uday@alluvium.in',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Admin login successful');

    // Get list of inspections first
    const inspectionsResponse = await fetch(`${API_BASE}/inspections`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!inspectionsResponse.ok) {
      console.error('Failed to fetch inspections:', inspectionsResponse.status);
      return;
    }

    const inspections = await inspectionsResponse.json();
    console.log(`Found ${inspections.length} inspections`);

    if (inspections.length === 0) {
      console.log('No inspections to test delete on');
      return;
    }

    // Try to delete the first inspection
    const inspectionToDelete = inspections[0];
    console.log(`Attempting to delete inspection: ${inspectionToDelete._id}`);

    const deleteResponse = await fetch(`${API_BASE}/inspections/${inspectionToDelete._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('Delete successful:', result.message);
    } else {
      const error = await deleteResponse.json();
      console.error('Delete failed:', deleteResponse.status, error.message);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testDeleteInspection();
