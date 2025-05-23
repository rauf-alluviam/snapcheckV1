import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST api/auth/register-admin
// @desc    Register initial admin user with default organization
// @access  Public (only works once when no admin exists)
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists. Use regular registration.' });
    }
    
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
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organizationId, role, customRole } = req.body;
    
    // Validate input
    if (!name || !email || !password || !organizationId || !role) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
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

export default router;