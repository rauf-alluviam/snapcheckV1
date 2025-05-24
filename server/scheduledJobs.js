// Scheduled tasks for inspection processing
import cron from 'node-cron';
import { groupInspectionsForBulkApproval } from './utils/autoApproval.js';
import Organization from './models/Organization.js';
import Inspection from './models/Inspection.js';

/**
 * Initialize all cron jobs
 */
export const initScheduledJobs = () => {
  // Process bulk approvals daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled task: Group inspections for bulk approval');
    try {
      // Get all organizations
      const organizations = await Organization.find({});
      
      // Process for each organization
      for (const org of organizations) {
        console.log(`Processing organization: ${org.name}`);
        await groupInspectionsForBulkApproval(org._id);
      }
      
      console.log('Bulk approval processing completed');
    } catch (error) {
      console.error('Error in bulk approval cron job:', error);
    }
  });

  // Clean up old batches that are already processed (once a week)
  cron.schedule('0 1 * * 0', async () => {
    console.log('Running scheduled task: Clean up old processed batches');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Remove batch IDs from inspections older than 30 days that are already approved or rejected
      await Inspection.updateMany(
        { 
          batchId: { $exists: true, $ne: null },
          status: { $in: ['approved', 'rejected', 'auto-approved'] },
          updatedAt: { $lt: thirtyDaysAgo }
        },
        {
          $unset: { batchId: "" }
        }
      );
      
      console.log('Old batch cleanup completed');
    } catch (error) {
      console.error('Error in batch cleanup cron job:', error);
    }
  });
};
