
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("dashboard");
  
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Scroll to the tab content
    const element = document.getElementById(value);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
        <main className="flex-1 p-0 overflow-auto">
          <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
            <div className="px-1 bg-muted/20 border-b sticky top-16 z-10">
              <TabsList className="h-12 w-full bg-transparent justify-start overflow-x-auto overflow-y-hidden scrollbar-none">
                <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
                <TabsTrigger value="residents" className="text-sm">Residents</TabsTrigger>
                <TabsTrigger value="documents" className="text-sm">Documents</TabsTrigger>
                <TabsTrigger value="announcements" className="text-sm">Announcements</TabsTrigger>
                <TabsTrigger value="calendar" className="text-sm">Calendar</TabsTrigger>
                <TabsTrigger value="statistics" className="text-sm">Statistics</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="dashboard" className="space-y-6 mt-2" id="dashboard">
                <DashboardHeader />
                <DashboardStats />
                <DashboardCharts />
              </TabsContent>

              <TabsContent value="residents" className="space-y-6 mt-2" id="residents">
                <h2 className="text-2xl font-bold">Resident Registry</h2>
                <ResidentsList />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6 mt-2" id="documents">
                <h2 className="text-2xl font-bold">Document Management</h2>
                <DocumentsPage />
              </TabsContent>

              <TabsContent value="announcements" className="space-y-6 mt-2" id="announcements">
                <h2 className="text-2xl font-bold">Announcements</h2>
                <AnnouncementsList />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6 mt-2" id="calendar">
                <h2 className="text-2xl font-bold">Calendar</h2>
                <CalendarView />
              </TabsContent>

              <TabsContent value="statistics" className="space-y-6 mt-2" id="statistics">
                <h2 className="text-2xl font-bold">Statistics</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Demographic Breakdown</CardTitle>
                      <CardDescription>Distribution of residents by age and gender</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        Charts will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Population Trends</CardTitle>
                      <CardDescription>Population growth over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        Charts will be displayed here
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
