const axios = require('axios');

(async () => {
  try {
    console.log('Testing new API endpoints...');
    
    // Login first
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'uday@alluvium.in',
      password: '123456'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    
    // Test categories endpoint
    console.log('\n🔍 Testing categories endpoint...');
    const categoriesRes = await axios.get('http://localhost:5000/api/inspections/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Categories:', categoriesRes.data);
    
    // Test inspectors endpoint
    console.log('\n🔍 Testing inspectors endpoint...');
    const inspectorsRes = await axios.get('http://localhost:5000/api/users?role=inspector', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Inspectors:', inspectorsRes.data.map(u => ({ 
      _id: u._id, 
      name: u.name, 
      role: u.role 
    })));
    
    // Test approvers endpoint
    console.log('\n🔍 Testing approvers endpoint...');
    const approversRes = await axios.get('http://localhost:5000/api/users?role=approver', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Approvers:', approversRes.data.map(u => ({ 
      _id: u._id, 
      name: u.name, 
      role: u.role 
    })));
    
    // Test workflow categories
    console.log('\n🔍 Testing workflow categories endpoint...');
    const workflowCategoriesRes = await axios.get('http://localhost:5000/api/workflows/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Workflow Categories:', workflowCategoriesRes.data);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
})();
