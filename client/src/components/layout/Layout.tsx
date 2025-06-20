import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import Notification from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; type: 'success' | 'warning' | 'info' | 'error' }[]>([]);
  const { state } = useAuth();
  const { isAuthenticated, loading, user } = state;
    // Check for notifications periodically
  useEffect(() => {
    // Only check for approvers and admins
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'approver')) return;
    
    const checkForNotifications = async () => {
      // Future notification checks can be added here
    };
    
    // Check immediately
    checkForNotifications();
    
    // Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(checkForNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.role, notifications]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Show loading indicator while authentication state is being determined
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Only render sidebar components when authenticated */}
      {isAuthenticated && (
        <>
          {/* Mobile sidebar */}
          <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Static sidebar for desktop */}
          <Sidebar />
        </>
      )}      {/* Content area - always present but with different width based on auth state */}
      <div className={`flex flex-col ${isAuthenticated ? 'md:ml-64 w-full' : 'w-full'} overflow-hidden`}>
        <Header toggleSidebar={() => setSidebarOpen(true)} />
          {/* Notifications area */}
        {notifications.length > 0 && (
          <div className="px-4 sm:px-6 md:px-8 pt-6">
            {notifications.map((notification) => (
              <div key={notification.id} className="mb-4">
                <Notification
                  title={notification.title}
                  message={notification.message}
                  type={notification.type}
                  onClose={() => dismissNotification(notification.id)}
                />
              </div>
            ))}
          </div>
        )}
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;