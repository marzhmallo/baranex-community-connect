import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import LocalizedLoadingScreen from "@/components/ui/LocalizedLoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DocumentIssueForm from "@/components/documents/DocumentIssueForm";
import DocumentRequestModal from "./DocumentRequestModal";
import { FileText, Clock, CheckCircle, BarChart3, Package, Hourglass, Eye, XCircle, TrendingUp, Search, Plus, Filter, Download, Edit, Trash2, RefreshCw, FileX, History, PlusCircle, Bell, Upload, ArrowRight, Settings, MoreHorizontal, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const UserDocumentsPage = () => {
  // All existing state management preserved
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("All Documents");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define the enriched request type
  type EnrichedDocumentRequest = {
    id: string;
    resident_id: string;
    type: string;
    status: string;
    purpose: string;
    docnumber: string;
    created_at: string;
    updated_at: string;
    amount?: number;
    method?: string;
    notes?: string;
    receiver?: any;
    profiles?: {
      id: string;
      firstname: string;
      lastname: string;
    } | null;
  } & Record<string, any>;

  // Initial data fetch with master loading state
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [documentsData, requestsData] = await Promise.all([
          // Fetch document types
          supabase.from('document_types').select('*').order('name'),
          // Fetch user's document requests
          userProfile?.id ? supabase.from('docrequests').select('*').eq('resident_id', userProfile.id).order('created_at', { ascending: false }) : { data: [], error: null }
        ]);

        // Initial loading is complete
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsInitialLoading(false);
      }
    };

    if (userProfile?.id) {
      fetchAllData();
    } else {
      // If no user profile, still set loading to false
      setIsInitialLoading(false);
    }
  }, [userProfile?.id]);

  // Fetch user's document requests from Supabase with real-time updates
  const { data: documentRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['user-document-requests', userProfile?.id],
    queryFn: async (): Promise<EnrichedDocumentRequest[]> => {
      if (!userProfile?.id) return [];

      // First get all document requests for the user
      const { data: requests, error: requestsError } = await supabase
        .from('docrequests')
        .select('*')
        .eq('resident_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      if (!requests || requests.length === 0) return [];

      // Get all unique resident IDs from the requests
      const residentIds = [...new Set(requests.map(req => req.resident_id))];

      // Fetch profile data for all resident IDs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, firstname, lastname')
        .in('id', residentIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Still return requests even if profile fetch fails, just without profile data
        return requests.map(request => ({
          ...request,
          profiles: null
        }));
      }

      // Create a map of profile data for quick lookup
      const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine requests with profile data
      const enrichedRequests: EnrichedDocumentRequest[] = requests.map(request => ({
        ...request,
        profiles: profileMap[request.resident_id] || null
      }));

      return enrichedRequests;
    },
    enabled: !!userProfile?.id
  });

  // Set up real-time subscription for user document requests
  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel('user-document-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'docrequests',
          filter: `resident_id=eq.${userProfile.id}`
        },
        () => {
          // Refetch user's document requests when changes occur
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, refetch]);

  // Fetch document types from Supabase
  const { data: documentTypes = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(documentTypes.length / itemsPerPage);
  const requestsPerPage = 4;

  // Filter document requests based on tracking filter and search query
  const getFilteredRequests = () => {
    let filteredByStatus = documentRequests;

    // Apply status filter
    if (trackingFilter !== "All Documents") {
      filteredByStatus = documentRequests.filter(request => {
        const status = request.status.toLowerCase();
        switch (trackingFilter) {
          case "Requests":
            return status === "request" || status === "pending";
          case "Processing":
            return status === "processing" || status === "pending" || status === "for review";
          case "Released":
            return status === "released" || status === "completed";
          case "Rejected":
            return status === "rejected";
          case "Ready":
            return status === "ready for pickup" || status === "ready" || status === "approved";
          default:
            return true;
        }
      });
    }

    // Apply search filter by tracking ID
    if (trackingSearchQuery.trim()) {
      filteredByStatus = filteredByStatus.filter(request =>
        request.docnumber?.toLowerCase().includes(trackingSearchQuery.toLowerCase())
      );
    }

    return filteredByStatus;
  };

  const filteredRequests = getFilteredRequests();
  const requestsTotalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  // Calculate paginated data using real Supabase data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = documentTypes.slice(startIndex, endIndex);

  // Calculate paginated document requests
  const requestsStartIndex = (requestsCurrentPage - 1) * requestsPerPage;
  const requestsEndIndex = requestsStartIndex + requestsPerPage;
  const paginatedRequests = filteredRequests.slice(requestsStartIndex, requestsEndIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRequestsPageChange = (page: number) => {
    if (page >= 1 && page <= requestsTotalPages) {
      setRequestsCurrentPage(page);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-50">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-50">Processing</Badge>;
      case 'for review':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-50">For Review</Badge>;
      case 'approved':
      case 'ready for pickup':
      case 'completed':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 hover:bg-green-50">Ready for Pickup</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 hover:bg-red-50">Rejected</Badge>;
      case 'released':
        return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-50">Released</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function for case-insensitive status matching
  const matchesStatus = (requestStatus: string, targetStatus: string): boolean => {
    return requestStatus.toLowerCase() === targetStatus.toLowerCase();
  };

  // Helper function for case-insensitive multiple status matching
  const matchesAnyStatus = (requestStatus: string, targetStatuses: string[]): boolean => {
    return targetStatuses.some(status => matchesStatus(requestStatus, status));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isInitialLoading) {
    return <LocalizedLoadingScreen isLoading={isInitialLoading} />;
  }

  return (
    <div className="w-full p-4 md:p-6 bg-background min-h-screen">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Documents</h1>
        <p className="text-sm text-muted-foreground">Manage your official document requests.</p>
      </header>

      {/* Status Overview */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Status Overview</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['user-document-requests'] }),
                  queryClient.invalidateQueries({ queryKey: ['document-types'] })
                ]);
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* On mobile: horizontal scroll, On desktop: grid */}
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:grid md:grid-cols-5 md:overflow-visible md:p-0 md:m-0">
          <Card className="flex-shrink-0 w-36 md:w-auto text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-primary">
                {documentRequests.filter(req => req.status.toLowerCase() === 'pending').length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="flex-shrink-0 w-36 md:w-auto text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-primary">
                {documentRequests.filter(req => req.status.toLowerCase() === 'processing').length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card className="flex-shrink-0 w-36 md:w-auto text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-primary">
                {documentRequests.filter(req => matchesAnyStatus(req.status, ['ready', 'ready for pickup', 'approved'])).length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Ready</p>
            </CardContent>
          </Card>
          <Card className="flex-shrink-0 w-36 md:w-auto text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-primary">
                {documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed'])).length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Released</p>
            </CardContent>
          </Card>
          <Card className="flex-shrink-0 w-36 md:w-auto text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-primary">
                {documentRequests.filter(req => req.status.toLowerCase() === 'rejected').length}
              </p>
              <p className="text-xs font-medium text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Document Tracking Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Document Tracking System</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search by tracking ID..." 
                    className="pl-10"
                    value={trackingSearchQuery}
                    onChange={(e) => setTrackingSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {['All Documents', 'Requests', 'Processing', 'Ready', 'Released', 'Rejected'].map((filter) => (
                    <Button
                      key={filter}
                      variant={trackingFilter === filter ? "default" : "outline"}
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => setTrackingFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              {/* --- RESPONSIVE CONTENT SWAP --- */}

              {/* Mobile Card View (hidden on medium screens and up) */}
              <div className="md:hidden space-y-3">
                {paginatedRequests.map(request => (
                  <Card 
                    key={request.id} 
                    className="w-full max-w-md bg-muted/50 hover:bg-muted cursor-pointer"
                    onClick={() => { 
                      setSelectedRequest(request); 
                      setShowViewDialog(true); 
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{request.type}</p>
                          <p className="text-xs font-mono text-primary">{request.docnumber}</p>
                        </div>
                        <div className="ml-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground border-t border-border pt-2">
                        Last Update: {formatDate(request.updated_at || request.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View (hidden on small screens) */}
              <div className="hidden md:block border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Tracking ID</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Document</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-left text-xs font-medium text-muted-foreground">Last Updated</th>
                      <th className="p-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map(request => (
                      <tr key={request.id} className="border-t border-border hover:bg-accent/5">
                        <td className="p-3 font-mono text-sm text-primary">{request.docnumber}</td>
                        <td className="p-3 text-sm">{request.type}</td>
                        <td className="p-3">{getStatusBadge(request.status)}</td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDate(request.updated_at || request.created_at)}</td>
                        <td className="p-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { 
                              setSelectedRequest(request); 
                              setShowViewDialog(true); 
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {requestsTotalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handleRequestsPageChange(requestsCurrentPage - 1)}
                          className={requestsCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: requestsTotalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handleRequestsPageChange(page)}
                            isActive={requestsCurrentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handleRequestsPageChange(requestsCurrentPage + 1)}
                          className={requestsCurrentPage === requestsTotalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Document Library Section */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Document Library</CardTitle>
                <Button 
                  onClick={() => setShowRequestModal(true)}
                  className="hidden md:flex"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search documents..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Document Templates Grid - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTemplates
                  .filter(doc => 
                    searchQuery === "" || 
                    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground mb-1 truncate">{doc.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {doc.description || "Official barangay document"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              ₱{doc.fee || 0}
                            </Badge>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedTemplate(doc);
                                setShowRequestModal(true);
                              }}
                            >
                              Request
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination for Document Library */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Floating Action Button (for mobile) */}
      <Button 
        onClick={() => setShowRequestModal(true)} 
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-10" 
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Document Request Modal */}
      {showRequestModal && (
        <DocumentRequestModal 
          onClose={() => {
            setShowRequestModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* View Request Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Request Details</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Complete information about your document request</p>
              </div>
            </div>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Current Status</h3>
                      <p className="text-sm text-muted-foreground">Track your request progress</p>
                    </div>
                  </div>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                
                {/* Status Description */}
                <div className="mt-3 p-3 bg-background rounded-md border border-border">
                  <p className="text-sm text-foreground">
                    {selectedRequest.status.toLowerCase() === 'pending' && 'Your request is being reviewed by the barangay office.'}
                    {selectedRequest.status.toLowerCase() === 'processing' && 'Your document is currently being processed.'}
                    {(selectedRequest.status.toLowerCase() === 'ready' || selectedRequest.status.toLowerCase() === 'approved') && 'Your document is ready for pickup at the barangay office.'}
                    {selectedRequest.status.toLowerCase() === 'released' && 'Your document has been successfully released.'}
                    {selectedRequest.status.toLowerCase() === 'rejected' && 'Your request has been rejected. Please check admin notes below.'}
                  </p>
                </div>
              </div>

              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Request Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-foreground">Tracking ID</Label>
                      </div>
                      <p className="text-lg font-mono font-semibold text-primary pl-6">{selectedRequest.docnumber}</p>
                    </div>
                    
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-foreground">Document Type</Label>
                      </div>
                      <p className="text-sm text-foreground pl-6">{selectedRequest.type}</p>
                    </div>
                    
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-foreground">Request Date</Label>
                      </div>
                      <p className="text-sm text-foreground pl-6">{formatDate(selectedRequest.created_at)}</p>
                    </div>
                    
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <History className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-foreground">Last Updated</Label>
                      </div>
                      <p className="text-sm text-foreground pl-6">{formatDate(selectedRequest.updated_at || selectedRequest.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment & Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Payment & Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-foreground">Amount</Label>
                      </div>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400 pl-6">₱{selectedRequest.amount || 0}</p>
                    </div>
                    
                    <div className="p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium text-foreground">Payment Method</Label>
                      </div>
                      <p className="text-sm text-foreground pl-6">{selectedRequest.method || 'Not specified'}</p>
                    </div>
                    
                    {selectedRequest.ornumber && (
                      <div className="p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium text-foreground">OR Number</Label>
                        </div>
                        <p className="text-sm font-mono text-foreground pl-6">{selectedRequest.ornumber}</p>
                      </div>
                    )}
                    
                    {selectedRequest.paydate && (
                      <div className="p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium text-foreground">Payment Date</Label>
                        </div>
                        <p className="text-sm text-foreground pl-6">{formatDate(selectedRequest.paydate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purpose Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Purpose</Label>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 pl-6 leading-relaxed">{selectedRequest.purpose}</p>
              </div>

              {/* Recipient Information */}
              {selectedRequest.receiver && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <Label className="text-sm font-medium text-green-800 dark:text-green-200">Recipient Information</Label>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 pl-6">
                    {typeof selectedRequest.receiver === 'object' ? selectedRequest.receiver.name : selectedRequest.receiver}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.notes && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">Administrative Notes</Label>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 pl-6 leading-relaxed">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Contact Information */}
              {(selectedRequest.email || selectedRequest['contact#']) && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <Label className="text-sm font-medium text-purple-800 dark:text-purple-200">Contact Information</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                    {selectedRequest.email && (
                      <div>
                        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300">Email</Label>
                        <p className="text-sm text-purple-600 dark:text-purple-300">{selectedRequest.email}</p>
                      </div>
                    )}
                    {selectedRequest['contact#'] && (
                      <div>
                        <Label className="text-xs font-medium text-purple-700 dark:text-purple-300">Contact Number</Label>
                        <p className="text-sm text-purple-600 dark:text-purple-300">{selectedRequest['contact#']}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setShowViewDialog(false)} className="px-6">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          {editingRequest && (
            <EditRequestForm 
              request={editingRequest}
              onSuccess={() => {
                setShowEditDialog(false);
                setEditingRequest(null);
                refetch();
              }}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingRequest(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Template Details Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Document Information</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Complete details about this document template</p>
              </div>
            </div>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Main Document Info */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{selectedTemplate.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedTemplate.description || 'Official barangay document for various administrative purposes.'}
                    </p>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-500 text-white ml-4">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              {/* Document Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Document Type</Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {selectedTemplate.type || 'Barangay Certificate'}
                    </p>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Processing Time</Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {selectedTemplate.processing_time || '1-3 business days'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Document Fee</Label>
                    </div>
                    <p className="text-lg font-semibold text-foreground pl-6">₱{selectedTemplate.fee || 0}</p>
                  </div>
                  
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <History className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Validity Period</Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {selectedTemplate.validity_days 
                        ? `${selectedTemplate.validity_days} days from issuance`
                        : 'Indefinite'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedTemplate.notes || selectedTemplate.usage) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Important Notes</Label>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 pl-6">
                    {selectedTemplate.notes || selectedTemplate.usage || 'Please ensure all requirements are complete before submitting your request.'}
                  </p>
                </div>
              )}
              
              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setShowTemplateDialog(false)} className="px-6">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Edit Request Form Component
const EditRequestForm = ({
  request,
  onSuccess,
  onCancel
}: {
  request: any;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const [purpose, setPurpose] = useState(request.purpose || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const updateRequest = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('docrequests')
        .update(data)
        .eq('id', request.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      toast({
        title: "Error",
        description: "Purpose is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRequest.mutateAsync({
        purpose: purpose.trim(),
        updated_at: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Enter the purpose for this document request"
          rows={4}
          required
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Request'}
        </Button>
      </div>
    </form>
  );
};

export default UserDocumentsPage;