import express from 'express';
import { auth } from '../middleware/auth.js';
import Inspection from '../models/Inspection.js';

const router = express.Router();

// @route   GET api/inspections/stats
// @desc    Get inspection statistics for admin
// @access  Private/Admin
router.get('/stats', auth, async (req, res) => {
  try {
    const { role, organizationId } = req.user;
    
    // Base query to filter by organization
    const baseQuery = { organizationId };

    // Get all inspections for the organization
    const inspections = await Inspection.find(baseQuery);

    // Calculate basic stats
    const stats = {
      totalInspections: inspections.length,
      pendingInspections: inspections.filter(i => i.status === 'pending').length,
      approvedInspections: inspections.filter(i => i.status === 'approved').length,
      rejectedInspections: inspections.filter(i => i.status === 'rejected').length,
      
      // Calculate inspections by type
      inspectionsByType: inspections.reduce((acc, curr) => {
        acc[curr.inspectionType] = (acc[curr.inspectionType] || 0) + 1;
        return acc;
      }, {}),
      
      // Calculate monthly stats
      monthlyStats: {
        completed: new Array(6).fill(0),
        rejected: new Array(6).fill(0)
      },
      
      // Calculate status distribution
      statusDistribution: {
        pending: inspections.filter(i => i.status === 'pending').length,
        approved: inspections.filter(i => i.status === 'approved').length,
        rejected: inspections.filter(i => i.status === 'rejected').length
      }
    };

    // Calculate monthly stats for the last 6 months
    const now = new Date();
    inspections.forEach(inspection => {
      const inspDate = new Date(inspection.createdAt);
      const monthDiff = (now.getMonth() - inspDate.getMonth() + 12) % 12;
      
      if (monthDiff < 6) {
        if (inspection.status === 'approved') {
          stats.monthlyStats.completed[5 - monthDiff]++;
        } else if (inspection.status === 'rejected') {
          stats.monthlyStats.rejected[5 - monthDiff]++;
        }
      }
    });

    res.json(stats);
  } catch (err) {
    console.error('Error in stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/inspections/stats/user/:userId
// @desc    Get inspection statistics for specific user
// @access  Private
router.get('/stats/user/:userId', auth, async (req, res) => {
  try {
    const { role, organizationId } = req.user;
    const userId = req.params.userId;

    // Base query for user's inspections
    const baseQuery = { 
      organizationId,
      $or: [
        { inspectorId: userId },
        { approverId: userId }
      ]
    };

    const inspections = await Inspection.find(baseQuery);

    const stats = {
      totalInspections: inspections.length,
      pendingInspections: inspections.filter(i => i.status === 'pending').length,
      approvedInspections: inspections.filter(i => i.status === 'approved').length,
      rejectedInspections: inspections.filter(i => i.status === 'rejected').length,
      
      inspectionsByType: inspections.reduce((acc, curr) => {
        acc[curr.inspectionType] = (acc[curr.inspectionType] || 0) + 1;
        return acc;
      }, {}),
      
      monthlyStats: {
        completed: new Array(6).fill(0),
        rejected: new Array(6).fill(0)
      },
      
      statusDistribution: {
        pending: inspections.filter(i => i.status === 'pending').length,
        approved: inspections.filter(i => i.status === 'approved').length,
        rejected: inspections.filter(i => i.status === 'rejected').length
      }
    };

    // Calculate monthly stats for the last 6 months
    const now = new Date();
    inspections.forEach(inspection => {
      const inspDate = new Date(inspection.createdAt);
      const monthDiff = (now.getMonth() - inspDate.getMonth() + 12) % 12;
      
      if (monthDiff < 6) {
        if (inspection.status === 'approved') {
          stats.monthlyStats.completed[5 - monthDiff]++;
        } else if (inspection.status === 'rejected') {
          stats.monthlyStats.rejected[5 - monthDiff]++;
        }
      }
    });

    res.json(stats);
  } catch (err) {
    console.error('Error in user stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
