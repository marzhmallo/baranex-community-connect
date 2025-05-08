
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ResidentsList from "@/components/residents/ResidentsList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import CalendarView from "@/components/calendar/CalendarView";
import DocumentsPage from "@/components/documents/DocumentsPage";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Bell, FileText, LogOut, Search, User, Settings } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

const Index = () => {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex h-16 items-center px-6 border-b bg-background z-10 sticky top-0">
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
          </div>
          <div className="w-full md:w-auto md:hidden">
            <h1 className="text-xl font-bold text-center">BaranEX</h1>
          </div>
          
          {/* Search bar */}
          <div className="hidden md:flex md:w-1/3 mx-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search..." 
                className="w-full pl-8 bg-background border-muted" 
              />
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-baranex-danger text-white">3</Badge>
            </Button>
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut} size="sm" className="gap-1">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Admin</span>
            </Button>
          </div>
        </header>

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
