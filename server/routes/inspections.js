import express from 'express';
import mongoose from 'mongoose';
import Inspection from '../models/Inspection.js';
import Workflow from '../models/Workflow.js';
import User from '../models/User.js';
import { auth, isAdminOrApprover } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { processAutoApprovals } from '../utils/autoApproval.js';
import { sendNotification } from '../utils/notifications.js';
import { formatDateForCSV, formatDateTimeForCSV, formatDateForPDF, formatDateTimeForPDF } from '../utils/dateUtils.js';
import { 
  validateInspection,
  validateQuery,
  validateObjectId,
  validateDateRange
} from '../validation/middleware.js';

const router = express.Router();

// @route   GET api/inspections
// @desc    Get all inspections for the user's organization with filtering
// @access  Private
router.get('/', auth, validateQuery.inspectionFilters, validateDateRange, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      inspectionType,
      status,
      assignedTo,
      approverId
    } = req.query;
    
    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add other filters if provided
    if (category) filter.category = category;
    if (inspectionType) filter.inspectionType = inspectionType;
    if (status) filter.status = status;
    
    // Handle role-based access
    if (req.user.role === 'inspector') {
      // Inspectors can only see inspections assigned to them
      filter.assignedTo = req.user.id;
    } else if (req.user.role === 'approver') {
      // Approvers can only see inspections they are assigned to approve
      filter.approverId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admins can filter by assignedTo or approverId if provided
      if (assignedTo) filter.assignedTo = assignedTo;
      if (approverId) filter.approverId = approverId;
    }
    
    // Get inspections based on filters
    const inspections = await Inspection.find(filter)
      .sort({ inspectionDate: -1 })
      .populate('assignedTo', 'name')
      .populate('approverId', 'name');
      // Transform inspections to include assignedToName and approverName
    const transformedInspections = inspections.map(inspection => {
      const { assignedTo, approverId, ...rest } = inspection.toObject();
      return {
        ...rest,
        assignedTo: assignedTo?._id || null,
        assignedToName: assignedTo?.name || 'Unknown User',
        approverId: approverId?._id || null,
        approverName: approverId?.name || 'Unknown User'
      };
    });
    
    res.json(transformedInspections);
  } catch (err) {
    console.error('Error fetching inspections:', err.message);
    res.status(500).json({ message: 'Server error' });  }
});

// @route   GET api/inspections/categories
// @desc    Get all unique inspection categories in the organization
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const uniqueCategories = await Inspection.distinct('category', { 
      organizationId: req.user.organizationId 
    });
    res.json(uniqueCategories);
  } catch (err) {
    console.error('Error fetching inspection categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/inspections/:id
// @desc    Get inspection by ID
// @access  Private
router.get('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('assignedTo', 'name')
      .populate('approverId', 'name')
      .populate('approvers.userId', 'name'); // Populate approvers with user info
    
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    // Check if user has access to this inspection
    if (inspection.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
      // Check role-based access
    if (req.user.role === 'inspector' && inspection.assignedTo?._id?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view inspections assigned to you.' });
    } else if (req.user.role === 'approver' && inspection.approverId?._id?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view inspections you are assigned to approve.' });
    }
      // Transform inspection to include assignedToName and approverName
    const { assignedTo, approverId, approvers = [], ...rest } = inspection.toObject();
      // Transform approvers to include userName
    const transformedApprovers = approvers.map(approver => {
      const { userId, ...approverRest } = approver;
      return {
        ...approverRest,
        userId: userId?._id || userId, // Handle both populated and unpopulated
        userName: userId?.name || 'Unknown User'
      };
    });
    
    const transformedInspection = {
      ...rest,
      assignedTo: assignedTo?._id || null,
      assignedToName: assignedTo?.name || 'Unknown User',
      approverId: approverId?._id || null,
      approverName: approverId?.name || 'Unknown User',
      approvers: transformedApprovers
    };
    
    res.json(transformedInspection);
  } catch (err) {
    console.error('Error fetching inspection:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/inspections
// @desc    Create a new inspection
// @access  Private
router.post('/', auth, validateInspection.create, async (req, res) => {
  try {
    const { 
      workflowId, 
      filledSteps,
      approverId,
      approverIds = [], // New field for multiple approvers
      inspectionDate
    } = req.body;
    
    // Input is already validated by middleware
    
    // Get workflow details
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if the workflow belongs to the user's organization
    if (workflow.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
      // Validate that the primary approver exists and is from the same organization
    const approver = await User.findById(approverId);
    
    if (!approver || approver.organizationId.toString() !== req.user.organizationId) {
      return res.status(400).json({ message: 'Invalid primary approver' });
    }
    
    // Create list of unique approver IDs
    const uniqueApproverIds = Array.from(new Set([approverId, ...approverIds]));
    
    // Validate all approvers
    const approvers = await User.find({ 
      _id: { $in: uniqueApproverIds },
      organizationId: req.user.organizationId
    });
    
    // Check if all approvers were found
    if (approvers.length !== uniqueApproverIds.length) {
      return res.status(400).json({ message: 'One or more invalid approvers' });
    }
      // Create approvers array for the inspection
    const approversData = approvers.map(approver => ({
      userId: approver._id,
      status: 'pending'
    }));
    
    // If the user creating the inspection is an approver, add an admin as approver
    if (req.user.role === 'approver') {
      // Find an admin user from the same organization
      const adminUsers = await User.find({
        organizationId: req.user.organizationId,
        role: 'admin'
      }).limit(1);
      
      if (adminUsers.length > 0) {
        const adminUser = adminUsers[0];
        
        // Check if admin is already in approvers list
        if (!uniqueApproverIds.includes(adminUser._id.toString())) {
          // Add admin to approvers if not already included
          approversData.push({
            userId: adminUser._id,
            status: 'pending'
          });
        }
      }
    }
      // Extract meter reading if available (for bike speedometer, machine readings, etc.)
    let meterReading = null;
    if (req.body.meterReading !== undefined) {
      meterReading = parseFloat(req.body.meterReading);
    } else {
      // Try to extract from first filled step if it's numeric
      try {
        const firstStepResponse = filledSteps[0]?.responseText;
        if (firstStepResponse) {
          const parsed = parseFloat(firstStepResponse);
          if (!isNaN(parsed)) {
            meterReading = parsed;
          }
        }
      } catch (e) {
        // Not a valid number, that's okay
      }
    }

    // Create new inspection
    const inspection = new Inspection({
      workflowId,
      workflowName: workflow.name,
      category: workflow.category,
      inspectionType: workflow.name,
      filledSteps,
      assignedTo: req.user.id,
      approverId, // Keep for backward compatibility
      approvers: approversData, // Add the array of approvers (now possibly including admin)
      status: 'pending',
      organizationId: req.user.organizationId,
      inspectionDate: new Date(inspectionDate),
      meterReading: meterReading,
      readingDate: new Date()
    });
    
    // Save inspection
    await inspection.save();
      // Check for auto-approval if this is a routine inspection
    // Auto-approve if workflow settings allow it AND either the autoApprove flag is set or the workflow has autoApprovalEnabled
    if (workflow.isRoutineInspection && (req.body.autoApprove === true || workflow.autoApprovalEnabled)) {
      const wasAutoApproved = await processAutoApprovals(inspection, workflow);
      
      if (wasAutoApproved) {
        return res.json({ 
          ...inspection.toObject(), 
          autoApproved: true,
          message: 'Inspection was automatically approved based on predefined rules'
        });
      }
        // For routine inspections that aren't auto-approved, they remain in normal pending status
    }
    
    res.json(inspection);
  } catch (err) {
    console.error('Error creating inspection:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/inspections/:id/approve
// @desc    Approve an inspection
// @access  Private/AdminOrApprover
router.put('/:id/approve', isAdminOrApprover, validateObjectId(), validateInspection.approve, async (req, res) => {
  try {
    const { remarks } = req.body;
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    // Check if user has access to this inspection
    if (inspection.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if the user can approve this inspection
    let canApprove = false;
    
    // Admin can always approve
    if (req.user.role === 'admin') {
      canApprove = true;
    } else if (req.user.role === 'approver') {
      // Check if this user is in the list of approvers
      const isInApproversList = inspection.approvers.some(
        approver => approver.userId.toString() === req.user.id
      );
      
      // Also check the legacy approverId field for backward compatibility
      const isPrimaryApprover = inspection.approverId.toString() === req.user.id;
      
      canApprove = isInApproversList || isPrimaryApprover;
    }
    
    if (!canApprove) {
      return res.status(403).json({ 
        message: 'Access denied. You can only approve inspections assigned to you.' 
      });
    }
    
    // Mark the current user's approval in the approvers array
    const approverIndex = inspection.approvers.findIndex(
      approver => approver.userId.toString() === req.user.id
    );
    
    if (approverIndex !== -1) {
      inspection.approvers[approverIndex].status = 'approved';
      inspection.approvers[approverIndex].remarks = remarks || '';
      inspection.approvers[approverIndex].actionDate = new Date();
    } else {
      // Add this approver if not already in the list (for backward compatibility)
      inspection.approvers.push({
        userId: req.user.id,
        status: 'approved',
        remarks: remarks || '',
        actionDate: new Date()
      });
    }
    
    // Check if all approvers have approved
    const allApproved = inspection.approvers.every(
      approver => approver.status === 'approved'
    );
    
    // If admin approves or all designated approvers have approved, mark the inspection as approved
    if (req.user.role === 'admin' || allApproved) {
      inspection.status = 'approved';
      inspection.remarks = remarks || '';
      inspection.approvedAt = new Date();
      inspection.approvedBy = req.user.id;
    }
    
    await inspection.save();
    
    res.json(inspection);
  } catch (err) {
    console.error('Error in inspection approval:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/inspections/:id/reject
// @desc    Reject an inspection
// @access  Private/AdminOrApprover
router.put('/:id/reject', isAdminOrApprover, validateObjectId(), validateInspection.reject, async (req, res) => {
  try {
    const { remarks } = req.body;
    
    // Input is already validated by middleware
    
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    // Check if user has access to this inspection
    if (inspection.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if the user can reject this inspection
    let canReject = false;
    
    // Admin can always reject
    if (req.user.role === 'admin') {
      canReject = true;
    } else if (req.user.role === 'approver') {
      // Check if this user is in the list of approvers
      const isInApproversList = inspection.approvers.some(
        approver => approver.userId.toString() === req.user.id
      );
      
      // Also check the legacy approverId field for backward compatibility
      const isPrimaryApprover = inspection.approverId.toString() === req.user.id;
      
      canReject = isInApproversList || isPrimaryApprover;
    }
    
    if (!canReject) {
      return res.status(403).json({ 
        message: 'Access denied. You can only reject inspections assigned to you.' 
      });
    }
    
    // Mark the current user's rejection in the approvers array
    const approverIndex = inspection.approvers.findIndex(
      approver => approver.userId.toString() === req.user.id
    );
    
    if (approverIndex !== -1) {
      inspection.approvers[approverIndex].status = 'rejected';
      inspection.approvers[approverIndex].remarks = remarks;
      inspection.approvers[approverIndex].actionDate = new Date();
    } else {
      // Add this approver if not already in the list (for backward compatibility)
      inspection.approvers.push({
        userId: req.user.id,
        status: 'rejected',
        remarks: remarks,
        actionDate: new Date()
      });
    }
    
    // If admin rejects or any of the designated approvers rejects, mark the inspection as rejected
    inspection.status = 'rejected';
    inspection.remarks = remarks;
    inspection.rejectedAt = new Date();
    inspection.rejectedBy = req.user.id;
    
    await inspection.save();
    
    res.json(inspection);
  } catch (err) {
    console.error('Error in inspection rejection:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/inspections/:id/report
// @desc    Generate inspection report in PDF format
// @access  Private
router.get('/:id/report', auth, async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('assignedTo', 'name')
      .populate('approverId', 'name');
    
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    // Check if user has access to this inspection
    if (inspection.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inspection-${inspection._id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Document title
    doc.fontSize(20).text('Inspection Report', { align: 'center' });
    doc.moveDown();
    
    // Inspection details
    doc.fontSize(14).text('Inspection Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`ID: ${inspection._id}`);
    doc.fontSize(12).text(`Type: ${inspection.inspectionType}`);
    doc.fontSize(12).text(`Category: ${inspection.category}`);
    doc.fontSize(12).text(`Status: ${inspection.status.toUpperCase()}`);
    doc.fontSize(12).text(`Date: ${formatDateForPDF(inspection.inspectionDate)}`);
    doc.moveDown();      // Participants
    doc.fontSize(14).text('Participants', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Inspector: ${inspection.assignedTo?.name || 'Unknown User'}`);
    doc.fontSize(12).text(`Primary Approver: ${inspection.approverId?.name || 'Unknown User'}`);
    
    // List all approvers with their status
    if (inspection.approvers && inspection.approvers.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12).text('All Approvers:');
      inspection.approvers.forEach(approver => {
        const userName = approver.userId?.name || 'Unknown User';
        const status = approver.status.toUpperCase();
        doc.fontSize(10).text(`- ${userName}: ${status}`);
        if (approver.remarks) {
          doc.fontSize(9).text(`  Remarks: ${approver.remarks}`, { indent: 10 });
        }        if (approver.actionDate) {
          doc.fontSize(9).text(`  Date: ${formatDateTimeForPDF(approver.actionDate)}`, { indent: 10 });
        }
      });
    }
    
    doc.moveDown();
    
    // Inspection steps
    doc.fontSize(14).text('Inspection Steps', { underline: true });
    doc.moveDown(0.5);
    
    inspection.filledSteps.forEach((step, index) => {
      doc.fontSize(12).text(`${index + 1}. ${step.stepTitle}`, { underline: true });
      doc.fontSize(10).text(`Response: ${step.responseText}`);
      
      if (step.mediaUrls && step.mediaUrls.length > 0) {
        doc.fontSize(10).text('Media Attachments:');
        step.mediaUrls.forEach(url => {
          doc.fontSize(8).text(`- ${url}`);
        });
      }
      
      doc.fontSize(8).text(`Completed on: ${formatDateTimeForPDF(step.timestamp)}`);
      doc.moveDown();
    });
    
    // If inspection was rejected, add rejection reason
    if (inspection.status === 'rejected' && inspection.rejectionReason) {
      doc.fontSize(14).text('Rejection Reason', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(inspection.rejectionReason);
      doc.moveDown();
    }
    
    // End PDF document
    doc.end();
  } catch (err) {
    console.error('Error generating inspection report:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/inspections/export/csv
// @desc    Export inspections as CSV
// @access  Private
router.get('/export/csv', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      category,
      inspectionType,
      status,
      assignedTo,
      approverId
    } = req.query;
    
    // Build filter object
    const filter = { organizationId: req.user.organizationId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      filter.inspectionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add other filters if provided
    if (category) filter.category = category;
    if (inspectionType) filter.inspectionType = inspectionType;
    if (status) filter.status = status;
    
    // Handle role-based access
    if (req.user.role === 'inspector') {
      // Inspectors can only export inspections assigned to them
      filter.assignedTo = req.user.id;
    } else if (req.user.role === 'approver') {
      // Approvers can only export inspections they are assigned to approve
      filter.approverId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admins can filter by assignedTo or approverId if provided
      if (assignedTo) filter.assignedTo = assignedTo;
      if (approverId) filter.approverId = approverId;
    }
    
    // Get inspections based on filters
    const inspections = await Inspection.find(filter)
      .sort({ inspectionDate: -1 })
      .populate('assignedTo', 'name')
      .populate('approverId', 'name');      // Transform inspections for CSV export
    const transformedInspections = inspections.map(inspection => {
      return {
        ID: inspection._id,
        WorkflowName: inspection.workflowName,
        Category: inspection.category,
        InspectionType: inspection.inspectionType,
        Status: inspection.status,
        Inspector: inspection.assignedTo?.name || 'Unknown User',
        Approver: inspection.approverId?.name || 'Unknown User',
        InspectionDate: formatDateForCSV(inspection.inspectionDate),
        CreatedAt: formatDateTimeForCSV(inspection.createdAt)
      };
    });
    
    // Generate CSV
    const fields = ['ID', 'WorkflowName', 'Category', 'InspectionType', 'Status', 'Inspector', 'Approver', 'InspectionDate', 'CreatedAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transformedInspections);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inspections.csv');
      // Send CSV response    res.send(csv);
  } catch (err) {
    console.error('Error exporting inspections as CSV:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/inspections/:id
// @desc    Delete an inspection (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    // Only admins can delete inspections
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only admins can delete inspections.' });
    }

    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    // Check if inspection belongs to user's organization
    if (inspection.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete the inspection
    await Inspection.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Inspection deleted successfully',
      deletedInspectionId: req.params.id 
    });
    
  } catch (err) {
    console.error('Error deleting inspection:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;