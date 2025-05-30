import express from 'express';
import Workflow from '../models/Workflow.js';
import { auth, isAdmin, sameOrganization, canEditWorkflow } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/workflows
// @desc    Get all workflows for the user's organization
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const workflows = await Workflow.find({ organizationId: req.user.organizationId });
    res.json(workflows);
  } catch (err) {
    console.error('Error fetching workflows:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/workflows/:id
// @desc    Get workflow by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has access to this workflow (same organization)
    if (workflow.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(workflow);
  } catch (err) {
    console.error('Error fetching workflow:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/workflows
// @desc    Create a new workflow
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, category, description, steps } = req.body;
    
    // Validate input
    if (!name || !category || !description || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: 'All fields are required and steps must be a non-empty array' });
    }
      // Create new workflow
    const workflow = new Workflow({
      name,
      category,
      description,
      steps,
      organizationId: req.user.organizationId,
      createdBy: req.user.id
    });
    
    // Save workflow
    await workflow.save();
    
    res.json(workflow);
  } catch (err) {
    console.error('Error creating workflow:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/workflows/:id
// @desc    Update a workflow
// @access  Private (Admin or Creator only)
router.put('/:id', canEditWorkflow, async (req, res) => {
  try {
    const { name, category, description, steps } = req.body;
    
    // Validate input
    if (!name || !category || !description || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: 'All fields are required and steps must be a non-empty array' });
    }
    
    // Use the workflow from middleware
    let workflow = req.workflow;
    
    // Update workflow
    workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      { $set: { name, category, description, steps } },
      { new: true }
    );
    
    res.json(workflow);
  } catch (err) {
    console.error('Error updating workflow:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/workflows/:id
// @desc    Delete a workflow
// @access  Private (Admin or Creator only)
router.delete('/:id', canEditWorkflow, async (req, res) => {
  try {
    // Use the workflow from middleware
    const workflow = req.workflow;
    
    await workflow.deleteOne();
    
    res.json({ message: 'Workflow removed' });
  } catch (err) {
    console.error('Error deleting workflow:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/workflows/duplicate/:id
// @desc    Duplicate a workflow
// @access  Private (Admin only)
router.post('/duplicate/:id', isAdmin, async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has access to duplicate this workflow (same organization)
    if (workflow.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
      // Create new workflow based on the existing one
    const newWorkflow = new Workflow({
      name: `${workflow.name} (Copy)`,
      category: workflow.category,
      description: workflow.description,
      steps: workflow.steps,
      organizationId: req.user.organizationId,
      createdBy: req.user.userId
    });
    
    // Save new workflow
    await newWorkflow.save();
    
    res.json(newWorkflow);
  } catch (err) {
    console.error('Error duplicating workflow:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/workflows/categories
// @desc    Get all unique workflow categories in the organization
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const uniqueCategories = await Workflow.distinct('category', { organizationId: req.user.organizationId });
    res.json(uniqueCategories);
  } catch (err) {
    console.error('Error fetching workflow categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH api/workflows/:id/approval-settings
// @desc    Update workflow approval settings
// @access  Private (Admin only)
router.patch('/:id/approval-settings', isAdmin, async (req, res) => {
  try {
    const {
      isRoutineInspection,
      autoApprovalEnabled,
      bulkApprovalEnabled,
      autoApprovalRules,
      notificationFrequency
    } = req.body;
    
    const workflow = await Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    // Check if user has access to this workflow (same organization)
    if (workflow.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update workflow properties
    workflow.isRoutineInspection = isRoutineInspection;
    workflow.autoApprovalEnabled = autoApprovalEnabled;
    workflow.bulkApprovalEnabled = bulkApprovalEnabled;
    
    // Update auto approval rules if provided
    if (autoApprovalRules) {
      workflow.autoApprovalRules = {
        timeRangeStart: autoApprovalRules.timeRangeStart || '00:00',
        timeRangeEnd: autoApprovalRules.timeRangeEnd || '23:59',
        minValue: autoApprovalRules.minValue,
        maxValue: autoApprovalRules.maxValue,
        valueField: autoApprovalRules.valueField || 'responseText',
        requirePhoto: typeof autoApprovalRules.requirePhoto === 'boolean' ? autoApprovalRules.requirePhoto : true,
        frequencyLimit: autoApprovalRules.frequencyLimit,
        frequencyPeriod: autoApprovalRules.frequencyPeriod || 'day'
      };
    }
    
    // Update notification frequency if provided
    if (notificationFrequency) {
      workflow.notificationFrequency = notificationFrequency;
    }
    
    // Save the updated workflow
    await workflow.save();
    
    res.json(workflow);
  } catch (err) {
    console.error('Error updating workflow approval settings:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;