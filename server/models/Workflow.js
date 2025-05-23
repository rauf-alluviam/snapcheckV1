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
  }
}, {
  timestamps: true
});

export default mongoose.model('Workflow', WorkflowSchema);