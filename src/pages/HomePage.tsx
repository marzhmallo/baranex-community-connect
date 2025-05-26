
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import PublicSidebar from '@/components/layout/PublicSidebar';

const HomePage = () => {
  const { userProfile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    const handleSidebarChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarCollapsed(customEvent.detail.isCollapsed);
    };
    
    window.addEventListener('publicSidebarStateChange', handleSidebarChange);
    
    return () => {
      window.removeEventListener('publicSidebarStateChange', handleSidebarChange);
    };
  }, []);

  return (
    <div className="flex">
      <PublicSidebar />
      
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-16" : "md:ml-64"
        }`}
      > 
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Welcome, {userProfile?.firstname} {userProfile?.lastname}!
            </h1>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">User Dashboard</h2>
              <p className="text-gray-600 mb-4">
                This is your personal dashboard where you can access user-specific features.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">My Profile</h3>
                  <p className="text-sm text-blue-600">View and edit your profile information</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Announcements</h3>
                  <p className="text-sm text-green-600">View barangay announcements</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Services</h3>
                  <p className="text-sm text-purple-600">Access barangay services</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> This is the user dashboard. Administrative features are restricted to admin and staff accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
