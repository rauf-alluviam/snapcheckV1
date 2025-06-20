import mongoose from 'mongoose';
import Inspection from './models/Inspection.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDashboardFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userId = '68467b71cf4ca34ddbacef62';
    const organizationId = '68467b44cf4ca34ddbacef46';
      // Test the new query logic - same as in dashboard.js
    let baseQuery = { organizationId };
    baseQuery.$or = [
      { approverId: userId },
      { 'approvers.userId': userId }
    ];
    
    console.log('Query:', JSON.stringify(baseQuery, null, 2));
    
    const inspections = await Inspection.find(baseQuery);
    console.log('Found inspections:', inspections.length);
    
    // Calculate summary statistics
    const summaryStats = {
      total: inspections.length,
      pending: inspections.filter(i => i.status === 'pending').length,
      approved: inspections.filter(i => i.status === 'approved').length,
      rejected: inspections.filter(i => i.status === 'rejected').length
    };
    
    console.log('Summary stats:', summaryStats);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testDashboardFix();
