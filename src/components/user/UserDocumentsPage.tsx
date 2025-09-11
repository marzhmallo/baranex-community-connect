import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DocumentRequestModal from "./DocumentRequestModal";
import LocalizedLoadingScreen from "@/components/ui/LocalizedLoadingScreen";
import { FileText, Clock, CheckCircle, BarChart3, Package, Hourglass, Eye, XCircle, TrendingUp, Search, Plus, Filter, Download, Edit, Trash2, RefreshCw, FileX, History, PlusCircle, Bell, Upload, ArrowRight, Settings, MoreHorizontal, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

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
    profiles: {
      id: string;
      firstname: string;
      lastname: string;
    } | null;
  } & Record<string, any>;

  // Initial loading state management
  useEffect(() => {
    if (userProfile?.id) {
      // Only set loading to false once we have a user profile
      setIsInitialLoading(false);
    }
  }, [userProfile?.id]);

  // Reset pagination when tracking filter changes
  useEffect(() => {
    setRequestsCurrentPage(1);
  }, [trackingFilter]);

  // Reset pagination when search query changes
  useEffect(() => {
    setRequestsCurrentPage(1);
  }, [trackingSearchQuery]);

  // Fetch user's document requests from Supabase with real-time updates
  const {
    data: documentRequests = [],
    isLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ['user-document-requests', userProfile?.id],
    queryFn: async (): Promise<EnrichedDocumentRequest[]> => {
      if (!userProfile?.id) {
        console.log('No user profile available');
        return [];
      }

      console.log('Fetching document requests for user:', userProfile.id);

      try {
        // Fetch requests with profile data using a join
        const { data: requests, error: requestsError } = await supabase
          .from('docrequests')
          .select(`
            *,
            profiles:resident_id (
              id,
              firstname,
              lastname
            )
          `)
          .eq('resident_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.error('Error fetching document requests:', requestsError);
          throw requestsError;
        }
        
        console.log('Raw requests data:', requests?.length, requests);

        if (!requests || requests.length === 0) {
          console.log('No document requests found for user');
          return [];
        }

        // Process the joined data and add fallback profile data
        const enrichedRequests: EnrichedDocumentRequest[] = requests.map(request => {
          let profileData = request.profiles;
          
          // If no profile data from join, create fallback data
          if (!profileData && userProfile) {
            profileData = {
              id: userProfile.id,
              firstname: userProfile.firstname || 'Unknown',
              lastname: userProfile.lastname || 'User'
            };
          }

          return {
            ...request,
            profiles: profileData
          };
        });
        
        console.log('Processed requests:', enrichedRequests.length, enrichedRequests);
        return enrichedRequests;
      } catch (error) {
        console.error('Query function error:', error);
        throw error;
      }
    },
    enabled: !!userProfile?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes  
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Set up real-time subscription for user document requests
  useEffect(() => {
    if (!userProfile?.id) return;
    
    console.log('Setting up real-time subscription for user:', userProfile.id);
    
    const channel = supabase.channel(`user-document-requests-${userProfile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'docrequests',
        filter: `resident_id=eq.${userProfile.id}`
      }, (payload) => {
        console.log('Real-time update received:', payload.eventType, payload.new || payload.old);
        // Use query invalidation instead of refetch to avoid conflicts
        queryClient.invalidateQueries({ 
          queryKey: ['user-document-requests', userProfile.id] 
        });
      })
      .subscribe();
    
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, queryClient]);

  // Fetch document types from Supabase
  const {
    data: documentTypes = [],
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_types').select('*').order('name');
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
    return (
      <div className="w-full p-6 bg-background min-h-screen relative">
        <LocalizedLoadingScreen isLoading={isInitialLoading} />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      {/* Mobile-first Header */}
      <div className="mb-8">
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Documents
          </h1>
          <div className="absolute -bottom-1 left-0 h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
        </div>
        <p className="text-muted-foreground hidden md:block mt-3 text-lg">Manage official documents, requests, and issuances for the barangay community</p>
      </div>

      {/* Status Cards - Horizontal Scroll on Mobile */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden md:inline">Overview Statistics</span>
            <span className="md:hidden">Overview</span>
          </h2>
          <button onClick={async () => {
            setIsRefreshing(true);
            try {
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['user-document-requests'] }),
                queryClient.invalidateQueries({ queryKey: ['document-types'] })
              ]);
            } finally {
              setIsRefreshing(false);
            }
          }} disabled={isRefreshing} className={`p-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl transition-all duration-200 hover:shadow-md ${isRefreshing ? 'cursor-not-allowed opacity-75' : ''}`}>
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Swipeable Status Cards */}
        <div className="w-full overflow-hidden">
          <div className="min-w-0 md:hidden -mx-4">
            <Swiper
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={12}
              freeMode={{
                enabled: true,
                momentum: true,
                sticky: false,
              }}
              className="!pb-4 !px-4"
              style={{ paddingRight: '16px' }}
            >
              <SwiperSlide className="!w-40">
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Requests</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                      {documentRequests.filter(req => matchesStatus(req.status, 'Request')).length}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
              
              <SwiperSlide className="!w-40">
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                      <Hourglass className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Processing</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {documentRequests.filter(req => matchesStatus(req.status, 'processing')).length}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
              
              <SwiperSlide className="!w-40">
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                      <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Ready</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {documentRequests.filter(req => matchesStatus(req.status, 'ready')).length}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
              
              <SwiperSlide className="!w-40">
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                      <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Released</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed'])).length}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
              
              <SwiperSlide className="!w-40">
                <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
                  <div className="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {documentRequests.filter(req => matchesStatus(req.status, 'rejected')).length}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-5 gap-6">
          <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
            <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Requests</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {documentRequests.filter(req => matchesStatus(req.status, 'Request')).length}
              </p>
            </div>
          </div>
          
          <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                <Hourglass className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Processing</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {documentRequests.filter(req => matchesStatus(req.status, 'processing')).length}
              </p>
            </div>
          </div>
          
          <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Ready</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {documentRequests.filter(req => matchesStatus(req.status, 'ready')).length}
              </p>
            </div>
          </div>
          
          <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Released</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed'])).length}
              </p>
            </div>
          </div>
          
          <div className="group cursor-pointer transition-all duration-300 hover:scale-105">
            <div className="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/30 p-5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/30 p-3 rounded-xl mb-4 shadow-inner group-hover:shadow-md transition-shadow duration-300">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {documentRequests.filter(req => matchesStatus(req.status, 'rejected')).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-6 p-4 bg-card/50 rounded-xl border border-border/50 backdrop-blur-sm w-80 ml-0 mr-auto md:w-full md:ml-0 md:mr-0">
          <span className="font-medium">Total Documents: <span className="text-primary font-bold">{documentRequests.length}</span></span>
          <span className="hidden md:block">
            Last Updated: {documentRequests.length > 0 ? 'Recently updated' : 'No documents'}
          </span>
        </div>
      </div>

      {/* Document Tracking - Mobile Card Layout */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden md:inline">Document Tracking System</span>
            <span className="md:hidden">My Requests</span>
          </h2>
          {/* Desktop Request Button - Hidden on Mobile */}
          <Button 
            onClick={() => setShowRequestModal(true)} 
            className="hidden md:flex bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Request Document
          </Button>
        </div>

        {/* Mobile-first Search and Filters */}
        <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6 mb-6">
          <div className="relative w-80 ml-0 mr-auto md:w-full md:ml-0 md:mr-0">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search by tracking ID..." 
              value={trackingSearchQuery} 
              onChange={e => setTrackingSearchQuery(e.target.value)} 
              className="pl-12 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 w-full md:w-1/2 bg-card/50 text-foreground backdrop-blur-sm shadow-sm hover:shadow-md"
            />
          </div>

          {/* Mobile Dropdown Filter */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="justify-between bg-card/70 border-border/50 hover:bg-accent/50 backdrop-blur-sm shadow-sm hover:shadow-md min-w-fit"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {trackingFilter}
                  </span>
                  <div className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-sm border-border/50 shadow-xl z-50">
                {["All Documents", "Requests", "Processing", "Released", "Ready", "Rejected"].map((filter) => (
                  <DropdownMenuItem
                    key={filter}
                    onClick={() => setTrackingFilter(filter)}
                    className={`cursor-pointer hover:bg-accent/50 focus:bg-accent/50 ${
                      trackingFilter === filter 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-foreground"
                    }`}
                  >
                    {filter}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Filter Buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
            {["All Documents", "Requests", "Processing", "Released", "Ready", "Rejected"].map((filter) => (
              <Button
                key={filter}
                variant={trackingFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setTrackingFilter(filter)}
                className={`transition-all duration-200 ${
                  trackingFilter === filter
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card/70 border-border/50 hover:bg-accent/50 backdrop-blur-sm"
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4 mb-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documentRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No document requests found</p>
            </div>
          ) : paginatedRequests.map(request => (
            <Card key={request.id} className="p-4 hover:shadow-md transition-shadow duration-200 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{request.type}</h3>
                  <p className="text-sm text-muted-foreground mt-1 truncate">ID: {request.docnumber}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {getStatusBadge(request.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedRequest(request);
                        setShowViewDialog(true);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {request.status === 'Request' && (
                        <DropdownMenuItem onClick={() => {
                          setEditingRequest(request);
                          setShowRequestModal(true);
                        }} 
                        disabled={request.status !== 'Request'} 
                        className={request.status !== 'Request' ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Request
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Purpose:</span> <span className="text-muted-foreground">{request.purpose}</span></p>
                <p><span className="font-medium">Date:</span> <span className="text-muted-foreground">{formatDate(request.created_at)}</span></p>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30">
                  <TableHead className="font-semibold text-foreground">Tracking ID</TableHead>
                  <TableHead className="font-semibold text-foreground">Document Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Purpose</TableHead>
                  <TableHead className="font-semibold text-foreground">Date Requested</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : documentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No document requests found</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedRequests.map(request => (
                  <TableRow key={request.id} className="border-border/30 hover:bg-muted/20 transition-colors duration-200">
                    <TableCell className="font-medium text-primary">{request.docnumber}</TableCell>
                    <TableCell className="text-foreground">{request.type}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{request.purpose}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-accent/50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => {
                            setSelectedRequest(request);
                            setShowViewDialog(true);
                          }} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === 'Request' && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingRequest(request);
                                setShowRequestModal(true);
                              }}
                              disabled={request.status !== 'Request'}
                              className={`flex items-center gap-2 ${
                                request.status !== 'Request' ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <Edit className="h-4 w-4" />
                              Edit Request
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination for Document Requests */}
        {requestsTotalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handleRequestsPageChange(requestsCurrentPage - 1)}
                    className={requestsCurrentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}
                  />
                </PaginationItem>
                
                {Array.from({ length: requestsTotalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handleRequestsPageChange(page)}
                      isActive={requestsCurrentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handleRequestsPageChange(requestsCurrentPage + 1)}
                    className={requestsCurrentPage >= requestsTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Document Library Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden md:inline">Available Documents</span>
            <span className="md:hidden">Documents</span>
          </h2>
        </div>

        {/* Document Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {isLoadingTemplates ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                  <div className="h-6 bg-muted rounded mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))
          ) : paginatedTemplates.length > 0 ? (
            paginatedTemplates.map(template => (
              <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200 truncate">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description || 'Official barangay document'}
                      </p>
                    </div>
                    {template.fee > 0 && (
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">
                        ₱{template.fee}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateDialog(true);
                      }}
                      className="flex-1 mr-2 bg-card/70 border-border/50 hover:bg-accent/50 backdrop-blur-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowRequestModal(true)}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Request
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No document types available</p>
            </div>
          )}
        </div>

        {/* Pagination for Document Templates */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <DocumentRequestModal 
          onClose={() => {
            setShowRequestModal(false);
            setEditingRequest(null);
          }} 
          editingRequest={editingRequest} 
        />
      )}

      {/* View Request Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-auto p-4 md:p-6">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Document Request Details</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Complete information about your document request</p>
              </div>
            </div>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tracking ID</label>
                    <p className="text-lg font-semibold text-primary">{selectedRequest.docnumber}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Document Type</label>
                    <p className="text-base font-medium">{selectedRequest.type}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date Requested</label>
                    <p className="text-base">{formatDate(selectedRequest.created_at)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                    <p className="text-base">{selectedRequest.purpose}</p>
                  </div>
                  
                  {selectedRequest.amount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount</label>
                      <p className="text-base font-semibold">₱{selectedRequest.amount}</p>
                    </div>
                  )}
                  
                  {selectedRequest.method && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                      <p className="text-base">{selectedRequest.method}</p>
                    </div>
                  )}
                  
                  {/* Payment Details */}
                  {selectedRequest.ornumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reference Number</label>
                      <p className="text-base font-mono">{selectedRequest.ornumber}</p>
                    </div>
                  )}
                  
                  {selectedRequest.paydate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Date</label>
                      <p className="text-base">{formatDate(selectedRequest.paydate)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recipient Information */}
              {selectedRequest.receiver && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="p-1 rounded bg-green-100 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    Recipient Information
                  </h3>
                  <p className="text-base"><span className="font-medium">Name:</span> {selectedRequest.receiver.name}</p>
                </div>
              )}
              
              {/* Additional Notes */}
              {selectedRequest.notes && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="p-1 rounded bg-yellow-100 dark:bg-yellow-900/20">
                      <MessageCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    Additional Notes
                  </h3>
                  <p className="text-base bg-muted/50 p-3 rounded-lg">{selectedRequest.notes}</p>
                </div>
              )}
              
              {/* Contact Information */}
              {(selectedRequest.email || selectedRequest['contact#']) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedRequest.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-base">{selectedRequest.email}</p>
                      </div>
                    )}
                    {selectedRequest['contact#'] && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                        <p className="text-base">{selectedRequest['contact#']}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Details Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl p-4 md:p-6">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Document Information</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Complete details about this document type</p>
              </div>
            </div>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Document Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Document Name</Label>
                    </div>
                    <p className="text-lg font-semibold text-primary pl-6">{selectedTemplate.name}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">Processing Fee</Label>
                    </div>
                    <p className="text-base font-semibold pl-6">
                      {selectedTemplate.fee > 0 ? `₱${selectedTemplate.fee}` : 'Free'}
                    </p>
                  </div>
                  
                  <div>
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

      {/* Floating Action Button - Mobile Only */}
      <Button
        onClick={() => setShowRequestModal(true)}
        className="md:hidden fixed bottom-6 right-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-2xl hover:shadow-xl transition-all duration-300 z-50 group animate-pulse-slow hover:animate-none"
        size="icon"
      >
        <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
      </Button>
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
      const { error } = await supabase.from('docrequests').update(data).eq('id', request.id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document request updated successfully"
      });
      onSuccess();
    },
    onError: (error) => {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Document Type</Label>
        <p className="text-sm text-muted-foreground mt-1">{request.type}</p>
      </div>
      <div>
        <Label htmlFor="purpose" className="text-sm font-medium">Purpose *</Label>
        <Textarea 
          id="purpose" 
          value={purpose} 
          onChange={e => setPurpose(e.target.value)} 
          placeholder="Enter the purpose for this document..." 
          className="mt-2 min-h-[100px]" 
          required 
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !purpose.trim()}>
          {isSubmitting ? 'Updating...' : 'Update Request'}
        </Button>
      </div>
    </form>
  );
};

export default UserDocumentsPage;