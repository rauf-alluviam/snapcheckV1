import express from 'express';
import Inspection from '../models/Inspection.js';
import Workflow from '../models/Workflow.js';
import User from '../models/User.js';
import { auth, isAdminOrApprover } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

const router = express.Router();

// @route   GET api/inspections
// @desc    Get all inspections for the user's organization with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
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
        assignedTo: assignedTo._id,
        assignedToName: assignedTo.name,
        approverId: approverId._id,
        approverName: approverId.name
      };
    });
    
    res.json(transformedInspections);
  } catch (err) {
    console.error('Error fetching inspections:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/inspections/:id
// @desc    Get inspection by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
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
    
    // Check role-based access
    if (req.user.role === 'inspector' && inspection.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view inspections assigned to you.' });
    } else if (req.user.role === 'approver' && inspection.approverId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only view inspections you are assigned to approve.' });
    }
    
    // Transform inspection to include assignedToName and approverName
    const { assignedTo, approverId, ...rest } = inspection.toObject();
    const transformedInspection = {
      ...rest,
      assignedTo: assignedTo._id,
      assignedToName: assignedTo.name,
      approverId: approverId._id,
      approverName: approverId.name
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
router.post('/', auth, async (req, res) => {
  try {
    const { 
      workflowId, 
      filledSteps,
      approverId,
      inspectionDate
    } = req.body;
    
    // Validate input
    if (!workflowId || !approverId || !inspectionDate || !filledSteps || !Array.isArray(filledSteps)) {
      return res.status(400).json({ message: 'All fields are required and filledSteps must be an array' });
    }
    
    // Get workflow details
    const workflow = await Workflow.findById(workflowId);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if the workflow belongs to the user's organization
    if (workflow.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Validate that the approver exists and is from the same organization
    const approver = await User.findById(approverId);
    
    if (!approver || approver.organizationId.toString() !== req.user.organizationId) {
      return res.status(400).json({ message: 'Invalid approver' });
    }
    
    // Create new inspection
    const inspection = new Inspection({
      workflowId,
      workflowName: workflow.name,
      category: workflow.category,
      inspectionType: workflow.name,
      filledSteps,
      assignedTo: req.user.id,
      approverId,
      status: 'pending',
      organizationId: req.user.organizationId,
      inspectionDate: new Date(inspectionDate)
    });
    
    // Save inspection
    await inspection.save();
    
    res.json(inspection);
  } catch (err) {
    console.error('Error creating inspection:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/inspections/:id/approve
// @desc    Approve an inspection
// @access  Private/AdminOrApprover
router.put('/:id/approve', isAdminOrApprover, async (req, res) => {
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
    
    // Check if the user is the assigned approver or an admin
    if (req.user.role === 'approver' && inspection.approverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only approve inspections assigned to you.' });
    }
    
    // Approve inspection
    inspection.status = 'approved';
    inspection.remarks = remarks || '';
    inspection.approvedAt = new Date();
    inspection.approvedBy = req.user.id;
    
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
router.put('/:id/reject', isAdminOrApprover, async (req, res) => {
  try {
    const { remarks } = req.body;
    
    if (!remarks) {
      return res.status(400).json({ message: 'Rejection remarks are required' });
    }
    
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    
    // Check if user has access to this inspection
    if (inspection.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if the user is the assigned approver or an admin
    if (req.user.role === 'approver' && inspection.approverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only reject inspections assigned to you.' });
    }
    
    // Reject inspection
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
    doc.fontSize(12).text(`Date: ${new Date(inspection.inspectionDate).toLocaleDateString()}`);
    doc.moveDown();
    
    // Participants
    doc.fontSize(14).text('Participants', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Inspector: ${inspection.assignedTo.name}`);
    doc.fontSize(12).text(`Approver: ${inspection.approverId.name}`);
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
      
      doc.fontSize(8).text(`Completed on: ${new Date(step.timestamp).toLocaleString()}`);
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
      .populate('approverId', 'name');
    
    // Transform inspections for CSV export
    const transformedInspections = inspections.map(inspection => {
      return {
        ID: inspection._id,
        WorkflowName: inspection.workflowName,
        Category: inspection.category,
        InspectionType: inspection.inspectionType,
        Status: inspection.status,
        Inspector: inspection.assignedTo.name,
        Approver: inspection.approverId.name,
        InspectionDate: new Date(inspection.inspectionDate).toLocaleDateString(),
        CreatedAt: new Date(inspection.createdAt).toLocaleString()
      };
    });
    
    // Generate CSV
    const fields = ['ID', 'WorkflowName', 'Category', 'InspectionType', 'Status', 'Inspector', 'Approver', 'InspectionDate', 'CreatedAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transformedInspections);
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inspections.csv');
    
    // Send CSV response
    res.send(csv);
  } catch (err) {
    console.error('Error exporting inspections as CSV:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;