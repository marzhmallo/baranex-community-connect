
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import LatestAnnouncements from '@/components/home/LatestAnnouncements';
import DocumentRequestsStatus from '@/components/home/DocumentRequestsStatus';
import BarangayOfficials from '@/components/home/BarangayOfficials';

const HomePage = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect admin/staff users to the dashboard
  if (userProfile?.role === 'admin' || userProfile?.role === 'staff') {
    return <Navigate to="/dashboard" replace />;
  }

  // Only allow users with 'user' role on this page
  if (userProfile?.role !== 'user') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {userProfile?.firstname || 'Resident'}!
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Stay updated with your barangay community
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/profile'}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                My Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <UpcomingEvents />
          <LatestAnnouncements />
          <DocumentRequestsStatus />
          <BarangayOfficials />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
