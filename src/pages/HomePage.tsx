
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

  // Redirect admin users to the main dashboard
  if (userProfile?.role === 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col items-start space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {userProfile?.firstname || 'Resident'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay updated with your barangay community
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <UpcomingEvents />
            <LatestAnnouncements />
            <DocumentRequestsStatus />
            <BarangayOfficials />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
