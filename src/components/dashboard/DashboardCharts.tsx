import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from 'react-router-dom';
import { FileText, Users, Home, ChevronRight, UserX, MapPin } from 'lucide-react';
import { useData } from "@/context/DataContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from 'react';

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  user_id: string;
}

const DashboardCharts = () => {
  const { residents, households, loading: dataLoading } = useData();
  const { userProfile } = useAuth();
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  const {
    monthlyResidents,
    genderDistribution,
    residentGrowthRate,
    totalDeceased,
    totalRelocated,
    isLoading: dashboardLoading,
    error
  } = useDashboardData();

  // Use data from context for totals
  const totalResidents = residents.length;
  const isLoading = dataLoading || dashboardLoading;

  // Fetch recent activities from activity_logs table
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!userProfile?.brgyid) return;
      
      try {
        setActivitiesLoading(true);
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('brgyid', userProfile.brgyid)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Error fetching activity logs:', error);
          return;
        }

        setRecentActivities(data || []);
      } catch (err) {
        console.error('Error in fetchRecentActivities:', err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchRecentActivities();
  }, [userProfile?.brgyid]);

  // Helper function to get icon based on action type
  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('resident')) {
      return <Users className="h-4 w-4 text-primary" />;
    } else if (action.toLowerCase().includes('document')) {
      return <FileText className="h-4 w-4 text-primary" />;
    } else if (action.toLowerCase().includes('household')) {
      return <Home className="h-4 w-4 text-primary" />;
    } else {
      return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const formatGrowthRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  // Colors for pie chart - expanded to include more colors for gender diversity
  const pieColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  if (error) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Error loading dashboard data: {error}
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main chart area - takes up 2 columns on md screens */}
      <Card className="md:col-span-2">
        <CardHeader>
          <div>
            <CardTitle className="text-lg">Population Growth</CardTitle>
            <CardDescription>Monthly resident registration trends</CardDescription>
          </div>
          <Tabs defaultValue="line" className="w-full">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="line">Line Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="line" className="mt-4">
              <ChartContainer config={{
              residents: {
                theme: {
                  dark: '#3b82f6',
                  light: '#3b82f6'
                }
              }
            }} className="h-[350px] w-full">
                {isLoading ? <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div> : <LineChart data={monthlyResidents} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent nameKey="month" />} />
                    <Legend />
                    <Line type="monotone" dataKey="residents" name="Active Residents" stroke="var(--color-residents, #3b82f6)" strokeWidth={2} activeDot={{
                  r: 8
                }} />
                  </LineChart>}
              </ChartContainer>
            </TabsContent>
            <TabsContent value="bar" className="mt-4">
              <ChartContainer config={{
              residents: {
                theme: {
                  dark: '#3b82f6',
                  light: '#3b82f6'
                }
              }
            }} className="h-[350px] w-full">
                {isLoading ? <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div> : <BarChart data={monthlyResidents} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent nameKey="month" />} />
                    <Legend />
                    <Bar dataKey="residents" name="Active Residents" fill="var(--color-residents, #3b82f6)" />
                  </BarChart>}
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1">Active Population</div>
                <div className="text-2xl font-bold text-center">
                  {isLoading ? '...' : totalResidents.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1">Growth Rate</div>
                <div className={`text-2xl font-bold text-center ${residentGrowthRate >= 0 ? 'text-baranex-success' : 'text-red-500'}`}>
                  {isLoading ? '...' : formatGrowthRate(residentGrowthRate)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1">New this Month</div>
                <div className="text-2xl font-bold text-center">
                  {isLoading ? '...' : monthlyResidents[monthlyResidents.length - 1]?.residents || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1 flex items-center">
                  <UserX className="h-3 w-3 mr-1" />
                  Deceased
                </div>
                <div className="text-2xl font-bold text-center text-red-500">
                  {isLoading ? '...' : totalDeceased.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="text-xs uppercase text-muted-foreground mb-1 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Relocated
                </div>
                <div className="text-2xl font-bold text-center text-orange-500">
                  {isLoading ? '...' : totalRelocated.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar area - takes 1 column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : recentActivities.length > 0 ? (
                recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.details?.description || 'System activity'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity found
                </p>
              )}

              <Link to="/residents" className="flex items-center justify-center text-sm text-primary hover:underline mt-2 py-2">
                View all residents
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${genderDistribution.length} gender categories found (active residents only)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : genderDistribution.length > 0 ? (
              <div className="space-y-4">
                <ChartContainer config={{}} className="h-[200px] w-full">
                  <PieChart>
                    <Pie 
                      data={genderDistribution} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      fill="#8884d8" 
                      dataKey="count" 
                      label={({ gender, percentage }) => `${gender}: ${percentage}%`}
                    >
                      {genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, 'Count']} />
                  </PieChart>
                </ChartContainer>
                <div className="space-y-2">
                  {genderDistribution.map((item, index) => (
                    <div key={item.gender} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: pieColors[index % pieColors.length] }} 
                        />
                        <span>{item.gender}</span>
                      </div>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No gender data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>;
};

export default DashboardCharts;
