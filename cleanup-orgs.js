// Clean up existing ABC organization
const API_URL = 'http://localhost:5000';

async function cleanupOrganizations() {
  console.log('Cleaning up test organizations...');
  
  try {
    // Note: This is a destructive operation - in production you'd want proper admin authentication
    // For now, we'll just check if we can find a way to delete via API or direct DB
    
    console.log('Organizations need to be cleaned up manually from MongoDB');
    console.log('Connect to MongoDB and run: db.organizations.deleteMany({name: /^ABC/})');
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

cleanupOrganizations().catch(console.error);
