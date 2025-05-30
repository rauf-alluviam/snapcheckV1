import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
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
  
  // Check for pending batch approvals on load and periodically
  useEffect(() => {
    // Only check for approvers and admins
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'approver')) return;
    
    const checkBatches = async () => {
      try {
        const response = await api.get('/api/inspections/batch');
        if (response.data && response.data.length > 0) {
          const batchCount = response.data.length;
          const totalInspections = response.data.reduce((acc: number, batch: any) => acc + batch.count, 0);
          
          // Add a notification if there are new batches
          if (batchCount > 0) {
            // Check if we already have this notification
            const existingNotif = notifications.find(n => n.id === 'pending-batches');
            
            if (!existingNotif) {
              setNotifications(prev => [
                ...prev,
                {
                  id: 'pending-batches',
                  title: 'Pending Batch Approvals',
                  message: `You have ${batchCount} ${batchCount === 1 ? 'batch' : 'batches'} with ${totalInspections} inspections waiting for your approval.`,
                  type: 'info'
                }
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Error checking for pending batches:', err);
      }
    };
    
    // Check immediately
    checkBatches();
    
    // Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(checkBatches, 5 * 60 * 1000);
    
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
                {notification.id === 'pending-batches' ? (
                  <Link to="/batch-approvals" className="block">
                    <Notification
                      title={notification.title}
                      message={notification.message}
                      type={notification.type}
                      onClose={() => dismissNotification(notification.id)}
                    />
                  </Link>
                ) : (
                  <Notification
                    title={notification.title}
                    message={notification.message}
                    type={notification.type}
                    onClose={() => dismissNotification(notification.id)}
                  />
                )}
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