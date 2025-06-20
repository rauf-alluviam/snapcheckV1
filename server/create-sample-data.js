import mongoose from 'mongoose';
import User from './models/User.js';
import Inspection from './models/Inspection.js';
import Workflow from './models/Workflow.js';

const mongoURI = 'mongodb://localhost:27017/snapcheck';

async function createSampleData() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Get existing users
    const users = await User.find({});
    const workflows = await Workflow.find({});
    
    if (users.length === 0 || workflows.length === 0) {
      console.log('Not enough users or workflows found. Need at least 1 workflow.');
      process.exit(1);
    }
    
    console.log('Found users:', users.map(u => ({ id: u._id, name: u.name, role: u.role })));
    console.log('Found workflows:', workflows.map(w => ({ id: w._id, name: w.name })));
    
    const admin = users.find(u => u.role === 'admin');
    const approver = users.find(u => u.role === 'approver');
    const inspector = users.find(u => u.role === 'inspector');
    const workflow = workflows[0];
    
    // Create sample inspections with different statuses and assignments
    const sampleInspections = [
      {
        workflowId: workflow._id,
        workflowName: workflow.name,
        category: 'facility',
        inspectionType: 'routine',
        filledSteps: [
          {
            stepId: new mongoose.Types.ObjectId(),
            stepTitle: 'Check lighting',
            responseText: 'All lights working properly',
            mediaUrls: [],
            timestamp: new Date()
          }
        ],
        assignedTo: inspector._id,
        approverId: approver._id,
        approvers: [{
          userId: approver._id,
          status: 'approved',
          remarks: 'Good work',
          actionDate: new Date()
        }],
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: approver._id,
        organizationId: admin.organizationId,
        inspectionDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      },
      {
        workflowId: workflow._id,
        workflowName: workflow.name,
        category: 'cargo',
        inspectionType: 'special',
        filledSteps: [
          {
            stepId: new mongoose.Types.ObjectId(),
            stepTitle: 'Check cargo weight',
            responseText: 'Weight within limits',
            mediaUrls: [],
            timestamp: new Date()
          }
        ],
        assignedTo: inspector._id,
        approverId: approver._id,
        approvers: [{
          userId: approver._id,
          status: 'pending',
          remarks: '',
          actionDate: null
        }],
        status: 'pending',
        organizationId: admin.organizationId,
        inspectionDate: new Date(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      },
      {
        workflowId: workflow._id,
        workflowName: workflow.name,
        category: 'vehicle',
        inspectionType: 'routine',
        filledSteps: [
          {
            stepId: new mongoose.Types.ObjectId(),
            stepTitle: 'Check tire pressure',
            responseText: 'Tire pressure low',
            mediaUrls: [],
            timestamp: new Date()
          }
        ],
        assignedTo: admin._id, // Admin assigned
        approverId: approver._id,
        approvers: [{
          userId: approver._id,
          status: 'rejected',
          remarks: 'Need to fix tire pressure first',
          actionDate: new Date()
        }],
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: approver._id,
        rejectionReason: 'Safety issue - tire pressure needs attention',
        organizationId: admin.organizationId,
        inspectionDate: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      },
      {
        workflowId: workflow._id,
        workflowName: workflow.name,
        category: 'facility',
        inspectionType: 'routine',
        filledSteps: [
          {
            stepId: new mongoose.Types.ObjectId(),
            stepTitle: 'Check emergency exits',
            responseText: 'All exits clear and accessible',
            mediaUrls: [],
            timestamp: new Date()
          }
        ],
        assignedTo: approver._id, // Approver assigned to inspection
        approverId: admin._id, // Admin as approver
        approvers: [{
          userId: admin._id,
          status: 'approved',
          remarks: 'Excellent safety compliance',
          actionDate: new Date()
        }],
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: admin._id,
        organizationId: admin.organizationId,
        inspectionDate: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      }
    ];
    
    // Insert sample inspections
    const insertedInspections = await Inspection.insertMany(sampleInspections);
    console.log(`Created ${insertedInspections.length} sample inspections`);
    
    // Show final stats
    const totalInspections = await Inspection.countDocuments();
    console.log(`Total inspections in database: ${totalInspections}`);
    
    // Show breakdown by user
    for (const user of users) {
      const assignedCount = await Inspection.countDocuments({ assignedTo: user._id });
      const approvedByCount = await Inspection.countDocuments({ approvedBy: user._id });
      const rejectedByCount = await Inspection.countDocuments({ rejectedBy: user._id });
      
      console.log(`${user.name} (${user.role}):`);
      console.log(`  - Assigned: ${assignedCount}`);
      console.log(`  - Approved: ${approvedByCount}`);
      console.log(`  - Rejected: ${rejectedByCount}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSampleData();
