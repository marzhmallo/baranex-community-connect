
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, MessageSquare, FileText, Filter, BarChart3, Users, CheckCircle, Clock, AlertTriangle, Plus, Upload, Download, TrendingUp, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { feedbackAPI } from '@/lib/api/feedback';
import { FeedbackReport, FeedbackType, FeedbackStatus, STATUS_COLORS } from '@/lib/types/feedback';

const SUPABASE_URL = "https://dssjspakagyerrmtaakm.supabase.co";

const FeedbackPage = () => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null);
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: reports, isLoading, refetch } = useQuery({
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

  const handleStatusUpdate = async (reportId: string, newStatus: FeedbackStatus) => {
    setIsUpdating(true);
    try {
      await feedbackAPI.updateReportStatus(reportId, newStatus, adminNotes);
      toast({
        title: "Status updated",
        description: `Report status changed to ${newStatus}`
      });
      refetch();
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => (
    <Badge className={STATUS_COLORS[status]}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );

  const getTypeBadge = (type: FeedbackType) => (
    <Badge variant={type === 'barangay' ? 'default' : 'secondary'}>
      {type === 'barangay' ? 'Barangay Issue' : 'System Issue'}
    </Badge>
  );

  // Calculate stats from reports
  const totalReports = reports?.length || 0;
  const pendingReports = reports?.filter(r => r.status === 'pending').length || 0;
  const resolvedReports = reports?.filter(r => r.status === 'resolved').length || 0;
  const inProgressReports = reports?.filter(r => r.status === 'in_progress').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Barangay Feedback & Reports</h1>
          <p className="text-gray-600">Manage community feedback and issue reports efficiently</p>
        </div>

        {/* Stats Cards */}
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
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Reports Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Recent Reports & Feedback</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-64"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  
                  <Select value={filterType} onValueChange={(value: FeedbackType | 'all') => setFilterType(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="barangay">Barangay</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={(value: FeedbackStatus | 'all') => setFilterStatus(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reports Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports?.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">{report.user_name}</div>
                        </TableCell>
                        <TableCell>{getTypeBadge(report.type)}</TableCell>
                        <TableCell>{report.category}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setAdminNotes(report.admin_notes || '');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Report Details</DialogTitle>
                              </DialogHeader>
                              {selectedReport && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <strong>Reporter:</strong> {selectedReport.user_name}
                                    </div>
                                    <div>
                                      <strong>Type:</strong> {getTypeBadge(selectedReport.type)}
                                    </div>
                                    <div>
                                      <strong>Category:</strong> {selectedReport.category}
                                    </div>
                                    <div>
                                      <strong>Status:</strong> {getStatusBadge(selectedReport.status)}
                                    </div>
                                  </div>

                                  {selectedReport.location && (
                                    <div>
                                      <strong>Location:</strong> {selectedReport.location}
                                    </div>
                                  )}

                                  <div>
                                    <strong>Description:</strong>
                                    <p className="mt-2 p-3 bg-gray-50 rounded">{selectedReport.description}</p>
                                  </div>

                                  {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                                    <div>
                                      <strong>Attachments:</strong>
                                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedReport.attachments.map((attachment, index) => {
                                          const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/reportfeedback/userreports/${attachment}`;
                                          return (
                                            <div key={index} className="relative group">
                                              <img
                                                src={imageUrl}
                                                alt={`Attachment ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg border"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.style.display = 'none';
                                                  const fallback = target.nextElementSibling as HTMLElement;
                                                  if (fallback) fallback.style.display = 'flex';
                                                }}
                                              />
                                              <div className="hidden w-full aspect-square bg-gray-100 rounded-lg items-center justify-center border">
                                                <div className="text-center p-2">
                                                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                                  <span className="text-xs text-gray-600">{attachment}</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <strong>Admin Notes:</strong>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes for this report..."
                                      className="mt-2"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    {selectedReport.status === 'pending' && (
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedReport.id, 'in_progress')}
                                        disabled={isUpdating}
                                      >
                                        Mark In Progress
                                      </Button>
                                    )}
                                    {(selectedReport.status === 'pending' || selectedReport.status === 'in_progress') && (
                                      <>
                                        <Button
                                          onClick={() => handleStatusUpdate(selectedReport.id, 'resolved')}
                                          disabled={isUpdating}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Mark Resolved
                                        </Button>
                                        <Button
                                          onClick={() => handleStatusUpdate(selectedReport.id, 'rejected')}
                                          disabled={isUpdating}
                                          variant="destructive"
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                  <Plus className="text-blue-600 group-hover:scale-110 transition-transform h-5 w-5" />
                  <span className="text-blue-700 font-medium flex-1 text-left">Create New Report</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">New</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                  <Upload className="text-green-600 group-hover:scale-110 transition-transform h-5 w-5" />
                  <span className="text-green-700 font-medium flex-1 text-left">Import Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                  <Download className="text-purple-600 group-hover:scale-110 transition-transform h-5 w-5" />
                  <span className="text-purple-700 font-medium flex-1 text-left">Export Data</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
                  <BarChart3 className="text-orange-600 group-hover:scale-110 transition-transform h-5 w-5" />
                  <span className="text-orange-700 font-medium flex-1 text-left">View Analytics</span>
                </button>
              </div>
            </div>

            {/* Report Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Categories</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-red-600 h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">Infrastructure</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    {reports?.filter(r => r.category.includes('Road') || r.category.includes('Street') || r.category.includes('Water')).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="text-green-600 h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">Environment</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    {reports?.filter(r => r.category.includes('Garbage') || r.category.includes('Drainage')).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="text-blue-600 h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">Safety & Security</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    {reports?.filter(r => r.category.includes('Safety') || r.category.includes('Noise')).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="text-purple-600 h-4 w-4" />
                    </div>
                    <span className="text-gray-700 font-medium">Community</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    {reports?.filter(r => r.type === 'system').length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Officers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Officers</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="text-blue-600 h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">John Santos</p>
                    <p className="text-sm text-gray-500">Infrastructure Officer</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="text-green-600 h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Maria Rodriguez</p>
                    <p className="text-sm text-gray-500">Environment Officer</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="text-purple-600 h-5 w-5" />
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
    </div>
  );
};

export default FeedbackPage;
