import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/users
// @desc    Get all users in the organization
// @access  Private (Admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId })
      .select('-password')
      .populate('organizationId', 'name');
    
    const transformedUsers = users.map(user => {
      const { organizationId, ...rest } = user.toObject();
      return {
        ...rest,
        organizationName: organizationId.name
      };
    });
    
    res.json(transformedUsers);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('organizationId', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user belongs to admin's organization
    if (user.organizationId._id.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { organizationId, ...rest } = user.toObject();
    const transformedUser = {
      ...rest,
      organizationName: organizationId.name
    };
    
    res.json(transformedUser);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
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
      role,
      organizationId: req.user.organizationId
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Save user
    await user.save();
    
    // Return user data without password
    const savedUser = await User.findById(user._id)
      .select('-password')
      .populate('organizationId', 'name');
    
    const { organizationId, ...rest } = savedUser.toObject();
    const transformedUser = {
      ...rest,
      organizationName: organizationId.name
    };
    
    res.json(transformedUser);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user belongs to admin's organization
    if (user.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user fields
    user.name = name;
    user.email = email;
    user.role = role;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user data without password
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('organizationId', 'name');
    
    const { organizationId, ...rest } = updatedUser.toObject();
    const transformedUser = {
      ...rest,
      organizationName: organizationId.name
    };
    
    res.json(transformedUser);
  } catch (err) {
    console.error('Error updating user:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user belongs to admin's organization
    if (user.organizationId.toString() !== req.user.organizationId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({
        organizationId: req.user.organizationId,
        role: 'admin'
      });
        if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only admin user' });
      }
    }
    
    await user.deleteOne();
    
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/users/profile
// @desc    Update logged in user's profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, mobileNumber, address, currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }
    
    // Find user
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user fields
    user.name = name;
    user.email = email;
    if (mobileNumber !== undefined) { // Check if mobileNumber is provided
      user.mobileNumber = mobileNumber;
    }
    if (address !== undefined) { // Check if address is provided
      user.address = address;
    }
    
    // Update password if provided
    if (newPassword) {
      // Verify current password
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user data without password
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      mobileNumber: user.mobileNumber,
      address: user.address
    });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;