import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkInspectionDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
      const { default: Inspection } = await import('./models/Inspection.js');
    const { default: Workflow } = await import('./models/Workflow.js');
    const { default: User } = await import('./models/User.js');
    
    // Get a few sample inspections with all date fields
    const inspections = await Inspection.find().limit(3).populate('assignedTo', 'name').populate('approverId', 'name');
    
    console.log('\nDetailed inspection date analysis:\n');
    
    for (let inspection of inspections) {
      console.log(`Inspection ID: ${inspection._id}`);
      console.log(`Workflow Name: ${inspection.workflowName}`);
      console.log(`Inspection Date: ${inspection.inspectionDate}`);
      console.log(`Created At: ${inspection.createdAt}`);
      console.log(`Updated At: ${inspection.updatedAt}`);
      
      // Get the related workflow to compare creation dates
      if (inspection.workflowId) {
        try {
          const workflow = await Workflow.findById(inspection.workflowId);
          if (workflow) {
            console.log(`Workflow Created At: ${workflow.createdAt}`);
            console.log(`Workflow Updated At: ${workflow.updatedAt}`);
          }
        } catch (e) {
          console.log('Could not find workflow:', e.message);
        }
      }
      
      console.log('---\n');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInspectionDates();
