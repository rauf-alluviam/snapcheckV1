import express from 'express';
import Organization from '../models/Organization.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   POST api/organizations
// @desc    Create a new organization (admin only)
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    
    // Validate input
    if (!name || !address || !phone || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new organization
    const newOrg = new Organization({
      name,
      address,
      phone,
      email
    });
    
    // Save organization
    const organization = await newOrg.save();
    
    res.status(201).json(organization);
  } catch (err) {
    console.error('Error creating organization:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/organizations
// @desc    Get all organizations (for super admin only)
// @access  Private (Admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (err) {
    console.error('Error fetching organizations:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/organizations/current
// @desc    Get current user's organization
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (err) {
    console.error('Error fetching organization:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/organizations/current
// @desc    Update current user's organization
// @access  Private (Admin only)
router.put('/current', isAdmin, async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    
    // Validate input
    if (!name || !address || !phone || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    let organization = await Organization.findById(req.user.organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Update organization fields
    organization.name = name;
    organization.address = address;
    organization.phone = phone;
    organization.email = email;
    
    // Save updated organization
    await organization.save();
    
    res.json(organization);
  } catch (err) {
    console.error('Error updating organization:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;