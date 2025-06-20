import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import ChangePasswordPage from './pages/Auth/ChangePasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InspectionsPage from './pages/Inspections/InspectionsPage';
import InspectionDetailPage from './pages/Inspections/InspectionDetailPage';
import NewInspectionPage from './pages/Inspections/NewInspectionPage';
import WorkflowsPage from './pages/Workflows/WorkflowsPage';
import WorkflowDetailPage from './pages/Workflows/WorkflowDetailPage';
import NewWorkflowPage from './pages/Workflows/NewWorkflowPage';
import EditWorkflowPage from './pages/Workflows/EditWorkflowPage';
import ReportsPage from './pages/Reports/ReportsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import UsersPage from './pages/Users/UsersPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Router>
          <Routes>            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            
            {/* Layout wrapper - Protected */}
            <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
              {/* Default route */}
              <Route index element={<Navigate to="/dashboard" replace />} />
                  {/* Routes with role-based access */}
              {/* Dashboard accessible to all authenticated users */}
              <Route path="dashboard" element={
                <ProtectedRoute element={<DashboardPage />} />
              } />

              {/* Inspection routes */}
              <Route path="inspections" element={
                <ProtectedRoute 
                  element={<InspectionsPage />} 
                  allowedRoles={['admin', 'approver', 'inspector']}
                />
              } />            <Route path="inspections/new" element={
                <ProtectedRoute 
                  element={<NewInspectionPage />} 
                  allowedRoles={['admin', 'inspector']}
                />
              } />
              <Route path="inspections/:id" element={
                <ProtectedRoute 
                  element={<InspectionDetailPage />} 
                  allowedRoles={['admin', 'approver', 'inspector']}
                />
              } />
              <Route path="inspections/:id" element={
                <ProtectedRoute 
                  element={<NewInspectionPage />} 
                  allowedRoles={['admin', 'inspector']}
                />
              } />

              {/* Workflow routes */}
              {/* Workflow routes - Admin only */}
              <Route path="workflows" element={
                <ProtectedRoute 
                  element={<WorkflowsPage />} 
                  allowedRoles={['admin']}
                />
              } />
              <Route path="workflows/:id" element={
                <ProtectedRoute 
                  element={<WorkflowDetailPage />} 
                  allowedRoles={['admin']}
                />
              } />

              {/* Reports - Admin and Approver */}
              <Route path="reports" element={
                <ProtectedRoute 
                  element={<ReportsPage />} 
                  allowedRoles={['admin', 'approver']}
                />
              } />

              {/* Analytics - Admin only */}
              <Route path="analytics" element={
                <ProtectedRoute 
                  element={<AnalyticsPage />} 
                  allowedRoles={['admin']}
                />
              } />
              {/* Admin-only routes */}
              <Route path="workflows" element={
                <ProtectedRoute 
                  element={<WorkflowsPage />} 
                  allowedRoles={['admin']}
                />
              } />              <Route path="workflows/new" element={
                <ProtectedRoute 
                  element={<NewWorkflowPage />} 
                  allowedRoles={['admin']}
                />
              } />              <Route path="workflows/:id/edit" element={
                <ProtectedRoute 
                  element={<EditWorkflowPage />} 
                />
              } />
              <Route path="workflows/:id" element={
                <ProtectedRoute 
                  element={<WorkflowDetailPage />} 
                />
              } />
              <Route path="analytics" element={
                <ProtectedRoute 
                  element={<AnalyticsPage />} 
                  allowedRoles={['admin']}
                />
              } />
              <Route path="users" element={
                <ProtectedRoute 
                  element={<UsersPage />} 
                  allowedRoles={['admin']}
                />
              } />
              
              {/* Admin and Approver routes */}
              <Route path="reports" element={
                <ProtectedRoute 
                  element={<ReportsPage />} 
                  allowedRoles={['admin', 'approver']}
                />
              } />              {/* Approver-specific routes */}
              <Route path="approvals" element={
                <ProtectedRoute 
                  element={<InspectionsPage />} 
                  allowedRoles={['admin', 'approver']}
                />              
                } />
              
              {/* Inspector-specific routes */}
              <Route path="my-assignments" element={
                <ProtectedRoute 
                  element={<InspectionsPage />} 
                  allowedRoles={['admin', 'approver', 'inspector']}
                />
              } />
                {/* Settings accessible to everyone but with different views */}
              <Route path="settings" element={<SettingsPage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
            </Route>
            
            {/* Fallback route for any unmatched paths */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;