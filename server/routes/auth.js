import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { auth } from '../middleware/auth.js';
import { sendEmail, generateResetPasswordEmail } from '../utils/email.js';
import { 
  validateUser,
  validatePasswordStrength 
} from '../validation/middleware.js';

const router = express.Router();

// @route   POST api/auth/register-admin
// @desc    Register initial admin user with default organization
// @access  Public (only works once when no admin exists)
router.post('/register-admin', validateUser.register, validatePasswordStrength, async (req, res) => {  try {
    const { name, email, password } = req.body;
    
    // Input is already validated by middleware
    
    // Check if admin already exists
    // const existingAdmin = await User.findOne({ role: 'admin' });
    // if (existingAdmin) {
    //   return res.status(400).json({ message: 'Admin already exists. Use regular registration.' });
    // }
    
    // Create default organization
    const defaultOrg = new Organization({
      name: 'Default Organization',
      address: 'Default Address',
      phone: '000-000-0000',
      email: email,
      isDefault: true
    });
    
    const savedOrg = await defaultOrg.save();
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      organizationId: savedOrg._id,
      role: 'admin' // Force admin role
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Save user
    await user.save();
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        organizationId: user.organizationId
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'jwtSecret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        
        // Return token, user data, and organization data
        res.status(201).json({
          token,
          user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          organization: savedOrg
        });
      }
    );
  } catch (err) {
    console.error('Error in admin registration:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', validateUser.register, validatePasswordStrength, async (req, res) => {
  try {
    const { name, email, password, organizationId, role, customRole } = req.body;
    
    // Input is already validated by middleware
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(400).json({ message: 'Invalid organization' });
    }
    
    // If it's a custom role, verify it exists in the organization
    if (role === 'custom') {
      if (!customRole) {
        return res.status(400).json({ message: 'Custom role name must be provided' });
      }
      
      const validRole = organization.customRoles?.find(r => r.name === customRole);
      if (!validRole) {
        return res.status(400).json({ message: 'Invalid custom role' });
      }
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      organizationId,
      role,
      customRole: role === 'custom' ? customRole : undefined
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Save user
    await user.save();
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        customRole: user.customRole,
        organizationId: user.organizationId
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'jwtSecret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        
        // Return token and user data
        res.json({
          token,
          user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            customRole: user.customRole,
            organizationId: user.organizationId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in user registration:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', validateUser.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input is already validated by middleware
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        organizationId: user.organizationId
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'jwtSecret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        
        // Return token and user data
        res.json({
          token,
          user: {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in user login:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth
// @desc    Get authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', validateUser.forgotPassword, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Input is already validated by middleware
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, still return success even if email doesn't exist
      return res.status(200).json({ message: 'Password reset link sent if email exists' });
    }
    
    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiration on user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Build reset URL
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    
    // Generate and send email
    const { htmlBody, textBody } = generateResetPasswordEmail(
      user.name,
      resetToken,
      resetUrl
    );
    
    await sendEmail(
      user.email,
      'Password Reset Request',
      htmlBody,
      textBody
    );
    
    res.status(200).json({ message: 'Password reset link sent if email exists' });
  } catch (err) {
    console.error('Error in forgot password:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', validateUser.resetPassword, validatePasswordStrength, async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;
    
    // Input is already validated by middleware
    
    // Find user by token and check expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    // Update password and clear reset fields
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Error in reset password:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/change-password
// @desc    Change password when logged in
// @access  Private
router.post('/change-password', auth,  validatePasswordStrength, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Input is already validated by middleware
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error in change password:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;