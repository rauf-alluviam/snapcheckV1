import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: false // Assuming mobile number is optional
  },
  address: {
    type: String,
    required: false // Assuming address is optional
  },  role: {
    type: String,
    enum: ['admin', 'inspector', 'approver', 'custom'],
    default: 'inspector'
  },
  customRole: {
    type: String,
    required: false
  },
  permissions: [{
    type: String,
    required: false
  }],
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('User', UserSchema);