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
