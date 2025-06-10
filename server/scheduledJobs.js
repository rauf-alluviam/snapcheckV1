// Scheduled tasks for inspection processing
import cron from 'node-cron';
import Organization from './models/Organization.js';
import Inspection from './models/Inspection.js';

/**
 * Initialize all cron jobs
 */
export const initScheduledJobs = () => {
  // Clean up old inspections that are already processed (once a week)
  cron.schedule('0 1 * * 0', async () => {
    console.log('Running scheduled task: Clean up old processed inspections');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Clean up any remaining batch-related data from inspections older than 30 days
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
      
      console.log('Old inspection cleanup completed');
    } catch (error) {
      console.error('Error in inspection cleanup cron job:', error);
    }
  });
};
