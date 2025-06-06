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
import { Search, Eye, MessageSquare, FileText, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { feedbackAPI } from '@/lib/api/feedback';
import { FeedbackReport, FeedbackType, FeedbackStatus, STATUS_COLORS } from '@/lib/types/feedback';
import { supabase } from '@/integrations/supabase/client';

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
    enabled: !!userProfile?.brgyid,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback & Reports</h1>
          <p className="text-muted-foreground">Manage community feedback and issue reports</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reports Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
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
                                        const imageUrl = `${supabase.supabaseUrl}/storage/v1/object/public/reportfeedback/userreports/${attachment}`;
                                        return (
                                          <div key={index} className="relative group">
                                            <img
                                              src={imageUrl}
                                              alt={`Attachment ${index + 1}`}
                                              className="w-full aspect-square object-cover rounded-lg border"
                                              onError={(e) => {
                                                // Fallback to filename display if image fails to load
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
                                        Resolve
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
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPage;
