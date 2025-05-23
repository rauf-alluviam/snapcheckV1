import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: false
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'enterprise'],
    default: 'small'
  },
  customRoles: [{
    name: String,
    permissions: [String]
  }],
  settings: {
    allowUserInvites: {
      type: Boolean,
      default: true
    },
    requireApproverReview: {
      type: Boolean,
      default: true
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Organization', OrganizationSchema);