import express from 'express';
import Inspection from '../models/Inspection.js';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import dayjs from 'dayjs';
import xlsx from 'xlsx';
import { 
  ReportValidationError, 
  ReportGenerationError, 
  ReportNotFoundError 
} from '../utils/errors.js';

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
router.post('/analytics', isAdmin, async (req, res, next) => {
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
router.post('/inspection-summary', isAdmin, async (req, res, next) => {
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
    }

    // Transform inspections for report
    const transformedInspections = inspections.map(inspection => ({
      ID: inspection._id,
      WorkflowName: inspection.workflowName,
      Category: inspection.category,
      InspectionType: inspection.inspectionType,
      Status: inspection.status,
      Inspector: inspection.assignedTo.name,
      Approver: inspection.approverId.name,
      InspectionDate: new Date(inspection.inspectionDate).toLocaleDateString(),
      CreatedAt: new Date(inspection.createdAt).toLocaleString()
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
            `Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
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
router.post('/inspector-performance', isAdmin, async (req, res, next) => {
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
            `Date Range: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
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

export default router;