import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAnalyticsAPIs() {
  try {
    console.log('Testing Categories API...');
    
    // Test 1: Categories API
    const categoriesResponse = await fetch(`${BASE_URL}/api/inspections/categories`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg0NjdiNDRjZjRjYTM0ZGRiYWNlZjQ2Iiwicm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiI2ODQ2N2I0NGNmNGNhMzRkZGJhY2VmNDYifSwiaWF0IjoxNzMzNzQ1NjMwLCJleHAiOjE3MzM3NDkyMzB9.N75qfBrKbgDQwO3Bx8hPdKCB1JL_LR9-RhVfXgRGdwo'
      }
    });
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log('✅ Categories API Success:', categories);
    } else {
      console.log('❌ Categories API Failed:', categoriesResponse.status, await categoriesResponse.text());
    }

    console.log('\nTesting Users API (inspectors)...');
    
    // Test 2: Users API with role filter
    const inspectorsResponse = await fetch(`${BASE_URL}/api/users?role=inspector`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg0NjdiNDRjZjRjYTM0ZGRiYWNlZjQ2Iiwicm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiI2ODQ2N2I0NGNmNGNhMzRkZGJhY2VmNDYifSwiaWF0IjoxNzMzNzQ1NjMwLCJleHAiOjE3MzM3NDkyMzB9.N75qfBrKbgDQwO3Bx8hPdKCB1JL_LR9-RhVfXgRGdwo'
      }
    });
    
    if (inspectorsResponse.ok) {
      const inspectors = await inspectorsResponse.json();
      console.log('✅ Inspectors API Success:', inspectors);
    } else {
      console.log('❌ Inspectors API Failed:', inspectorsResponse.status, await inspectorsResponse.text());
    }

    console.log('\nTesting Analytics API...');
    
    // Test 3: Analytics API
    const analyticsResponse = await fetch(`${BASE_URL}/api/reports/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg0NjdiNDRjZjRjYTM0ZGRiYWNlZjQ2Iiwicm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiI2ODQ2N2I0NGNmNGNhMzRkZGJhY2VmNDYifSwiaWF0IjoxNzMzNzQ1NjMwLCJleHAiOjE3MzM3NDkyMzB9.N75qfBrKbgDQwO3Bx8hPdKCB1JL_LR9-RhVfXgRGdwo'
      },
      body: JSON.stringify({
        startDate: '2025-05-10',
        endDate: '2025-06-09',
        category: 'all',
        inspector: 'all'
      })
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      console.log('✅ Analytics API Success:');
      console.log('   - Status Distribution:', analytics.statusDistribution);
      console.log('   - Category Distribution:', analytics.categoryDistribution);
      console.log('   - Inspector Performance:', analytics.inspectorPerformance?.length || 0, 'inspectors');
    } else {
      console.log('❌ Analytics API Failed:', analyticsResponse.status, await analyticsResponse.text());
    }

    console.log('\nTesting User-wise API...');
    
    // Test 4: User-wise API (the one that was fixed)
    const userWiseResponse = await fetch(`${BASE_URL}/api/reports/user-wise?startDate=2025-05-10&endDate=2025-06-09`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjg0NjdiNDRjZjRjYTM0ZGRiYWNlZjQ2Iiwicm9sZSI6ImFkbWluIiwib3JnYW5pemF0aW9uSWQiOiI2ODQ2N2I0NGNmNGNhMzRkZGJhY2VmNDYifSwiaWF0IjoxNzMzNzQ1NjMwLCJleHAiOjE3MzM3NDkyMzB9.N75qfBrKbgDQwO3Bx8hPdKCB1JL_LR9-RhVfXgRGdwo'
      }
    });
    
    if (userWiseResponse.ok) {
      const userWise = await userWiseResponse.json();
      console.log('✅ User-wise API Success:');
      console.log('   - Total Users:', userWise.summary?.totalUsers || userWise.data?.length);
      console.log('   - Total Inspections:', userWise.summary?.totalInspections);
      console.log('   - Sample User Data:', userWise.data?.[0] || 'No data');
    } else {
      console.log('❌ User-wise API Failed:', userWiseResponse.status, await userWiseResponse.text());
    }

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

testAnalyticsAPIs();
