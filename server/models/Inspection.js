import mongoose from 'mongoose';

const FilledStepSchema = new mongoose.Schema({
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  stepTitle: {
    type: String,
    required: true
  },
  responseText: {
    type: String,
    required: true
  },
  mediaUrls: [String],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const InspectionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  workflowName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  inspectionType: {
    type: String,
    required: true
  },
  filledSteps: [FilledStepSchema],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },  // Single primary approver (for backward compatibility)
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Multiple approvers with their approval status
  approvers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    remarks: {
      type: String,
      default: ''
    },
    actionDate: {
      type: Date
    }
  }],  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto-approved'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  remarks: {
    type: String,
    default: ''
  },
  autoApproved: {
    type: Boolean,
    default: false  },
  meterReading: {
    type: Number
  },
  readingDate: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  inspectionDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Inspection', InspectionSchema);