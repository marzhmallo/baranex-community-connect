import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { feedbackAPI } from '@/lib/api/feedback';
import { FeedbackReport, FeedbackType, FeedbackStatus } from '@/lib/types/feedback';
import { FileText, Clock, CheckCircle, Timer, Search, Filter, AlertTriangle, ThumbsUp, Construction, Volume2, ZoomIn, Play, PlusCircle, Upload, Download, BarChart3, Smartphone, Trees, Shield, Users, MessageSquare, User, Mic } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from 'recharts';
const SUPABASE_URL = "https://dssjspakagyerrmtaakm.supabase.co";
const FeedbackPage = () => {
  const {
    userProfile
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const {
    data: reports,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['feedback-reports', userProfile?.brgyid, filterType, filterStatus, searchTerm],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      const filters: any = {};
      if (filterType !== 'all') filters.type = filterType;
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (searchTerm) filters.search = searchTerm;
      return await feedbackAPI.getAllReports(userProfile.brgyid, filters);
    },
    enabled: !!userProfile?.brgyid
  });

  // Calculate stats from reports
  const totalReports = reports?.length || 0;
  const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;
  const resolvedReports = reports?.filter(r => r.status === 'resolved').length || 0;
  const inProgressReports = reports?.filter(r => r.status === 'in_progress').length || 0;

  // Chart data
  const categoryData = [{
    name: 'Infrastructure',
    value: 45,
    color: '#EF4444'
  }, {
    name: 'Environment',
    value: 32,
    color: '#10B981'
  }, {
    name: 'Safety & Security',
    value: 28,
    color: '#3B82F6'
  }, {
    name: 'Community',
    value: 21,
    color: '#8B5CF6'
  }, {
    name: 'General Feedback',
    value: 19,
    color: '#F59E0B'
  }];
  const monthlyData = [{
    month: 'Jan',
    reports: 35,
    resolved: 25
  }, {
    month: 'Feb',
    reports: 41,
    resolved: 31
  }, {
    month: 'Mar',
    reports: 36,
    resolved: 31
  }, {
    month: 'Apr',
    reports: 26,
    resolved: 24
  }, {
    month: 'May',
    reports: 45,
    resolved: 32
  }, {
    month: 'Jun',
    reports: 48,
    resolved: 39
  }, {
    month: 'Jul',
    reports: 52,
    resolved: 42
  }, {
    month: 'Aug',
    reports: 53,
    resolved: 39
  }, {
    month: 'Sep',
    reports: 41,
    resolved: 35
  }, {
    month: 'Oct',
    reports: 30,
    resolved: 30
  }, {
    month: 'Nov',
    reports: 32,
    resolved: 28
  }, {
    month: 'Dec',
    reports: 34,
    resolved: 29
  }];
  const resolutionTimeData = [{
    category: 'Infrastructure',
    days: 4.3
  }, {
    category: 'Environment',
    days: 2.1
  }, {
    category: 'Safety',
    days: 5.8
  }, {
    category: 'Community',
    days: 3.2
  }, {
    category: 'General',
    days: 1.9
  }];
  const sentimentData = [{
    name: 'Positive',
    value: 68,
    color: '#10B981'
  }, {
    name: 'Neutral',
    value: 22,
    color: '#F59E0B'
  }, {
    name: 'Negative',
    value: 10,
    color: '#EF4444'
  }];
  const chartConfig = {
    reports: {
      label: "Reports",
      color: "#3B82F6"
    },
    resolved: {
      label: "Resolved",
      color: "#10B981"
    },
    days: {
      label: "Days",
      color: "#3B82F6"
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="w-full bg-background p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Barangay Feedback & Reports</h1>
          <p className="text-muted-foreground">Manage community feedback and issue reports efficiently</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Reports</p>
                <p className="text-2xl font-bold text-foreground">{totalReports}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingReports}</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{resolvedReports}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressReports}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-foreground">Recent Reports & Feedback</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <input type="text" placeholder="Search reports..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  </div>
                  <details className="relative">
                    <summary className="flex items-center gap-2 px-4 py-2 bg-muted border border-border text-foreground rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                      <Filter className="h-4 w-4" />
                      Filter
                    </summary>
                    <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-48">
                      <div className="p-3">
                        <label className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted rounded px-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm text-foreground">Pending</span>
                        </label>
                        <label className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted rounded px-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm text-foreground">In Progress</span>
                        </label>
                        <label className="flex items-center gap-2 py-2 cursor-pointer hover:bg-muted rounded px-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm text-foreground">Resolved</span>
                        </label>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-border bg-card rounded-lg p-4 hover:border-border/80 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Street Light Not Working</h3>
                        <p className="text-sm text-muted-foreground">Purok 3, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">Pending</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">The street light in front of house #45 has been out for 3 days. This creates safety concerns for residents walking at night.</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-border">
                      <img src="https://images.unsplash.com/photo-1617859047452-8510bcf207fd" alt="Street light photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-border">
                      <img src="https://images.unsplash.com/photo-1628624747186-a941c476b7ef" alt="Street light photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Reported by: Maria Santos</span>
                      <span>2 hours ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">
                        Assign
                      </button>
                      <button className="px-3 py-1 bg-muted text-foreground text-sm rounded-lg hover:bg-muted/80 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card rounded-lg p-4 hover:border-border/80 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Excellent Garbage Collection Service</h3>
                        <p className="text-sm text-muted-foreground">Purok 1, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">Positive Feedback</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">I want to commend the garbage collection team for their consistent and timely service. Our area is always clean thanks to their efforts.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Feedback by: Juan Dela Cruz</span>
                      <span>5 hours ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Acknowledge
                      </button>
                      <button className="px-3 py-1 bg-muted text-foreground text-sm rounded-lg hover:bg-muted/80 transition-colors">
                        Share
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card rounded-lg p-4 hover:border-border/80 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Construction className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Road Repair Request</h3>
                        <p className="text-sm text-muted-foreground">Main Road, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">In Progress</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">Large potholes on the main road are causing damage to vehicles. Road repair is urgently needed.</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    <div className="relative group h-16 w-28 flex-shrink-0 rounded-md overflow-hidden border border-border">
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-border">
                      <img src="https://images.unsplash.com/photo-1636367167117-1c584316f6eb" alt="Pothole photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-border">
                      <img src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2" alt="Pothole photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Reported by: Carlos Reyes</span>
                      <span>1 day ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">
                        Update Status
                      </button>
                      <button className="px-3 py-1 bg-muted text-foreground text-sm rounded-lg hover:bg-muted/80 transition-colors">
                        View Progress
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card rounded-lg p-4 hover:border-border/80 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Volume2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Noise Complaint</h3>
                        <p className="text-sm text-muted-foreground">Purok 2, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">Pending</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">Loud music from a nearby establishment is disturbing residents during late hours. Please investigate.</p>
                  <div className="mt-3 flex gap-2">
                    <div className="relative group h-16 w-28 flex-shrink-0 rounded-md overflow-hidden border border-border">
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Mic className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Reported by: Anna Garcia</span>
                      <span>3 hours ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors">
                        Investigate
                      </button>
                      <button className="px-3 py-1 bg-muted text-foreground text-sm rounded-lg hover:bg-muted/80 transition-colors">
                        Contact Reporter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                  Load More Reports
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group">
                  <PlusCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-purple-700 dark:text-purple-300 font-medium flex-1 text-left">Create New Report</span>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">New</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group">
                  <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-blue-700 dark:text-blue-300 font-medium flex-1 text-left">Import Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group">
                  <Download className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-green-700 dark:text-green-300 font-medium flex-1 text-left">Export Data</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors group">
                  <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                  <span className="text-orange-700 dark:text-orange-300 font-medium flex-1 text-left">View Analytics</span>
                </button>
                
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Report Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-foreground font-medium">Infrastructure</span>
                  </div>
                  <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">45</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Trees className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-foreground font-medium">Environment</span>
                  </div>
                  <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">32</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-foreground font-medium">Safety & Security</span>
                  </div>
                  <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">28</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-foreground font-medium">Community</span>
                  </div>
                  <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">21</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-foreground font-medium">General Feedback</span>
                  </div>
                  <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">19</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Assigned Officers</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">John Santos</p>
                    <p className="text-sm text-muted-foreground">Infrastructure Officer</p>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Maria Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Environment Officer</p>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Robert Lopez</p>
                    <p className="text-sm text-muted-foreground">Safety Officer</p>
                  </div>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard - Enlarged monthly trends and resolution time charts */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 mt-8 w-full">
          <h2 className="text-2xl font-semibold text-foreground mb-8">Analytics Dashboard</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-muted/30 rounded-xl border border-border p-6 h-[350px]">
              <h3 className="text-lg font-semibold text-foreground mb-4">Reports by Category</h3>
              <div className="h-[270px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <ChartTooltip content={({
                      active,
                      payload
                    }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return <div className="bg-card p-3 shadow-lg rounded-lg border border-border">
                                <p className="font-semibold text-foreground">{data.name}</p>
                                <p className="text-sm text-muted-foreground">{data.value} reports</p>
                              </div>;
                      }
                      return null;
                    }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-xl border border-border p-6 h-[450px]">
              <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Report Trends</h3>
              <div className="h-[370px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20
                  }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{
                      fontSize: 12,
                      fill: 'hsl(var(--muted-foreground))'
                    }} axisLine={{
                      stroke: 'hsl(var(--border))'
                    }} />
                      <YAxis tick={{
                      fontSize: 12,
                      fill: 'hsl(var(--muted-foreground))'
                    }} axisLine={{
                      stroke: 'hsl(var(--border))'
                    }} />
                      <ChartTooltip content={({
                      active,
                      payload,
                      label
                    }) => {
                      if (active && payload && payload.length) {
                        return <div className="bg-card p-3 shadow-lg rounded-lg border border-border">
                                <p className="font-semibold text-foreground mb-2">{label}</p>
                                {payload.map((entry, index) => <p key={index} className="text-sm" style={{
                            color: entry.color
                          }}>
                                    {entry.name}: {entry.value}
                                  </p>)}
                              </div>;
                      }
                      return null;
                    }} />
                      <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={3} dot={{
                      fill: '#3B82F6',
                      strokeWidth: 2,
                      r: 4
                    }} name="Total Reports" />
                      <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} dot={{
                      fill: '#10B981',
                      strokeWidth: 2,
                      r: 4
                    }} name="Resolved" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-xl border border-border p-6 h-[450px]">
              <h3 className="text-lg font-semibold text-foreground mb-4">Avg Resolution Time (Days)</h3>
              <div className="h-[370px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resolutionTimeData} margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60
                  }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="category" tick={{
                      fontSize: 11,
                      fill: 'hsl(var(--muted-foreground))'
                    }} axisLine={{
                      stroke: 'hsl(var(--border))'
                    }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{
                      fontSize: 12,
                      fill: 'hsl(var(--muted-foreground))'
                    }} axisLine={{
                      stroke: 'hsl(var(--border))'
                    }} />
                      <ChartTooltip content={({
                      active,
                      payload,
                      label
                    }) => {
                      if (active && payload && payload.length) {
                        return <div className="bg-card p-3 shadow-lg rounded-lg border border-border">
                                <p className="font-semibold text-foreground">{label}</p>
                                <p className="text-sm text-muted-foreground">{payload[0].value} days avg</p>
                              </div>;
                      }
                      return null;
                    }} />
                      <Bar dataKey="days" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Resolution Time" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-xl border border-border p-6 h-[350px]">
              <h3 className="text-lg font-semibold text-foreground mb-4">Feedback Sentiment</h3>
              <div className="h-[190px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                        {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <ChartTooltip content={({
                      active,
                      payload
                    }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return <div className="bg-card p-3 shadow-lg rounded-lg border border-border">
                                <p className="font-semibold text-foreground">{data.name}</p>
                                <p className="text-sm text-muted-foreground">{data.value}%</p>
                              </div>;
                      }
                      return null;
                    }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="mt-3">
                <div className="grid grid-cols-1 gap-2">
                  {sentimentData.map((item, index) => <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: item.color
                    }}></div>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold">{item.value}%</span>
                    </div>)}
                </div>
                <div className="mt-3 pt-2 border-t border-border">
                  <p className="text-center text-xs text-muted-foreground">Total: 145 responses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default FeedbackPage;