
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Users, Home, Calendar, FileText, TrendingUp } from "lucide-react";

const DashboardStats = () => {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex">
          <div className="flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Residents</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">2,853</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="text-baranex-success h-3 w-3 mr-1" />
                <p className="text-xs text-baranex-success">
                  +34 from last month
                </p>
              </div>
              <Progress value={progress} className="mt-3 h-1.5" />
            </CardContent>
          </div>
          <div className="bg-gradient-to-br from-baranex-primary/10 to-baranex-primary/5 p-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-baranex-primary" />
          </div>
        </div>
      </Card>
      
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex">
          <div className="flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Registered Households</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">642</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="text-baranex-success h-3 w-3 mr-1" />
                <p className="text-xs text-baranex-success">
                  +18 from last month
                </p>
              </div>
              <Progress value={35} className="mt-3 h-1.5" />
            </CardContent>
          </div>
          <div className="bg-gradient-to-br from-baranex-secondary/10 to-baranex-secondary/5 p-4 flex items-center justify-center">
            <Home className="h-8 w-8 text-baranex-secondary" />
          </div>
        </div>
      </Card>
      
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex">
          <div className="flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Announcements</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">12</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="text-baranex-warning h-3 w-3 mr-1" />
                <p className="text-xs text-baranex-warning">
                  5 new this week
                </p>
              </div>
              <Progress value={78} className="mt-3 h-1.5" />
            </CardContent>
          </div>
          <div className="bg-gradient-to-br from-baranex-warning/10 to-baranex-warning/5 p-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone text-baranex-warning"><path d="m3 11 18-5v12L3 13"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
          </div>
        </div>
      </Card>
      
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex">
          <div className="flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">7</div>
              <div className="flex items-center mt-1">
                <Calendar className="text-baranex-accent h-3 w-3 mr-1" />
                <p className="text-xs text-accent-foreground">
                  Next event in 3 days
                </p>
              </div>
              <Progress value={45} className="mt-3 h-1.5" />
            </CardContent>
          </div>
          <div className="bg-gradient-to-br from-baranex-accent/10 to-baranex-accent/5 p-4 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-baranex-accent" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;
