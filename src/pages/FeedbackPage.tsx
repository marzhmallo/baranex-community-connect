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
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Barangay Feedback & Reports</h1>
          <p className="text-gray-600">Manage community feedback and issue reports efficiently</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Reports</p>
                <p className="text-2xl font-bold text-gray-800">{totalReports}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{pendingReports}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedReports}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressReports}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Timer className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Reports & Feedback</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <input type="text" placeholder="Search reports..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                  </div>
                  <details className="relative">
                    <summary className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <Filter className="h-4 w-4" />
                      Filter
                    </summary>
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                      <div className="p-3">
                        <label className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Pending</span>
                        </label>
                        <label className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">In Progress</span>
                        </label>
                        <label className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Resolved</span>
                        </label>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Street Light Not Working</h3>
                        <p className="text-sm text-gray-500">Purok 3, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Pending</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">The street light in front of house #45 has been out for 3 days. This creates safety concerns for residents walking at night.</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <img src="https://images.unsplash.com/photo-1617859047452-8510bcf207fd" alt="Street light photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <img src="https://images.unsplash.com/photo-1628624747186-a941c476b7ef" alt="Street light photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Reported by: Maria Santos</span>
                      <span>2 hours ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Assign
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Excellent Garbage Collection Service</h3>
                        <p className="text-sm text-gray-500">Purok 1, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Positive Feedback</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">I want to commend the garbage collection team for their consistent and timely service. Our area is always clean thanks to their efforts.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Feedback by: Juan Dela Cruz</span>
                      <span>5 hours ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Acknowledge
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        Share
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Construction className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Road Repair Request</h3>
                        <p className="text-sm text-gray-500">Main Road, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">In Progress</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Large potholes on the main road are causing damage to vehicles. Road repair is urgently needed.</p>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    <div className="relative group h-16 w-28 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Play className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <img src="https://images.unsplash.com/photo-1636367167117-1c584316f6eb" alt="Pothole photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                    <div className="relative group h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <img src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2" alt="Pothole photo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Reported by: Carlos Reyes</span>
                      <span>1 day ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Update Status
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        View Progress
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Volume2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Noise Complaint</h3>
                        <p className="text-sm text-gray-500">Purok 2, Barangay San Miguel</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">Pending</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Loud music from a nearby establishment is disturbing residents during late hours. Please investigate.</p>
                  <div className="mt-3 flex gap-2">
                    <div className="relative group h-16 w-28 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Mic className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <Play className="h-4 w-4 text-white scale-0 group-hover:scale-100 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Reported by: Anna Garcia</span>
                      <span>3 hours ago</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Investigate
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        Contact Reporter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Load More Reports
                </button>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Analytics Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Reports by Category</h3>
                  <div className="h-[240px] w-full">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Monthly Report Trends</h3>
                  <div className="h-[240px] w-full">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="reports" stroke="#3B82F6" strokeWidth={3} />
                          <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Resolution Time (Days)</h3>
                  <div className="h-[240px] w-full">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resolutionTimeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="days" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4 h-[300px]">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Feedback Sentiment</h3>
                  <div className="h-[240px] w-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-2xl font-bold text-green-600">68%</span>
                          </div>
                          <p className="text-sm text-gray-600">Positive</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-2xl font-bold text-yellow-600">22%</span>
                          </div>
                          <p className="text-sm text-gray-600">Neutral</p>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-2xl font-bold text-red-600">10%</span>
                          </div>
                          <p className="text-sm text-gray-600">Negative</p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-gray-700">Total: 145 Feedback</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                  <PlusCircle className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-purple-700 font-medium flex-1 text-left">Create New Report</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">New</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                  <Upload className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-blue-700 font-medium flex-1 text-left">Import Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                  <Download className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="text-green-700 font-medium flex-1 text-left">Export Data</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
                  <BarChart3 className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                  <span className="text-orange-700 font-medium flex-1 text-left">View Analytics</span>
                </button>
                
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Infrastructure</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">45</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Trees className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Environment</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">32</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Safety & Security</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">28</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Community</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">21</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-yellow-600" />
                    </div>
                    <span className="text-gray-700 font-medium">General Feedback</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">19</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Officers</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">John Santos</p>
                    <p className="text-sm text-gray-500">Infrastructure Officer</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Maria Rodriguez</p>
                    <p className="text-sm text-gray-500">Environment Officer</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Robert Lopez</p>
                    <p className="text-sm text-gray-500">Safety Officer</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default FeedbackPage;