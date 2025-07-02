
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, FileText, Calendar, TrendingUp, UserPlus, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { useDashboardData } from "@/hooks/useDashboardData";

const DashboardStats = () => {
  const { 
    residents, 
    households, 
    upcomingEvents, 
    latestAnnouncements, 
    barangayOfficials, 
    loading: dataLoading 
  } = useData();
  
  const {
    residentGrowthRate,
    householdGrowthRate,
    newResidentsThisMonth,
    newHouseholdsThisMonth,
    newAnnouncementsThisWeek,
    nextEventDays,
    isLoading: dashboardLoading,
    error
  } = useDashboardData();

  const isLoading = dataLoading || dashboardLoading;

  // Calculate totals from context data
  const totalResidents = residents.length;
  const totalHouseholds = households.length;
  const totalAnnouncements = latestAnnouncements.length;
  const totalEvents = upcomingEvents.length;

  const formatGrowthRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-4">
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Error loading dashboard data: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalResidents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={`font-medium ${residentGrowthRate >= 0 ? 'text-baranex-success' : 'text-red-500'}`}>
                {isLoading ? '...' : formatGrowthRate(residentGrowthRate)}
              </span>
              {' '}from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalHouseholds.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={`font-medium ${householdGrowthRate >= 0 ? 'text-baranex-success' : 'text-red-500'}`}>
                {isLoading ? '...' : formatGrowthRate(householdGrowthRate)}
              </span>
              {' '}from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalAnnouncements.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-baranex-primary">
                {isLoading ? '...' : newAnnouncementsThisWeek}
              </span>
              {' '}new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextEventDays !== null ? (
                <span className="font-medium text-baranex-warning">
                  Next in {nextEventDays} day{nextEventDays !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-muted-foreground">No upcoming events</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Residents</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-baranex-success">
              {isLoading ? '...' : newResidentsThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Households</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-baranex-success">
              {isLoading ? '...' : newHouseholdsThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barangay Officials</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : barangayOfficials.length}
            </div>
            <p className="text-xs text-muted-foreground">Currently serving</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              <Link to="/residents/add">
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-baranex-primary hover:text-white">
                  Add Resident
                </Badge>
              </Link>
              <Link to="/households/add">
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-baranex-primary hover:text-white">
                  Add Household
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
