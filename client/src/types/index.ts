export type Role = 'admin' | 'inspector' | 'approver' | 'guest';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  _id?: string;
  title: string;
  instructions: string;
  mediaRequired: boolean;
}

export interface Workflow {
  _id: string;
  name: string;
  category: string;
  description: string;
  steps: WorkflowStep[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilledStep {
  _id?: string;
  stepId: string;
  stepTitle: string;
  responseText: string;
  mediaUrls: string[];
  timestamp: string;
}

export interface Inspection {
  _id: string;
  workflowId: string;
  workflowName: string;
  category: string;
  inspectionType: string;
  filledSteps: FilledStep[];
  assignedTo: string;
  assignedToName?: string;
  inspectorId: string; // Added for explicit inspector tracking
  approverId: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  organizationId: string;
  inspectionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface FilterParams {
  organizationId: string;
  role: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  inspectionType?: string;
  status?: string;
  assignedTo?: string;
  approverId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}