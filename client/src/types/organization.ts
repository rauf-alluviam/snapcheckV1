export interface CustomRole {
  name: string;
  permissions: string[];
}

export interface OrganizationSettings {
  allowUserInvites: boolean;
  requireApproverReview: boolean;
}

export interface Organization {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  industry?: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  customRoles?: CustomRole[];
  settings: OrganizationSettings;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'inspector' | 'approver' | 'custom';
