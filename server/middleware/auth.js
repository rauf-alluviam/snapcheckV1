import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Main authentication middleware
export const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // Check if token exists
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtSecret');
      // Add user from payload to request
    req.user = decoded.user;
    
    // Optional: Verify user still exists in database
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found. Token invalid' });
    }
    
    // Add full user object to request (useful for middleware that needs user details)
    req.fullUser = user;
    
    next();
  } catch (err) {
    console.error('Token validation error:', err.message);
    
    // More specific error messages based on JWT error
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(401).json({ message: 'Token verification failed' });
  }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ 
          message: 'Access denied. Admin role required.',
          role: req.user ? req.user.role : 'unknown'
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Check if user is admin or approver
export const isAdminOrApprover = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && (req.user.role === 'admin' || req.user.role === 'approver')) {
        next();
      } else {
        res.status(403).json({ 
          message: 'Access denied. Admin or approver role required.',
          role: req.user ? req.user.role : 'unknown'
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Check if user is inspector or higher role
export const isInspectorOrHigher = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && ['admin', 'approver', 'inspector'].includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ 
          message: 'Access denied. Inspector role or higher required.',
          role: req.user ? req.user.role : 'unknown'
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Check if user belongs to the same organization
export const sameOrganization = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.params.organizationId && req.user && req.params.organizationId !== req.user.organizationId) {
        return res.status(403).json({ 
          message: 'Access denied. You can only access data from your organization.',
          requestedOrg: req.params.organizationId,
          userOrg: req.user.organizationId
        });
      }
      next();
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Check if user can edit workflow (admin or creator)
export const canEditWorkflow = async (req, res, next) => {
  try {
    const Workflow = (await import('../models/Workflow.js')).default;
    
    // First check authentication
    await auth(req, res, async () => {
      try {
        // Find the workflow
        const workflow = await Workflow.findById(req.params.id);
        
        if (!workflow) {
          return res.status(404).json({ message: 'Workflow not found' });
        }
        
        // Check if user has access to this workflow (same organization)
        if (workflow.organizationId.toString() !== req.user.organizationId) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        // Check if user is admin or creator
        if (req.user.role === 'admin' || workflow.createdBy.toString() === req.user.userId) {
          // Add workflow to request for future use
          req.workflow = workflow;
          next();
        } else {
          res.status(403).json({ 
            message: 'Access denied. Only the workflow creator or admins can edit this workflow.',
            role: req.user.role,
            isCreator: workflow.createdBy.toString() === req.user.userId
          });
        }
      } catch (err) {
        console.error('Error in canEditWorkflow middleware:', err);
        res.status(500).json({ message: 'Server error checking permissions' });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};