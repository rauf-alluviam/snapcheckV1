import mongoose from 'mongoose';

const WorkflowStepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  mediaRequired: {
    type: Boolean,
    default: false
  }
});

const AutoApprovalRuleSchema = new mongoose.Schema({
  timeRangeStart: {
    type: String, // Format: "HH:MM" - 24-hour format
    default: "00:00"
  },
  timeRangeEnd: {
    type: String, // Format: "HH:MM" - 24-hour format
    default: "23:59"
  },
  maxValue: {
    type: Number,
    default: null
  },
  minValue: {
    type: Number,
    default: null
  },
  valueField: {
    type: String,
    default: "responseText"
  },
  requirePhoto: {
    type: Boolean,
    default: true
  },
  frequencyLimit: {
    type: Number,
    default: null
  },
  frequencyPeriod: {
    type: String,
    enum: ['hour', 'day', 'week'],
    default: 'day'
  }
});

const WorkflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  steps: [WorkflowStepSchema],
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  isRoutineInspection: {
    type: Boolean,
    default: false
  },
  autoApprovalEnabled: {
    type: Boolean,
    default: false
  },
  autoApprovalRules: {
    type: AutoApprovalRuleSchema,
    default: () => ({})
  },
  bulkApprovalEnabled: {
    type: Boolean,
    default: false
  },
  notificationFrequency: {
    type: String,
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
    default: 'daily'
  }
}, {
  timestamps: true
});

export default mongoose.model('Workflow', WorkflowSchema);