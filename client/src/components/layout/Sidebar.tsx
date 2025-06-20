import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  Users, 
  Workflow, 
  FileText, 
  LogOut,   BarChart4,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <span className="mr-3 text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

const getInitials = (name: string | undefined) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const Sidebar: React.FC = () => {
  const { state, logout } = useAuth();
  const { user } = state;
  const navigate = useNavigate();
  
  // Determine role-based access
  const isAdmin = user?.role === 'admin';
  const isApprover = user?.role === 'approver';
  const isInspector = user?.role === 'inspector';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r border-gray-200 bg-white z-30">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <span className="text-xl font-bold text-blue-600">SnapCheck </span>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {/* Common navigation items for all authenticated users */}
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/inspections" icon={<ClipboardList size={20} />} label="Inspections" />
            {/* Admin-only navigation items */}          {isAdmin && (
            <>
              <NavItem to="/workflows" icon={<Workflow size={20} />} label="Workflows" />
              <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" />
              <NavItem to="/analytics" icon={<BarChart4 size={20} />} label="Analytics" />
              <NavItem to="/users" icon={<Users size={20} />} label="Users Management" />
              <NavItem to="/settings" icon={<Settings size={20} />} label="System Settings" />
            </>
          )}
            {/* Approver-specific navigation items */}
          {isApprover && (
            <>
              <NavItem to="/approvals" icon={<UserCheck size={20} />} label="Approvals" />
              <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" />
            </>
          )}
          
          {/* Inspector-specific navigation items */}
          {isInspector && (
            <NavItem to="/my-assignments" icon={<ClipboardList size={20} />} label="My Assignments" />
          )}
          
          {/* Settings available to all users but with different views */}
          {!isAdmin && (
            <NavItem to="/settings" icon={<Settings size={20} />} label="User Settings" />
          )}
        </nav>
        
        {/* User profile area */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {getInitials(user?.name)}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs font-medium text-gray-500 capitalize">
                {user?.role}                {user?.role === 'admin' && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Admin
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-500"
              title="Logout"
            >
              <span className="sr-only">Log out</span>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;