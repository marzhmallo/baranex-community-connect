
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const FeedbackPage = () => {
  const { userProfile } = useAuth();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['feedback-reports', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('feedback_reports')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.brgyid
  });

  const updateFeedbackStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('feedback_reports')
      .update({ status })
      .eq('id', id);

    if (!error) {
      // Refetch data
    }
  };

  const barangayReports = feedback?.filter(f => f.type === 'barangay') || [];
  const systemReports = feedback?.filter(f => f.type === 'system') || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-3xl font-bold">Feedback & Reports Management</h1>
          <p className="text-muted-foreground">Manage and respond to community feedback and system reports</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedback?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              All submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback?.filter(f => f.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedback?.filter(f => f.status === 'resolved').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed cases
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="barangay">Barangay Issues</TabsTrigger>
          <TabsTrigger value="system">System Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : feedback && feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.type === 'barangay' ? 'default' : 'secondary'}>
                            {item.type === 'barangay' ? 'Barangay Issue' : 'System Issue'}
                          </Badge>
                          <Badge variant={
                            item.status === 'pending' ? 'secondary' :
                            item.status === 'resolved' ? 'default' : 'outline'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{item.category}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex gap-2">
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateFeedbackStatus(item.id, 'in_progress')}
                          >
                            Mark In Progress
                          </Button>
                        )}
                        {(item.status === 'pending' || item.status === 'in_progress') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reports submitted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barangay" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Barangay Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : barangayReports && barangayReports.length > 0 ? (
                <div className="space-y-4">
                  {barangayReports.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="default">Barangay Issue</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{item.category}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex gap-2">
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateFeedbackStatus(item.id, 'in_progress')}
                          >
                            Mark In Progress
                          </Button>
                        )}
                        {(item.status === 'pending' || item.status === 'in_progress') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No barangay issues reported yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : systemReports && systemReports.length > 0 ? (
                <div className="space-y-4">
                  {systemReports.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary">System Issue</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{item.category}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <div className="flex gap-2">
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateFeedbackStatus(item.id, 'in_progress')}
                          >
                            Mark In Progress
                          </Button>
                        )}
                        {(item.status === 'pending' || item.status === 'in_progress') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No system issues reported yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedbackPage;
