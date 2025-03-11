
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResidentsList from "@/components/residents/ResidentsList";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";
import CalendarView from "@/components/calendar/CalendarView";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LogOut } from "lucide-react";

const Index = () => {
  const handleSignOut = () => {
    // In a real app, this would handle authentication sign out
    console.log("Signed out");
    alert("You have been signed out");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground">BaranEX</h1>
          <p className="text-sm text-sidebar-foreground/70">Barangay Census System</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="sidebar" className="w-full justify-start" asChild>
            <a href="#dashboard" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              <span>Dashboard</span>
            </a>
          </Button>
          <Button variant="sidebar" className="w-full justify-start" asChild>
            <a href="#residents" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Residents</span>
            </a>
          </Button>
          <Button variant="sidebar" className="w-full justify-start" asChild>
            <a href="#announcements" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 13"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
              <span>Announcements</span>
            </a>
          </Button>
          <Button variant="sidebar" className="w-full justify-start" asChild>
            <a href="#calendar" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <span>Calendar</span>
            </a>
          </Button>
          <Button variant="sidebar" className="w-full justify-start" asChild>
            <a href="#statistics" className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              <span>Statistics</span>
            </a>
          </Button>
        </nav>
        
        {/* Add theme toggle and sign out buttons at the bottom */}
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="space-y-2">
            <ThemeToggle />
            <Button 
              variant="sidebar" 
              className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

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
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
              <TabsTrigger value="dashboard" id="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="residents" id="residents">Residents</TabsTrigger>
              <TabsTrigger value="announcements" id="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="calendar" id="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="statistics" id="statistics">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <DashboardStats />
            </TabsContent>

            <TabsContent value="residents" className="space-y-6">
              <h2 className="text-2xl font-bold">Resident Registry</h2>
              <ResidentsList />
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6">
              <h2 className="text-2xl font-bold">Announcements</h2>
              <AnnouncementsList />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <h2 className="text-2xl font-bold">Calendar</h2>
              <CalendarView />
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
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
