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
  const {
    userProfile
  } = useAuth();
  const {
    toast
  } = useToast();
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
        userProfile?.id ? supabase.from('docrequests').select('*').eq('resident_id', userProfile.id).order('created_at', {
          ascending: false
        }) : {
          data: [],
          error: null
        }]);

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
  const {
    data: documentRequests = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['user-document-requests', userProfile?.id],
    queryFn: async (): Promise<EnrichedDocumentRequest[]> => {
      if (!userProfile?.id) return [];

      // First get all document requests for the user
      const {
        data: requests,
        error: requestsError
      } = await supabase.from('docrequests').select('*').eq('resident_id', userProfile.id).order('created_at', {
        ascending: false
      });
      if (requestsError) throw requestsError;
      if (!requests || requests.length === 0) return [];

      // Get all unique resident IDs from the requests
      const residentIds = [...new Set(requests.map(req => req.resident_id))];

      // Fetch profile data for all resident IDs
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('id, firstname, lastname').in('id', residentIds);
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
    const channel = supabase.channel('user-document-requests-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'docrequests',
      filter: `resident_id=eq.${userProfile.id}`
    }, () => {
      // Refetch user's document requests when changes occur
      refetch();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, refetch]);

  // Fetch document types from Supabase
  const {
    data: documentTypes = [],
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('document_types').select('*').order('name');
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
      filteredByStatus = filteredByStatus.filter(request => request.docnumber?.toLowerCase().includes(trackingSearchQuery.toLowerCase()));
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
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Processing</Badge>;
      case 'for review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">For Review</Badge>;
      case 'approved':
      case 'ready for pickup':
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Ready for Pickup</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Rejected</Badge>;
      case 'released':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">Released</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50">{status}</Badge>;
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
    return <div className="w-full p-6 bg-background min-h-screen relative">
        <LocalizedLoadingScreen isLoading={isInitialLoading} />
      </div>;
  }
  return <div className="w-full max-w-full p-3 md:p-6 bg-background min-h-screen overflow-x-hidden">
      {/* Mobile-first Header */}
      <div className="mb-4">
        <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1">Documents</h1>
        <p className="text-sm text-muted-foreground hidden md:block">Manage official documents, requests, and issuances for the barangay community</p>
      </div>

      {/* Status Cards - Horizontal Scroll on Mobile */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="truncate">Status Overview</span>
          </h2>
          <button onClick={async () => {
          setIsRefreshing(true);
          try {
            await Promise.all([queryClient.invalidateQueries({
              queryKey: ['user-document-requests']
            }), queryClient.invalidateQueries({
              queryKey: ['document-types']
            })]);
          } finally {
            setIsRefreshing(false);
          }
        }} disabled={isRefreshing} className={`p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors ${isRefreshing ? 'cursor-not-allowed opacity-75' : ''} flex-shrink-0`}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Horizontal Scrolling Status Cards */}
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
          <div className="min-w-[120px] md:min-w-0 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-2 md:p-3 flex flex-col items-center text-center flex-shrink-0">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-1.5 md:p-2 rounded-full mb-1 md:mb-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Requests</p>
            <p className="text-lg md:text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {documentRequests.filter(req => matchesStatus(req.status, 'Request')).length}
            </p>
          </div>
          
          <div className="min-w-[120px] md:min-w-0 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-2 md:p-3 flex flex-col items-center text-center flex-shrink-0">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 md:p-2 rounded-full mb-1 md:mb-2">
              <Hourglass className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
              {documentRequests.filter(req => matchesStatus(req.status, 'processing')).length}
            </p>
          </div>
          
          <div className="min-w-[120px] md:min-w-0 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-2 md:p-3 flex flex-col items-center text-center flex-shrink-0">
            <div className="bg-green-100 dark:bg-green-900/50 p-1.5 md:p-2 rounded-full mb-1 md:mb-2">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground">Ready</p>
            <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
              {documentRequests.filter(req => matchesStatus(req.status, 'ready')).length}
            </p>
          </div>
          
          <div className="min-w-[120px] md:min-w-0 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-2 md:p-3 flex flex-col items-center text-center flex-shrink-0">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 md:p-2 rounded-full mb-1 md:mb-2">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-muted-foreground">Released</p>
            <p className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">
              {documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed'])).length}
            </p>
          </div>
          
          <div className="min-w-[120px] md:min-w-0 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-2 md:p-3 flex flex-col items-center text-center flex-shrink-0">
            <div className="bg-red-100 dark:bg-red-900/50 p-1.5 md:p-2 rounded-full mb-1 md:mb-2">
              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">
              {documentRequests.filter(req => matchesStatus(req.status, 'rejected')).length}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
          <span className="truncate">Total: {documentRequests.length}</span>
          <span className="hidden md:block truncate">Last Updated: {documentRequests.length > 0 ? formatDate(new Date(Math.max(...documentRequests.map(req => new Date(req.updated_at || req.created_at).getTime()))).toISOString()) : 'No documents'}</span>
        </div>
      </div>

      {/* Document Tracking - Mobile Card Layout */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden md:inline truncate">Document Tracking System</span>
            <span className="md:hidden truncate">My Requests</span>
          </h2>
          {/* Desktop Request Button - Hidden on Mobile */}
          <Button onClick={() => setShowRequestModal(true)} className="hidden md:flex bg-blue-600 text-white hover:bg-blue-700 flex-shrink-0">
            <PlusCircle className="h-4 w-4 mr-2" />
            Request Document
          </Button>
        </div>

        {/* Mobile-first Search and Filters */}
        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input type="text" placeholder="Search by tracking ID..." value={trackingSearchQuery} onChange={e => setTrackingSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full bg-background text-foreground text-sm" />
          </div>

          {/* Simplified Mobile Filters */}
          <div className="flex gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap scrollbar-hide">
            {["All Documents", "Requests", "Processing", "Released", "Ready", "Rejected"].map(filter => <button key={filter} onClick={() => setTrackingFilter(filter)} className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${trackingFilter === filter ? "bg-primary/10 text-primary" : "bg-muted text-foreground hover:bg-muted/80"}`}>
                {filter}
              </button>)}
          </div>
        </div>
        
        {/* Card Feed for Mobile, Table for Desktop */}
        <div className="md:hidden space-y-2">
          {isLoading ? <div className="text-center py-6 text-muted-foreground text-sm">
              Loading your document requests...
            </div> : documentRequests.length === 0 ? <div className="text-center py-6 text-muted-foreground text-sm">
              No document requests found
            </div> : paginatedRequests.map(request => <Card key={request.id} className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="font-medium text-primary text-xs truncate">#{request.docnumber}</div>
                    <div className="text-foreground font-semibold text-sm truncate">{request.type}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex-shrink-0 mr-2">Requested by:</span>
                    <span className="text-foreground font-medium text-right truncate min-w-0">
                      {request.profiles?.firstname && request.profiles?.lastname ? `${request.profiles.firstname} ${request.profiles.lastname}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex-shrink-0 mr-2">Last update:</span>
                    <span className="text-foreground text-right truncate min-w-0">{formatDate(request.updated_at || request.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => {
                setSelectedRequest(request);
                setShowViewDialog(true);
              }} className="text-xs px-2 py-1 h-auto">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {request.status === 'Request' && <Button variant="ghost" size="sm" onClick={() => {
                setEditingRequest(request);
                setShowRequestModal(true);
              }} className="text-xs px-2 py-1 h-auto">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>}
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tracking ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Document</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Update</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {isLoading ? <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">
                      Loading your document requests...
                    </td>
                  </tr> : documentRequests.length === 0 ? <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">
                      No document requests found
                    </td>
                  </tr> : paginatedRequests.map(request => <tr key={request.id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {request.docnumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {request.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {request.profiles?.firstname && request.profiles?.lastname ? `${request.profiles.firstname} ${request.profiles.lastname}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(request.updated_at || request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => {
                      setSelectedRequest(request);
                      setShowViewDialog(true);
                    }} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View request details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => {
                      if (request.status === 'Request') {
                        setEditingRequest(request);
                        setShowRequestModal(true);
                      }
                    }} disabled={request.status !== 'Request'} className={`p-1 rounded transition-colors ${request.status === 'Request' ? 'text-muted-foreground hover:text-primary hover:bg-primary/10' : 'text-muted-foreground/50 cursor-not-allowed'}`} title={request.status === 'Request' ? 'Edit request' : 'Cannot edit processed request'}>
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {requestsTotalPages > 1 && <div className="mt-3 flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-xs text-muted-foreground hidden md:block">
              Showing {requestsStartIndex + 1} to {Math.min(requestsEndIndex, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
            <div className="flex items-center gap-1 mx-auto md:mx-0">
              <button onClick={() => handleRequestsPageChange(requestsCurrentPage - 1)} disabled={requestsCurrentPage === 1} className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-lg transition-colors ${requestsCurrentPage === 1 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-accent'}`}>
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({
              length: requestsTotalPages
            }, (_, i) => i + 1).map(page => <button key={page} onClick={() => handleRequestsPageChange(page)} className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md font-medium min-w-[24px] ${requestsCurrentPage === page ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}`}>
                    {page}
                  </button>)}
              </div>
              <button onClick={() => handleRequestsPageChange(requestsCurrentPage + 1)} disabled={requestsCurrentPage === requestsTotalPages} className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-lg transition-colors ${requestsCurrentPage === requestsTotalPages ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-accent'}`}>
                Next
              </button>
            </div>
          </div>}
      </div>

      {/* Document Library - Mobile Simplified */}
      <div className="block md:grid md:grid-cols-1 lg:grid-cols-3 md:gap-6">
        <div className="md:lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-3 px-3 md:px-6 pt-3 md:pt-6">
              <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-base md:text-lg md:text-xl text-foreground truncate">Available Documents</CardTitle>
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Mobile search - simplified */}
                  <div className="relative flex-1 md:flex-initial min-w-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 md:w-64 border-border bg-background text-foreground text-sm" />
                  </div>
                  {/* Hide desktop request button */}
                  <Button className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0" onClick={() => setShowRequestModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-3 md:p-6">
                <div className="space-y-2 md:space-y-3">
                  {isLoadingTemplates ? <div className="text-center py-6 text-muted-foreground text-sm">Loading document templates...</div> : paginatedTemplates.length > 0 ? paginatedTemplates.map(template => <div key={template.id} className="flex items-center justify-between p-3 md:p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-2 md:gap-3 md:gap-4 flex-1 min-w-0">
                          {/* Hide checkbox on mobile for cleaner look */}
                          <input type="checkbox" className="hidden md:block rounded border-border flex-shrink-0" />
                          <div className="p-1.5 md:p-2 rounded bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                            <FileText className="h-3 w-3 md:h-4 md:w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-foreground text-xs md:text-sm md:text-base truncate">{template.name}</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              <span className="md:hidden">₱{template.fee || 0}</span>
                              <span className="hidden md:inline">{template.description} • Fee: ₱{template.fee || 0}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          <Badge className="hidden md:block bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                          <button onClick={() => {
                      setSelectedTemplate(template);
                      setShowTemplateDialog(true);
                    }} className="p-1 md:p-1.5 md:p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View template details">
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          </button>
                        </div>
                      </div>) : <div className="text-center py-6 text-muted-foreground text-sm">No document templates found</div>}
                </div>

                {/* Mobile-friendly pagination */}
                <div className="flex items-center justify-center mt-4 md:mt-6">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious onClick={e => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }} className={`hover:bg-accent cursor-pointer text-xs md:text-sm px-2 md:px-3 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </PaginationItem>
                      {Array.from({
                      length: totalPages
                    }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                          <PaginationLink onClick={e => {
                        e.preventDefault();
                        handlePageChange(page);
                      }} isActive={currentPage === page} className={`cursor-pointer text-xs md:text-sm px-2 md:px-3 ${currentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                            {page}
                          </PaginationLink>
                        </PaginationItem>)}
                      <PaginationItem>
                        <PaginationNext onClick={e => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }} className={`hover:bg-accent cursor-pointer text-xs md:text-sm px-2 md:px-3 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Updates - Hidden on mobile for cleaner view */}
        <div className="hidden md:block space-y-6">
          <div className="mb-6 bg-card rounded-lg shadow-sm overflow-hidden border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <History className="h-5 w-5" />
                Document Status Updates
              </h2>
            </div>
            <div className="p-0 overflow-visible">
              <div className="relative">
                <div className="p-6 relative z-10 overflow-visible">{/* removed z-index line */}
                  {isLoading ? <div className="text-center py-8">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading updates...</p>
                    </div> : documentRequests.length === 0 ? <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No document updates yet</p>
                    </div> : documentRequests.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).slice(0, 4).map((request, index) => {
                  const isLast = index === Math.min(3, documentRequests.length - 1);

                  // Normalize status for better matching
                  const normalizedStatus = request.status.toLowerCase();

                  // Determine status display and styling
                  let statusInfo;
                  if (matchesAnyStatus(request.status, ['approved', 'ready for pickup', 'ready'])) {
                    statusInfo = {
                      text: 'Ready for Pickup',
                      dotClass: 'bg-green-500',
                      bgClass: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                      badgeClass: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
                      description: 'You can now pick up your document at the barangay office.'
                    };
                  } else if (matchesAnyStatus(request.status, ['completed', 'released'])) {
                    statusInfo = {
                      text: 'Released',
                      dotClass: 'bg-purple-500',
                      bgClass: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
                      badgeClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
                      description: 'Your document has been successfully released.'
                    };
                  } else if (matchesStatus(request.status, 'processing')) {
                    statusInfo = {
                      text: 'Processing',
                      dotClass: 'bg-blue-500',
                      bgClass: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                      badgeClass: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
                      description: 'Please wait while we process your request.'
                    };
                  } else if (matchesStatus(request.status, 'rejected')) {
                    statusInfo = {
                      text: 'Rejected',
                      dotClass: 'bg-red-500',
                      bgClass: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                      badgeClass: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
                      description: 'Please contact the office for more details.'
                    };
                  } else {
                    statusInfo = {
                      text: 'Pending',
                      dotClass: 'bg-yellow-500',
                      bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
                      badgeClass: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
                      description: 'Your request is being reviewed.'
                    };
                  }
                  return <div key={request.id} className={`grid grid-cols-[auto_1fr] gap-4 ${!isLast ? 'mb-6' : ''}`}>
                            <div className="flex flex-col items-center">
                              <div className={`h-6 w-6 rounded-full ${statusInfo.dotClass} border-2 border-background shadow-md flex items-center justify-center`}>
                                <div className="h-1.5 w-1.5 bg-background rounded-full"></div>
                              </div>
                              {!isLast && <div className="w-0.5 bg-border flex-1 mt-2"></div>}
                            </div>
                            <div className={`${statusInfo.bgClass} border p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200`}>
                              <div className="mb-3">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-foreground text-sm">
                                    {request.type}
                                  </h3>
                                  <span className={`text-xs px-2 py-1 ${statusInfo.badgeClass} rounded-full font-medium`}>
                                    {statusInfo.text}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {request.docnumber}
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm text-foreground">
                                  <span className="font-medium">Purpose:</span> {request.purpose}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {statusInfo.description}
                                </p>
                                {request.notes && <div className="mt-3 p-3 bg-muted rounded-md border-l-4 border-primary">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">ADMIN NOTE</p>
                                    <p className="text-xs text-foreground">{request.notes}</p>
                                  </div>}
                              </div>
                              
                              <div className="flex justify-end mt-3 pt-2 border-t border-border">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(request.updated_at || request.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>;
                })}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {showIssueForm && <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
            <DocumentIssueForm onClose={() => setShowIssueForm(false)} />
          </div>
        </div>}

      {showRequestModal && <DocumentRequestModal onClose={() => {
      setShowRequestModal(false);
      setEditingRequest(null);
    }} editingRequest={editingRequest} />}

      {/* View Request Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          {editingRequest && <EditRequestForm request={editingRequest} onSuccess={() => {
          setShowEditDialog(false);
          setEditingRequest(null);
          refetch();
        }} onCancel={() => {
          setShowEditDialog(false);
          setEditingRequest(null);
        }} />}
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
          
          {selectedTemplate && <div className="space-y-6">
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
                      {selectedTemplate.validity_days ? `${selectedTemplate.validity_days} days from issuance` : 'Indefinite'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedTemplate.notes || selectedTemplate.usage) && <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Important Notes</Label>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 pl-6">
                    {selectedTemplate.notes || selectedTemplate.usage || 'Please ensure all requirements are complete before submitting your request.'}
                  </p>
                </div>}
              
              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setShowTemplateDialog(false)} className="px-6">
                  Close
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Floating Action Button - Mobile Only */}
      <Button onClick={() => setShowRequestModal(true)} className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 z-50" size="icon">
        <Plus className="h-6 w-6" />
      </Button>
    </div>;
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
  const {
    toast
  } = useToast();
  const updateRequest = useMutation({
    mutationFn: async (data: any) => {
      const {
        error
      } = await supabase.from('docrequests').update(data).eq('id', request.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request updated successfully"
      });
      onSuccess();
    },
    onError: error => {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive"
      });
    }
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) return;
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
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Document Type</Label>
        <p className="text-sm text-muted-foreground mt-1">{request.type}</p>
      </div>
      <div>
        <Label htmlFor="purpose" className="text-sm font-medium">Purpose *</Label>
        <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Enter the purpose for this document..." className="mt-2 min-h-[100px]" required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !purpose.trim()}>
          {isSubmitting ? 'Updating...' : 'Update Request'}
        </Button>
      </div>
    </form>;
};
export default UserDocumentsPage;