// Auto-approval utility functions
import Inspection from '../models/Inspection.js';
import User from '../models/User.js';
import { sendNotification } from './notifications.js';

/**
 * Checks if an inspection meets auto-approval criteria
 * @param {Object} inspection - The inspection object
 * @param {Object} rules - Auto approval rules
 * @returns {Object} - Result with status and reason
 */
export const checkAutoApprovalCriteria = (inspection, rules) => {
  if (!rules) {
    return { canAutoApprove: false, reason: 'No rules defined' };
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Check time range
  if (rules.timeRangeStart && rules.timeRangeEnd) {
    if (currentTime < rules.timeRangeStart || currentTime > rules.timeRangeEnd) {
      return { canAutoApprove: false, reason: 'Outside allowed time range' };
    }
  }
  
  // Check if photos are required and present
  if (rules.requirePhoto) {
    const hasRequiredMedia = inspection.filledSteps.every(step => 
      step.mediaUrls && step.mediaUrls.length > 0
    );
    
    if (!hasRequiredMedia) {
      return { canAutoApprove: false, reason: 'Required media not provided' };
    }
  }
  
  // Check for numeric value constraints if specified
  if (rules.minValue !== null || rules.maxValue !== null) {
    // For meter readings
    if (inspection.meterReading !== undefined) {
      if (rules.minValue !== null && inspection.meterReading < rules.minValue) {
        return { canAutoApprove: false, reason: `Value ${inspection.meterReading} below minimum ${rules.minValue}` };
      }
      
      if (rules.maxValue !== null && inspection.meterReading > rules.maxValue) {
        return { canAutoApprove: false, reason: `Value ${inspection.meterReading} above maximum ${rules.maxValue}` };
      }
    } else {
      // Try to extract number from response text of first step
      try {
        const firstStep = inspection.filledSteps[0];
        if (firstStep) {
          const numericValue = parseFloat(firstStep.responseText);
          if (!isNaN(numericValue)) {
            if (rules.minValue !== null && numericValue < rules.minValue) {
              return { canAutoApprove: false, reason: `Value ${numericValue} below minimum ${rules.minValue}` };
            }
            
            if (rules.maxValue !== null && numericValue > rules.maxValue) {
              return { canAutoApprove: false, reason: `Value ${numericValue} above maximum ${rules.maxValue}` };
            }
          }
        }
      } catch (err) {
        return { canAutoApprove: false, reason: 'Unable to extract numeric value from response' };
      }
    }
  }
  
  // Check submission frequency if needed
  if (rules.frequencyLimit && rules.frequencyPeriod) {
    // This would require querying the database for previous submissions
    // Implementation depends on your specific requirements
  }
  return { canAutoApprove: true, reason: 'All criteria met' };
};

/**
 * Processes automatic approval for routine inspections
 */
export const processAutoApprovals = async (inspection, workflow) => {
  if (!workflow.autoApprovalEnabled) {
    return false;
  }
  
  const { canAutoApprove, reason } = checkAutoApprovalCriteria(
    inspection, 
    workflow.autoApprovalRules
  );
  
  if (canAutoApprove) {
    inspection.status = 'auto-approved';
    inspection.autoApproved = true;
    inspection.approvedAt = new Date();
    
    // Mark all approvers as approved
    if (inspection.approvers && inspection.approvers.length > 0) {
      for (const approver of inspection.approvers) {
        approver.status = 'approved';
        approver.remarks = 'Auto-approved based on predefined rules';
        approver.actionDate = new Date();
      }
    }
    
    await inspection.save();
    return true;
  } else {
    console.log(`Auto-approval failed for inspection ${inspection._id}: ${reason}`);
    return false;
  }
};
