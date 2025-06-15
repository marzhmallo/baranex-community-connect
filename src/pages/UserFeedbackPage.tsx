
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquare, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { feedbackAPI } from '@/lib/api/feedback';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackReport, FeedbackStatus, STATUS_COLORS } from '@/lib/types/feedback';

const SUPABASE_URL = "https://dssjspakagyerrmtaakm.supabase.co";

const UserFeedbackPage = () => {
  const { userProfile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<FeedbackReport | null>(null);
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['user-feedback-reports', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      return await feedbackAPI.getUserReports(userProfile.id);
    },
    enabled: !!userProfile?.id,
  });

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await feedbackAPI.deleteReport(reportId);
      toast({
        title: "Report deleted",
        description: "Your report has been deleted successfully"
      });
      refetch();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => (
    <Badge className={STATUS_COLORS[status]}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );

  const canEdit = (report: FeedbackReport) => report.status === 'pending';

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
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground">Submit and track your feedback and issue reports</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {showForm && (
        <FeedbackForm
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingReport && (
        <FeedbackForm
          editData={editingReport}
          onSuccess={() => {
            setEditingReport(null);
            refetch();
          }}
          onCancel={() => setEditingReport(null)}
        />
      )}

      {!showForm && !editingReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Your Reports ({reports?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports?.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-4">
                  Submit your first report to get started
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reports?.map((report) => (
                  <Card key={report.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={report.type === 'barangay' ? 'default' : 'secondary'}>
                              {report.type === 'barangay' ? 'Barangay Issue' : 'System Issue'}
                            </Badge>
                            {getStatusBadge(report.status)}
                          </div>
                          <h3 className="font-semibold mb-1">{report.category}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Submitted {new Date(report.created_at).toLocaleDateString()}</span>
                            {report.location && <span>📍 {report.location}</span>}
                            {report.attachments && report.attachments.length > 0 && (
                              <span>📎 {report.attachments.length} attachments</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
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
                                  <div className="flex items-center gap-2">
                                    <Badge variant={selectedReport.type === 'barangay' ? 'default' : 'secondary'}>
                                      {selectedReport.type === 'barangay' ? 'Barangay Issue' : 'System Issue'}
                                    </Badge>
                                    {getStatusBadge(selectedReport.status)}
                                  </div>

                                  <div>
                                    <strong>Category:</strong> {selectedReport.category}
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

                                  {selectedReport.admin_notes && (
                                    <div>
                                      <strong>Admin Response:</strong>
                                      <p className="mt-2 p-3 bg-blue-50 rounded">{selectedReport.admin_notes}</p>
                                    </div>
                                  )}

                                  <div className="text-sm text-muted-foreground">
                                    <div>Submitted: {new Date(selectedReport.created_at).toLocaleString()}</div>
                                    <div>Last updated: {new Date(selectedReport.updated_at).toLocaleString()}</div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {canEdit(report) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingReport(report)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {canEdit(report) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserFeedbackPage;
