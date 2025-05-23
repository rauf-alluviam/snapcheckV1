import { auth } from './auth.js';
import Organization from '../models/Organization.js';

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      await auth(req, res, async () => {
        // Admin always has all permissions
        if (req.user.role === 'admin') {
          return next();
        }

        // For built-in roles, check the role-based permissions
        if (['inspector', 'approver'].includes(req.user.role)) {
          const hasPermission = checkBuiltInRolePermission(req.user.role, requiredPermission);
          if (hasPermission) {
            return next();
          }
        }

        // For custom roles, check the organization's custom role permissions
        if (req.user.role === 'custom' && req.user.customRole) {
          const org = await Organization.findById(req.user.organizationId);
          const customRole = org.customRoles?.find(r => r.name === req.user.customRole);
          
          if (customRole?.permissions.includes(requiredPermission)) {
            return next();
          }
        }

        res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          required: requiredPermission,
          role: req.user.role,
          customRole: req.user.customRole || undefined
        });
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error in permission middleware' });
    }
  };
};

const checkBuiltInRolePermission = (role, requiredPermission) => {
  const rolePermissions = {
    admin: ['*'],
    approver: [
      'view_inspections',
      'approve_inspections',
      'reject_inspections',
      'view_reports',
      'create_comments'
    ],
    inspector: [
      'view_inspections',
      'create_inspections',
      'update_inspections',
      'view_workflows',
      'create_comments'
    ]
  };

  const permissions = rolePermissions[role] || [];
  return permissions.includes('*') || permissions.includes(requiredPermission);
};
