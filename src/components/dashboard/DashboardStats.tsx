
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Users, Home, Calendar, TrendingUp, TrendingDown, Megaphone } from "lucide-react";
import { useDashboardDataContext } from "@/contexts/DashboardDataContext";

const DashboardStats = () => {
  const { data, isLoading } = useDashboardDataContext();
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  const formatGrowthRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  const formatAnnouncementText = () => {
    if (!data) return "Loading...";
    if (data.newAnnouncementsThisWeek === 0) {
      return "No new announcements this week";
    } else if (data.newAnnouncementsThisWeek === 1) {
      return "1 new this week";
    } else {
      return `${data.newAnnouncementsThisWeek} new this week`;
    }
  };

  const formatEventText = () => {
    if (!data) return "Loading...";
    if (data.nextEventDays === null || data.upcomingEvents === 0) {
      return "No upcoming events";
    } else if (data.nextEventDays === 0) {
      return "Event today";
    } else if (data.nextEventDays === 1) {
      return "Next event tomorrow";
    } else {
      return `Next event in ${data.nextEventDays} days`;
    }
  };

  if (isLoading || !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border shadow-sm animate-pulse">
            <div className="flex">
              <div className="flex-grow p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-16 bg-gray-200"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex">
          <div className="flex-grow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Residents</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{data.totalResidents.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                {data.residentGrowthRate >= 0 ? (
                  <TrendingUp className="text-baranex-success h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="text-red-500 h-3 w-3 mr-1" />
                )}
                <p className={`text-xs ${data.residentGrowthRate >= 0 ? 'text-baranex-success' : 'text-red-500'}`}>
                  {formatGrowthRate(data.residentGrowthRate)} ({data.newResidentsThisMonth} this month)
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
              <div className="text-2xl font-bold">{data.totalHouseholds.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                {data.householdGrowthRate >= 0 ? (
                  <TrendingUp className="text-baranex-success h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="text-red-500 h-3 w-3 mr-1" />
                )}
                <p className={`text-xs ${data.householdGrowthRate >= 0 ? 'text-baranex-success' : 'text-red-500'}`}>
                  {formatGrowthRate(data.householdGrowthRate)} ({data.newHouseholdsThisMonth} this month)
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
              <div className="text-2xl font-bold">{data.activeAnnouncements}</div>
              <div className="flex items-center mt-1">
                <Megaphone className="text-baranex-warning h-3 w-3 mr-1" />
                <p className="text-xs text-baranex-warning">
                  {formatAnnouncementText()}
                </p>
              </div>
              <Progress value={78} className="mt-3 h-1.5" />
            </CardContent>
          </div>
          <div className="bg-gradient-to-br from-baranex-warning/10 to-baranex-warning/5 p-4 flex items-center justify-center">
            <Megaphone className="h-8 w-8 text-baranex-warning" />
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
              <div className="text-2xl font-bold">{data.upcomingEvents}</div>
              <div className="flex items-center mt-1">
                <Calendar className="text-baranex-accent h-3 w-3 mr-1" />
                <p className="text-xs text-accent-foreground">
                  {formatEventText()}
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
