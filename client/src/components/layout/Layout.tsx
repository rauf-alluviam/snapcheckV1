import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { state } = useAuth();
  const { isAuthenticated, loading } = state;

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
      )}
      
      {/* Content area - always present but with different width based on auth state */}
      <div className={`flex flex-col ${isAuthenticated ? 'w-0 flex-1' : 'w-full'} overflow-hidden`}>
        <Header toggleSidebar={() => setSidebarOpen(true)} />
        
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