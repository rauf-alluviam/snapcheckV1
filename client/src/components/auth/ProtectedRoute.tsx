import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles?: Role[];  // Array of roles allowed to access this route
  redirectTo?: string;    // Custom redirect path
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  element, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) => {
  const { state } = useAuth();
  const { isAuthenticated, user, loading } = state;
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    // Save the current location to redirect back after login
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user doesn't have required role, redirect to dashboard
    return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />;
  }

  // User is authenticated and authorized - render the requested page
  return element;
};

export default ProtectedRoute;