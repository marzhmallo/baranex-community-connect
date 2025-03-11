
import React from 'react';
import { 
  Users,
  UserPlus,
  Bell,
  Calendar,
  FileText,
  AlertCircle,
  BarChart3,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { dashboardStats, announcements, crimeReports, forumPosts } from '@/lib/data';

const StatCard = ({ icon: Icon, title, value, description, trend, color }: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className={`bg-${color || 'baranex-primary'}/10 p-2 rounded-full`}>
          <Icon className={`h-6 w-6 text-${color || 'baranex-primary'}`} />
        </div>
        {trend && (
          <div className={`flex items-center ${trend.isPositive ? 'text-green-600' : 'text-red-600'} text-xs font-medium`}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Barangay Dashboard</h2>
        <div className="flex space-x-4">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          title="Total Residents" 
          value={dashboardStats.totalResidents} 
          color="baranex-primary" 
        />
        <StatCard 
          icon={UserPlus} 
          title="New Residents" 
          value={dashboardStats.newResidentsThisMonth} 
          description="This month" 
          trend={{ value: 8, isPositive: true }} 
          color="baranex-success" 
        />
        <StatCard 
          icon={Bell} 
          title="Active Announcements" 
          value={dashboardStats.activeAnnouncements} 
          color="baranex-secondary" 
        />
        <StatCard 
          icon={AlertCircle} 
          title="Open Crime Reports" 
          value={dashboardStats.openCrimeReports} 
          trend={{ value: 12, isPositive: false }} 
          color="baranex-danger" 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Announcements</CardTitle>
            <CardDescription>Latest information shared with residents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                    announcement.priority === 'Urgent' 
                      ? 'bg-red-100 text-red-600' 
                      : announcement.priority === 'High'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {announcement.priority === 'Urgent' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        announcement.priority === 'Urgent' 
                          ? 'bg-red-100 text-red-600' 
                          : announcement.priority === 'High'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {announcement.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{announcement.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{announcement.datePosted}</span>
                      {announcement.location && (
                        <span className="text-xs text-gray-500">{announcement.location}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto" asChild>
              <a href="/announcements">
                View all announcements
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Forum Activity</CardTitle>
            <CardDescription>Latest discussions in the community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forumPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium">{post.title}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {post.category}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{post.authorName}</span>
                    <span className="mx-1">•</span>
                    <span>{post.datePosted}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {post.commentCount} comments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto" asChild>
              <a href="/forum">
                View all discussions
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Crime Reports</CardTitle>
            <CardDescription>Latest incidents reported in the barangay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {crimeReports.slice(0, 3).map((report) => (
                <div key={report.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium">{report.reportTitle}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      report.severity === 'Critical' 
                        ? 'bg-red-100 text-red-600' 
                        : report.severity === 'Serious'
                        ? 'bg-amber-100 text-amber-600'
                        : report.severity === 'Moderate'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {report.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Report #: {report.reportNumber}
                    </span>
                    <span>
                      Status: {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto" asChild>
              <a href="/crime-reports">
                View all reports
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Demographics Overview</CardTitle>
            <CardDescription>Statistical breakdown of resident population</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-600 text-sm">Male Residents</p>
                  <p className="text-2xl font-bold">{dashboardStats.maleResidents}</p>
                  <p className="text-xs text-gray-500">{Math.round((dashboardStats.maleResidents / dashboardStats.totalResidents) * 100)}% of total</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg">
                  <p className="text-pink-600 text-sm">Female Residents</p>
                  <p className="text-2xl font-bold">{dashboardStats.femaleResidents}</p>
                  <p className="text-xs text-gray-500">{Math.round((dashboardStats.femaleResidents / dashboardStats.totalResidents) * 100)}% of total</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
                <div className="space-y-2">
                  {dashboardStats.ageGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{group.label} years</span>
                        <span>{group.value} residents</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-baranex-primary h-2 rounded-full" 
                          style={{ width: `${(group.value / dashboardStats.totalResidents) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto" asChild>
              <a href="/statistics">
                View detailed statistics
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
