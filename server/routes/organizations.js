import express from 'express';
import Organization from '../models/Organization.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { validateOrganization } from '../validation/middleware.js';

const router = express.Router();

// @route   POST api/organizations
// @desc    Create a new organization (admin only)
// @access  Private (Admin only)
router.post('/', isAdmin, validateOrganization.create, async (req, res) => {
  try {
    const { 
      name, 
      address, 
      phone, 
      email, 
      industry, 
      size, 
      customRoles, 
      settings 
    } = req.body;
    
    // Input is already validated by middleware
    
    // Create new organization
    const newOrg = new Organization({
      name,
      address,
      phone,
      email,
      industry,
      size: size || 'small',
      customRoles: customRoles || [],
      settings: {
        allowUserInvites: settings?.allowUserInvites ?? true,
        requireApproverReview: settings?.requireApproverReview ?? true
      }
    });
    
    // Save organization
    const organization = await newOrg.save();
    
    res.status(201).json(organization);
  } catch (err) {
    console.error('Error creating organization:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/organizations/public
// @desc    Get a list of organizations for registration purposes (limited info)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    // Only return essential fields needed for registration, not full organization details
    const organizations = await Organization.find({}, { 
      name: 1, 
      _id: 1,
      industry: 1 
    });
    
    res.json(organizations);
  } catch (err) {
    console.error('Error fetching organizations for registration:', err.message);
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
router.put('/current', isAdmin, validateOrganization.update, async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;
    
    // Input is already validated by middleware
    
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

// @route   POST api/organizations/register
// @desc    Register a new organization during user signup
// @access  Public
router.post('/register', validateOrganization.create, async (req, res) => {
  try {
    const { 
      name, 
      address, 
      phone, 
      email, 
      industry, 
      size, 
      settings 
    } = req.body;
    
    // Input is already validated by middleware
    
    // Check if organization with same name already exists
    const existingOrg = await Organization.findOne({ name });
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization with this name already exists' });
    }
    
    // Create new organization
    const newOrg = new Organization({
      name,
      address,
      phone,
      email,
      industry: industry || 'Other',
      size: size || 'small',
      customRoles: [],
      settings: {
        allowUserInvites: settings?.allowUserInvites ?? true,
        requireApproverReview: settings?.requireApproverReview ?? true
      }
    });
    
    // Save organization
    const organization = await newOrg.save();
    
    res.status(201).json(organization);
  } catch (err) {
    console.error('Error creating organization during registration:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/organizations/:id/roles
// @desc    Add a custom role to organization
// @access  Private (Admin only)
router.post('/:id/roles', isAdmin, validateOrganization.addRole, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    
    // Input is already validated by middleware
    
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Check if role name already exists
    if (organization.customRoles?.some(role => role.name === name)) {
      return res.status(400).json({ message: 'Role name already exists' });
    }
    
    // Add new custom role
    organization.customRoles = [
      ...(organization.customRoles || []),
      { name, permissions }
    ];
    
    await organization.save();
    
    res.json(organization);
  } catch (err) {
    console.error('Error adding custom role:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/organizations/:id/roles/:roleName
// @desc    Update a custom role in organization
// @access  Private (Admin only)
router.put('/:id/roles/:roleName', isAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    const { id, roleName } = req.params;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions array is required' });
    }
    
    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Find and update the role
    const roleIndex = organization.customRoles?.findIndex(role => role.name === roleName);
    if (roleIndex === -1) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    organization.customRoles[roleIndex].permissions = permissions;
    await organization.save();
    
    res.json(organization);
  } catch (err) {
    console.error('Error updating custom role:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/organizations/:id/roles/:roleName
// @desc    Delete a custom role from organization
// @access  Private (Admin only)
router.delete('/:id/roles/:roleName', isAdmin, async (req, res) => {
  try {
    const { id, roleName } = req.params;
    
    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    // Remove the role
    organization.customRoles = organization.customRoles?.filter(role => role.name !== roleName) || [];
    
    // Update any users with this custom role to a default role
    await User.updateMany(
      { organizationId: id, customRole: roleName },
      { $set: { role: 'inspector', customRole: null } }
    );
    
    await organization.save();
    
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Error deleting custom role:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;