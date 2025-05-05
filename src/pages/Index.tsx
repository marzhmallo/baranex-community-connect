
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import ResidentsList from "@/components/residents/ResidentsList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import CalendarView from "@/components/calendar/CalendarView";
import DocumentsPage from "@/components/documents/DocumentsPage";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FileText, LogOut } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
        <header className="flex h-16 items-center px-6 border-b bg-background">
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
          </div>
          <div className="w-full md:w-auto md:hidden">
            <h1 className="text-xl font-bold text-center">BaranEX</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell mr-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              Notifications
            </Button>
            <Button size="sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-circle-2 mr-2"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>
              Admin
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-6" id="dashboard">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <DashboardStats />
            </TabsContent>

            <TabsContent value="residents" className="space-y-6" id="residents">
              <h2 className="text-2xl font-bold">Resident Registry</h2>
              <ResidentsList />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6" id="documents">
              <h2 className="text-2xl font-bold">Document Management</h2>
              <DocumentsPage />
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6" id="announcements">
              <h2 className="text-2xl font-bold">Announcements</h2>
              <AnnouncementsList />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6" id="calendar">
              <h2 className="text-2xl font-bold">Calendar</h2>
              <CalendarView />
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6" id="statistics">
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
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
