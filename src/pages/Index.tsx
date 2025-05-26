
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResidentsList from "@/components/residents/ResidentsList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import CalendarView from "@/components/calendar/CalendarView";
import DocumentsPage from "@/components/documents/DocumentsPage";
import { Bell, FileText, LogOut, Search, User, Settings } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";

const Index = () => {
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

  // Redirect regular users to the home page
  if (userProfile?.role === 'user') {
    return <Navigate to="/home" replace />;
  }

  // Only allow admin/staff to access this page
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'staff') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <DashboardHeader />
            <DashboardStats />
            <DashboardCharts />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
