import express from 'express';
import { auth } from '../middleware/auth.js';
import Inspection from '../models/Inspection.js';
import moment from 'moment';

const router = express.Router();

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { organizationId, role, _id: userId } = req.user;
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month');
    
    // Base query for organization
    let baseQuery = { organizationId };
    
    // Modify query based on user role
    if (role === 'approver') {
      baseQuery.approverId = userId;
    } else if (role === 'inspector') {
      baseQuery.assignedTo = userId;
    }

    // Get all relevant inspections
    const inspections = await Inspection.find(baseQuery);

    // Calculate summary statistics
    const summaryStats = {
      total: inspections.length,
      pending: inspections.filter(i => i.status === 'pending').length,
      approved: inspections.filter(i => i.status === 'approved').length,
      rejected: inspections.filter(i => i.status === 'rejected').length
    };

    // Calculate inspections by type
    const typeStats = inspections.reduce((acc, curr) => {
      acc[curr.inspectionType] = (acc[curr.inspectionType] || 0) + 1;
      return acc;
    }, {});

    // Calculate monthly completion trends
    const monthlyData = new Array(6).fill(0).map((_, index) => {
      const month = moment().subtract(5 - index, 'months').format('MMMM');
      const monthStart = moment().subtract(5 - index, 'months').startOf('month');
      const monthEnd = moment().subtract(5 - index, 'months').endOf('month');

      const monthlyInspections = inspections.filter(i => {
        const date = moment(i.createdAt);
        return date.isBetween(monthStart, monthEnd, 'day', '[]');
      });

      return {
        month,
        completed: monthlyInspections.filter(i => i.status === 'approved').length,
        rejected: monthlyInspections.filter(i => i.status === 'rejected').length
      };
    });

    // Calculate category distribution
    const categoryStats = inspections.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    // Calculate recent activity
    const recentActivity = await Inspection.find(baseQuery)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('workflowName status updatedAt assignedToName');

    res.json({
      summaryStats,
      typeStats,
      monthlyData,
      categoryStats,
      recentActivity
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
