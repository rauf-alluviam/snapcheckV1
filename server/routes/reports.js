import express from 'express';
import Inspection from '../models/Inspection.js';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import dayjs from 'dayjs';
import xlsx from 'xlsx';
import { formatDateForCSV, formatDateTimeForCSV, formatDateForPDF, formatDateTimeForPDF } from '../utils/dateUtils.js';
import { 
  ReportValidationError, 
  ReportGenerationError, 
  ReportNotFoundError 
} from '../utils/errors.js';
import { 
  validateReport,
  validateDateRange 
} from '../validation/middleware.js';

const router = express.Router();

// Helper function to get date range
const getDateRange = (range) => {
  const end = dayjs();
  let start;
  
  switch (range) {
    case 'day':
      start = end.subtract(1, 'day');
      break;
    case 'week':
      start = end.subtract(1, 'week');
      break;
    case 'month':
      start = end.subtract(1, 'month');
      break;
    case 'quarter':
      start = end.subtract(3, 'month');
      break;
    case 'year':
      start = end.subtract(1, 'year');
      break;
    default:
      start = end.subtract(1, 'month'); // Default to month
  }
  
  return { start: start.toDate(), end: end.toDate() };
};

// Helper function to validate report parameters
const validateReportParams = (params) => {
  const { startDate, endDate, format } = params;
  const errors = [];

  if (startDate && !dayjs(startDate).isValid()) {
    errors.push('Invalid start date format');
  }
  if (endDate && !dayjs(endDate).isValid()) {
    errors.push('Invalid end date format');
  }
  if (format && !['pdf', 'csv', 'excel'].includes(format)) {
    errors.push('Invalid format. Must be one of: pdf, csv, excel');
  }
  if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
    errors.push('Start date cannot be after end date');
  }

  if (errors.length > 0) {
    throw new ReportValidationError('Invalid report parameters', errors);
  }
};

// Helper function to handle report generation errors
const handleReportError = (err, reportType) => {
  console.error(`Error generating ${reportType} report:`, err);
  
  if (err.name === 'ValidationError') {
    throw new ReportValidationError(err.message, err.errors);
  }
  
  throw new ReportGenerationError(
    `Failed to generate ${reportType} report`, 
    err.message
  );
};

// @route   POST api/reports/analytics
// @desc    Get analytics data
// @access  Private (Admin only)
router.post('/analytics', isAdmin, validateReport.analytics, validateDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, category, inspector } = req.body;
    
    // Validate parameters
    validateReportParams({ startDate, endDate });

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    
    // Add date range filter
    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add category filter if provided
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Add inspector filter if provided
    if (inspector && inspector !== 'all') {
      filter.assignedTo = inspector;
    }

    // Get inspections
    const inspections = await Inspection.find(filter)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    if (!inspections || inspections.length === 0) {
      return res.json({
        inspectionsOverTime: [],
        categoryDistribution: {},
        statusDistribution: { pending: 0, approved: 0, rejected: 0 },
        inspectorPerformance: [],
        completionTimes: {}
      });
    }    // Calculate monthly stats for inspections over time
    const monthlyStats = new Array(6).fill(0).map((_, index) => {
      const monthStart = dayjs().subtract(5 - index, 'months').startOf('month');
      const monthEnd = dayjs().subtract(5 - index, 'months').endOf('month');
      
      const monthlyInspections = inspections.filter(i => {
        const createdAt = dayjs(i.createdAt);
        return createdAt.isAfter(monthStart) && createdAt.isBefore(monthEnd) || 
               createdAt.isSame(monthStart, 'day') || 
               createdAt.isSame(monthEnd, 'day');
      });

      return {
        month: monthStart.format('MMM'),
        completed: monthlyInspections.filter(i => i.status === 'approved').length,
        rejected: monthlyInspections.filter(i => i.status === 'rejected').length,
        pending: monthlyInspections.filter(i => i.status === 'pending').length
      };
    });

    // Calculate category distribution
    const categoryDistribution = inspections.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    // Calculate status distribution
    const statusDistribution = {
      pending: inspections.filter(i => i.status === 'pending').length,
      approved: inspections.filter(i => i.status === 'approved').length,
      rejected: inspections.filter(i => i.status === 'rejected').length
    };

    // Calculate inspector performance
    const inspectorPerformance = Array.from(
      inspections.reduce((map, inspection) => {
        const inspector = inspection.assignedTo;
        if (!map.has(inspector.id)) {
          map.set(inspector.id, {
            name: inspector.name,
            completed: 0,
            approvalRate: 0,
            total: 0
          });
        }
        const stats = map.get(inspector.id);
        stats.total++;
        if (inspection.status === 'approved') {
          stats.completed++;
        }
        stats.approvalRate = (stats.completed / stats.total) * 100;
        return map;
      }, new Map())
    ).map(([_, stats]) => stats);

    // Calculate average completion time by category
    const completionTimes = Object.entries(categoryDistribution).reduce((acc, [category]) => {
      const categoryInspections = inspections.filter(i => 
        i.category === category && i.completedAt && i.createdAt
      );
      
      if (categoryInspections.length > 0) {
        const totalTime = categoryInspections.reduce((sum, i) => 
          sum + dayjs(i.completedAt).diff(dayjs(i.createdAt), 'minute'), 0
        );
        acc[category] = Math.round(totalTime / categoryInspections.length);
      } else {
        acc[category] = 0;
      }
      return acc;
    }, {});

    res.json({
      inspectionsOverTime: monthlyStats,
      categoryDistribution,
      statusDistribution,
      inspectorPerformance,
      completionTimes
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST api/reports/inspection-summary
// @desc    Generate inspection summary report
// @access  Private (Admin only)
router.post('/inspection-summary', isAdmin, validateReport.inspectionSummary, validateDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, category, status, format = 'pdf' } = req.body;
    
    // Validate parameters
    validateReportParams({ startDate, endDate, format });

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    
    // Add date range filter
    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add other filters
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;

    // Get inspections
    const inspections = await Inspection.find(filter)
      .sort({ inspectionDate: -1 })
      .populate('assignedTo', 'name')
      .populate('approverId', 'name');

    if (!inspections || inspections.length === 0) {
      throw new ReportNotFoundError('No inspection data found for the specified criteria');
    }    // Transform inspections for report
    const transformedInspections = inspections.map(inspection => ({
      ID: inspection._id,
      WorkflowName: inspection.workflowName,
      Category: inspection.category,
      InspectionType: inspection.inspectionType,
      Status: inspection.status,
      Inspector: inspection.assignedTo.name,
      Approver: inspection.approverId.name,
      InspectionDate: formatDateForCSV(inspection.inspectionDate),
      CreatedAt: formatDateTimeForCSV(inspection.createdAt)
    }));

    // Generate report based on format
    switch (format.toLowerCase()) {
      case 'csv':
        const fields = ['ID', 'WorkflowName', 'Category', 'InspectionType', 'Status', 'Inspector', 'Approver', 'InspectionDate', 'CreatedAt'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(transformedInspections);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inspection-summary.csv');
        return res.send(csv);

      case 'excel':
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(transformedInspections);
        xlsx.utils.book_append_sheet(wb, ws, 'Inspection Summary');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inspection-summary.xlsx');
        return res.send(xlsx.write(wb, { type: 'buffer' }));

      case 'pdf':
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=inspection-summary.pdf');
        
        doc.pipe(res);
          // Document title
        doc.fontSize(20).text('Inspection Summary Report', { align: 'center' });
        doc.moveDown();
        
        // Date range
        if (startDate && endDate) {
          doc.fontSize(12).text(
            `Date Range: ${formatDateForPDF(startDate)} to ${formatDateForPDF(endDate)}`,
            { align: 'center' }
          );
          doc.moveDown();
        }

        // Add inspection details
        transformedInspections.forEach((inspection, index) => {
          doc.fontSize(12).text(`${index + 1}. ${inspection.WorkflowName}`, { underline: true });
          doc.fontSize(10).text(`ID: ${inspection.ID}`);
          doc.fontSize(10).text(`Category: ${inspection.Category}`);
          doc.fontSize(10).text(`Status: ${inspection.Status.toUpperCase()}`);
          doc.fontSize(10).text(`Inspector: ${inspection.Inspector}`);
          doc.fontSize(10).text(`Date: ${inspection.InspectionDate}`);
          doc.moveDown(0.5);
        });

        doc.end();
        break;

      default:
        throw new ReportValidationError('Invalid report format');
    }
  } catch (err) {
    next(err);
  }
});

// @route   POST api/reports/inspector-performance
// @desc    Generate inspector performance report
// @access  Private (Admin only)
router.post('/inspector-performance', isAdmin, validateReport.inspectorPerformance, validateDateRange, async (req, res, next) => {
  try {
    const { startDate, endDate, inspector, format = 'pdf' } = req.body;
    
    // Validate parameters
    validateReportParams({ startDate, endDate, format });

    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    
    // Add date range filter
    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add inspector filter if provided
    if (inspector && inspector !== 'all') {
      filter.assignedTo = inspector;
    }
    
    // Get inspections
    const inspections = await Inspection.find(filter)
      .populate('assignedTo', 'name');

    if (!inspections || inspections.length === 0) {
      throw new ReportNotFoundError('No inspection data found for the specified criteria');
    }

    // Group inspections by inspector
    const inspectorMap = new Map();
    
    inspections.forEach(inspection => {
      const inspectorId = inspection.assignedTo._id.toString();
      const inspectorName = inspection.assignedTo.name;
      
      if (!inspectorMap.has(inspectorId)) {
        inspectorMap.set(inspectorId, {
          name: inspectorName,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        });
      }
      
      const stats = inspectorMap.get(inspectorId);
      stats.total += 1;
      
      switch (inspection.status) {
        case 'approved':
          stats.approved += 1;
          break;
        case 'rejected':
          stats.rejected += 1;
          break;
        default:
          stats.pending += 1;
      }
    });
    
    // Transform for report
    const performanceData = Array.from(inspectorMap.entries()).map(([id, stats]) => ({
      InspectorID: id,
      InspectorName: stats.name,
      TotalInspections: stats.total,
      Approved: stats.approved,
      Rejected: stats.rejected,
      Pending: stats.pending,
      ApprovalRate: stats.total > 0 
        ? ((stats.approved / (stats.approved + stats.rejected)) * 100).toFixed(2) + '%' 
        : 'N/A'
    }));

    // Generate report based on format
    switch (format.toLowerCase()) {
      case 'csv':
        const fields = ['InspectorName', 'TotalInspections', 'Approved', 'Rejected', 'Pending', 'ApprovalRate'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(performanceData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inspector-performance.csv');
        return res.send(csv);

      case 'excel':
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(performanceData);
        xlsx.utils.book_append_sheet(wb, ws, 'Inspector Performance');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inspector-performance.xlsx');
        return res.send(xlsx.write(wb, { type: 'buffer' }));

      case 'pdf':
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=inspector-performance.pdf');
        
        doc.pipe(res);
          // Document title
        doc.fontSize(20).text('Inspector Performance Report', { align: 'center' });
        doc.moveDown();
        
        // Date range
        if (startDate && endDate) {
          doc.fontSize(12).text(
            `Date Range: ${formatDateForPDF(startDate)} to ${formatDateForPDF(endDate)}`,
            { align: 'center' }
          );
          doc.moveDown();
        }

        // Add performance data
        performanceData.forEach(data => {
          doc.fontSize(12).text(data.InspectorName, { underline: true });
          doc.fontSize(10).text(`Total Inspections: ${data.TotalInspections}`);
          doc.fontSize(10).text(`Approved: ${data.Approved}`);
          doc.fontSize(10).text(`Rejected: ${data.Rejected}`);
          doc.fontSize(10).text(`Pending: ${data.Pending}`);
          doc.fontSize(10).text(`Approval Rate: ${data.ApprovalRate}`);
          doc.moveDown();
        });

        doc.end();
        break;

      default:
        throw new ReportValidationError('Invalid report format');
    }
  } catch (err) {
    next(err);
  }
});

// @route   GET api/reports/user-wise
// @desc    Get user-wise inspection data for admin and approvers
// @access  Private/Admin or Approver
router.get('/user-wise', auth, async (req, res) => {
  try {
    // Check user permissions
    if (req.user.role !== 'admin' && req.user.role !== 'approver') {
      return res.status(403).json({ 
        message: 'Access denied. Admin or approver role required.',
        role: req.user.role
      });
    }

    const { organizationId } = req.user;
    const { startDate, endDate, userRole, exportFormat } = req.query;

    // Set default date range (last 30 days)
    const defaultEndDate = dayjs();
    const defaultStartDate = defaultEndDate.subtract(30, 'day');

    const start = startDate ? dayjs(startDate) : defaultStartDate;
    const end = endDate ? dayjs(endDate) : defaultEndDate;

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Build user filter query
    let userQuery = { organizationId };
    if (userRole && userRole !== 'all') {
      userQuery.role = userRole;
    }

    // Get all users in the organization
    const users = await User.find(userQuery).select('_id name email role');    // Build inspection aggregation pipeline
    const matchStage = {
      organizationId,
      inspectionDate: {
        $gte: start.toDate(),
        $lte: end.toDate()
      }
    };

    // Aggregate inspection data by user
    const userWiseData = await Promise.all(
      users.map(async (user) => {
        // Get inspections assigned to user (as inspector)
        const assignedInspections = await Inspection.find({
          ...matchStage,
          assignedTo: user._id
        });

        // Get inspections approved/rejected by user (as approver)
        const processedInspections = await Inspection.find({
          ...matchStage,
          $or: [
            { approvedBy: user._id },
            { rejectedBy: user._id },
            { 'approvers.userId': user._id }
          ]
        });

        // Calculate statistics
        const assignedStats = {
          total: assignedInspections.length,
          pending: assignedInspections.filter(i => i.status === 'pending').length,
          approved: assignedInspections.filter(i => i.status === 'approved').length,
          rejected: assignedInspections.filter(i => i.status === 'rejected').length,
          autoApproved: assignedInspections.filter(i => i.status === 'auto-approved').length
        };

        const processedStats = {
          total: processedInspections.length,
          approved: processedInspections.filter(i => 
            i.approvedBy?.toString() === user._id.toString() || 
            i.approvers.some(a => a.userId.toString() === user._id.toString() && a.status === 'approved')
          ).length,
          rejected: processedInspections.filter(i => 
            i.rejectedBy?.toString() === user._id.toString() || 
            i.approvers.some(a => a.userId.toString() === user._id.toString() && a.status === 'rejected')
          ).length
        };

        // Calculate average response time for assigned inspections
        const completedAssigned = assignedInspections.filter(i => 
          i.status === 'approved' || i.status === 'rejected'
        );
        
        let avgResponseTime = 0;
        if (completedAssigned.length > 0) {
          const totalTime = completedAssigned.reduce((sum, inspection) => {
            const completedAt = inspection.approvedAt || inspection.rejectedAt;
            if (completedAt) {
              return sum + (new Date(completedAt) - new Date(inspection.createdAt));
            }
            return sum;
          }, 0);
          avgResponseTime = totalTime / completedAssigned.length / (1000 * 60 * 60); // Convert to hours
        }

        // Get category breakdown for assigned inspections
        const categoryBreakdown = assignedInspections.reduce((acc, inspection) => {
          acc[inspection.category] = (acc[inspection.category] || 0) + 1;
          return acc;
        }, {});

        return {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          assigned: assignedStats,
          processed: processedStats,
          avgResponseTimeHours: Math.round(avgResponseTime * 100) / 100,
          categoryBreakdown,
          performance: {
            completionRate: assignedStats.total > 0 ? 
              Math.round(((assignedStats.approved + assignedStats.rejected + assignedStats.autoApproved) / assignedStats.total) * 100) : 0,
            approvalRate: processedStats.total > 0 ? 
              Math.round((processedStats.approved / processedStats.total) * 100) : 0
          }
        };
      })
    );

    // Sort by total assigned inspections (most active first)
    userWiseData.sort((a, b) => b.assigned.total - a.assigned.total);

    // If export format is requested, handle export
    if (exportFormat) {
      const exportData = userWiseData.map(userData => ({
        'User Name': userData.user.name,
        'Email': userData.user.email,
        'Role': userData.user.role,
        'Total Assigned': userData.assigned.total,
        'Assigned Pending': userData.assigned.pending,
        'Assigned Approved': userData.assigned.approved,
        'Assigned Rejected': userData.assigned.rejected,
        'Auto Approved': userData.assigned.autoApproved,
        'Total Processed': userData.processed.total,
        'Processed Approved': userData.processed.approved,
        'Processed Rejected': userData.processed.rejected,
        'Completion Rate (%)': userData.performance.completionRate,
        'Approval Rate (%)': userData.performance.approvalRate,
        'Avg Response Time (hours)': userData.avgResponseTimeHours
      }));

      if (exportFormat === 'csv') {
        const parser = new Parser();
        const csv = parser.parse(exportData);
        res.header('Content-Type', 'text/csv');
        res.attachment(`user-wise-report-${start.format('YYYY-MM-DD')}-to-${end.format('YYYY-MM-DD')}.csv`);
        return res.send(csv);
      } else if (exportFormat === 'excel') {
        const ws = xlsx.utils.json_to_sheet(exportData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'User-wise Report');
        
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(`user-wise-report-${start.format('YYYY-MM-DD')}-to-${end.format('YYYY-MM-DD')}.xlsx`);
        return res.send(buffer);
      }
    }

    // Return JSON data
    res.json({
      success: true,
      data: userWiseData,
      dateRange: {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      },
      summary: {
        totalUsers: userWiseData.length,
        totalInspections: userWiseData.reduce((sum, u) => sum + u.assigned.total, 0),
        totalProcessed: userWiseData.reduce((sum, u) => sum + u.processed.total, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching user-wise data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user-wise data',
      error: error.message 
    });
  }
});

export default router;