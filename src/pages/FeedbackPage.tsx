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
    queryKey: ['feedback', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('feedback')
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
      .from('feedback')
      .update({ status })
      .eq('id', id);

    if (!error) {
      // Refetch data
    }
  };

  const suggestions = feedback?.filter(f => f.type === 'suggestion') || [];
  const complaints = feedback?.filter(f => f.type === 'complaint') || [];
  const reports = feedback?.filter(f => f.type === 'report') || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-teal-600" />
        <div>
          <h1 className="text-3xl font-bold">Feedback & Reports</h1>
          <p className="text-muted-foreground">Manage community feedback, suggestions, and incident reports</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Feedback</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Feedback Submissions</CardTitle>
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
                          <Badge variant={
                            item.type === 'complaint' ? 'destructive' :
                            item.type === 'report' ? 'secondary' : 'default'
                          }>
                            {item.type}
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
                      <h3 className="font-medium mb-1">{item.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.message}</p>
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
                  <p className="text-muted-foreground">No feedback submissions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similar structure for other tabs... */}
        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Suggestions</CardTitle>
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
              ) : suggestions && suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="default">suggestion</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{item.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.message}</p>
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
                  <p className="text-muted-foreground">No suggestions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Complaints</CardTitle>
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
              ) : complaints && complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="destructive">complaint</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{item.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.message}</p>
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
                  <p className="text-muted-foreground">No complaints yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
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
              ) : reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary">report</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{item.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.message}</p>
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
                  <p className="text-muted-foreground">No incident reports yet.</p>
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
