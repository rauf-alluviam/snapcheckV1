import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('MongoDB URI:', process.env.MONGODB_URI);

async function checkInspections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const { default: Inspection } = await import('./server/models/Inspection.js');
    
    // Count total inspections
    const totalCount = await Inspection.countDocuments();
    console.log('Total inspections in database:', totalCount);
    
    // Count by status
    const pendingCount = await Inspection.countDocuments({ status: 'pending' });
    const approvedCount = await Inspection.countDocuments({ status: 'approved' });
    const rejectedCount = await Inspection.countDocuments({ status: 'rejected' });
    
    console.log('Status breakdown:');
    console.log('- Pending:', pendingCount);
    console.log('- Approved:', approvedCount);
    console.log('- Rejected:', rejectedCount);
    
    // Get sample inspection data
    const sampleInspections = await Inspection.find().limit(3).populate('assignedTo', 'name').populate('approverId', 'name');
    console.log('\nSample inspections:');
    sampleInspections.forEach((inspection, index) => {
      console.log(`${index + 1}. ID: ${inspection._id}, Status: ${inspection.status}, Workflow: ${inspection.workflowName}`);
      console.log(`   Assigned to: ${inspection.assignedTo?.name || 'N/A'}`);
      console.log(`   Approver: ${inspection.approverId?.name || 'N/A'}`);
      console.log(`   Organization: ${inspection.organizationId}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInspections();
