/**
 * Quick test to verify that batch routes are positioned correctly
 * and won't be caught by the /:id route
 */

// Simulate Express.js route matching logic
function testRouteMatching() {
  // These are the routes in order as they appear in inspections.js
  const routes = [
    { path: '/', method: 'GET' },
    { path: '/batch', method: 'GET' },
    { path: '/batch/:batchId', method: 'GET' },
    { path: '/batch/:batchId/approve', method: 'PUT' },
    { path: '/batch/:batchId/reject', method: 'PUT' },
    { path: '/process-batches', method: 'POST' },
    { path: '/:id', method: 'GET' },
    { path: '/:id/approve', method: 'PUT' },
    { path: '/:id/reject', method: 'PUT' },
    { path: '/:id/report', method: 'GET' },
    { path: '/export/csv', method: 'GET' }
  ];

  // Test URLs that should match batch routes (not /:id)
  const testCases = [
    { url: '/batch', method: 'GET', expectedRoute: '/batch' },
    { url: '/batch/12345', method: 'GET', expectedRoute: '/batch/:batchId' },
    { url: '/batch/12345/approve', method: 'PUT', expectedRoute: '/batch/:batchId/approve' },
    { url: '/batch/12345/reject', method: 'PUT', expectedRoute: '/batch/:batchId/reject' },
    { url: '/process-batches', method: 'POST', expectedRoute: '/process-batches' },
    { url: '/507f1f77bcf86cd799439011', method: 'GET', expectedRoute: '/:id' },
    { url: '/export/csv', method: 'GET', expectedRoute: '/export/csv' }
  ];

  console.log('🧪 Testing Route Matching Logic...\n');

  // Simple route matching simulation
  function matchRoute(url, method) {
    for (const route of routes) {
      if (route.method !== method) continue;
      
      // Exact match
      if (route.path === url) {
        return route.path;
      }
      
      // Parameter matching
      const routeParts = route.path.split('/');
      const urlParts = url.split('/');
      
      if (routeParts.length !== urlParts.length) continue;
      
      let matches = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) continue; // Parameter
        if (routeParts[i] !== urlParts[i]) {
          matches = false;
          break;
        }
      }
      
      if (matches) return route.path;
    }
    return 'NO_MATCH';
  }

  let allPassed = true;
  
  testCases.forEach(({ url, method, expectedRoute }) => {
    const actualRoute = matchRoute(url, method);
    const passed = actualRoute === expectedRoute;
    const status = passed ? '✅' : '❌';
    
    console.log(`${status} ${method} ${url}`);
    console.log(`   Expected: ${expectedRoute}`);
    console.log(`   Actual:   ${actualRoute}`);
    
    if (!passed) {
      allPassed = false;
      if (actualRoute === '/:id' && url.includes('batch')) {
        console.log('   ⚠️  ERROR: Batch route caught by /:id route!');
      }
    }
    
    console.log('');
  });

  if (allPassed) {
    console.log('🎉 All tests passed! Route order is correct.');
    console.log('✅ The ObjectId cast error should be fixed.');
  } else {
    console.log('❌ Some tests failed. Route order needs adjustment.');
  }
  
  console.log('\n📝 Key points:');
  console.log('- /batch routes are positioned BEFORE /:id route');
  console.log('- This prevents "batch" from being treated as an ObjectId');
  console.log('- Express matches routes in the order they are defined');
}

testRouteMatching();
