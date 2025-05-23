import React, { useState } from 'react';
import { Menu, Bell, X, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const getInitials = (name: string | undefined) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { state, logout } = useAuth();
  const { user, isAuthenticated } = state;
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/inspections') return 'Inspections';
    if (path === '/workflows') return 'Workflows';
    if (path === '/reports') return 'Reports';
    if (path === '/analytics') return 'Analytics';
    if (path === '/users') return 'Users';
    if (path === '/settings') return 'Settings';
    if (path === '/login') return 'Login';
    if (path === '/register') return 'Register';
    return 'Inspect Pro';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };
  
  const handleProfileClick = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {isAuthenticated && (
              <div className="flex-shrink-0 flex items-center lg:hidden">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/20"
                >
                  <span className="sr-only">Open sidebar</span>
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            )}
            <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
              <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
            </div>
          </div>
          
          {isAuthenticated && user ? (
            <div className="flex items-center">
              <div className="ml-6 flex items-center">
                {/* Notifications button */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1 rounded-full text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20"
                  >
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" aria-hidden="true" />
                  </button>
                  
                  {/* Notifications dropdown */}
                  {showNotifications && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto py-2">
                        <div className="px-4 py-2 hover:bg-gray-50">
                          <p className="text-sm text-gray-700">New inspection assigned to you</p>
                          <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                        </div>
                        <div className="px-4 py-2 hover:bg-gray-50">
                          <p className="text-sm text-gray-700">Inspection #1234 is pending approval</p>
                          <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                        </div>
                        <div className="px-4 py-2 hover:bg-gray-50">
                          <p className="text-sm text-gray-700">New workflow has been created</p>
                          <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* User menu */}
                <div className="ml-3 relative">
                  <div>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20"
                    >
                      <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold border border-white/30">
                        {getInitials(user?.name)}
                      </div>
                      <span className="ml-2 text-sm font-medium text-white hidden lg:block">
                        {user?.name} 
                        <span className="ml-1 text-xs text-white/70">
                          ({user?.role})
                        </span>
                      </span>
                    </button>
                  </div>
                  
                  {/* User dropdown menu */}
                  {showUserMenu && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <button 
                        onClick={handleProfileClick}
                        className="flex px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                      >
                        <UserIcon className="mr-2 h-5 w-5" />
                        Profile
                      </button>
                      <button 
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                        className="flex px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                      >
                        <Settings className="mr-2 h-5 w-5" />
                        Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex px-4 py-2 text-sm text-red-600 w-full text-left hover:bg-gray-100"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Non-authenticated header content
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 text-sm font-medium text-white/90 hover:text-white"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="px-3 py-1.5 text-sm font-medium bg-white/20 backdrop-blur-sm text-white rounded-md hover:bg-white/30 border border-white/30"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;