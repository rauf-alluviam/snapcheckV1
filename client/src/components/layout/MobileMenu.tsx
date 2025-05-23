import React, { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  Users, 
  Workflow, 
  FileText, 
  LogOut, 
  X,
  BarChart4,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-base font-medium transition-colors ${
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

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      <div className="fixed inset-0 flex z-40 lg:hidden">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 mb-5">
              <span className="text-xl font-bold text-blue-600">Inspect Pro</span>
            </div>
            <nav className="mt-5 space-y-1">
              {/* Common navigation items for all authenticated users */}
              <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={onClose} />
              <NavItem to="/inspections" icon={<ClipboardList size={20} />} label="Inspections" onClick={onClose} />
              
              {/* Admin-only navigation items */}
              {isAdmin && (
                <>
                  <NavItem to="/workflows" icon={<Workflow size={20} />} label="Workflows" onClick={onClose} />
                  <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" onClick={onClose} />
                  <NavItem to="/analytics" icon={<BarChart4 size={20} />} label="Analytics" onClick={onClose} />
                  <NavItem to="/users" icon={<Users size={20} />} label="Users Management" onClick={onClose} />
                  <NavItem to="/settings" icon={<Settings size={20} />} label="System Settings" onClick={onClose} />
                </>
              )}
              
              {/* Approver-specific navigation items */}
              {isApprover && (
                <>
                  <NavItem to="/approvals" icon={<UserCheck size={20} />} label="Approvals" onClick={onClose} />
                  <NavItem to="/reports" icon={<FileText size={20} />} label="Reports" onClick={onClose} />
                </>
              )}
              
              {/* Inspector-specific navigation items */}
              {isInspector && (
                <NavItem to="/my-assignments" icon={<ClipboardList size={20} />} label="My Assignments" onClick={onClose} />
              )}
              
              {/* Settings available to all users but with different views */}
              {!isAdmin && (
                <NavItem to="/settings" icon={<Settings size={20} />} label="User Settings" onClick={onClose} />
              )}
            </nav>
          </div>
          
          {/* User profile area */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {getInitials(user?.name)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm font-medium text-gray-500 capitalize">
                  {user?.role}
                  {user?.role === 'admin' && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ShieldCheck size={10} className="mr-0.5" />
                      Admin
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Log out</span>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default MobileMenu;