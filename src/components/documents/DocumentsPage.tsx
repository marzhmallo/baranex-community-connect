import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Edit, Trash2, Search, Plus, Filter, MoreHorizontal, Clock, CheckCircle, AlertCircle, XCircle, Eye, Upload, BarChart3, Settings, FileCheck, TrendingUp, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentTemplateForm from "./DocumentTemplateForm";
import IssueDocumentForm from "./IssueDocumentForm";
import DocumentViewDialog from "./DocumentViewDialog";
import DocumentDeleteDialog from "./DocumentDeleteDialog";
import DocumentSettingsDialog from "./DocumentSettingsDialog";
import DocumentRequestDetailsModal from "./DocumentRequestDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { formatDistanceToNow } from "date-fns";
import LocalizedLoadingScreen from "@/components/ui/LocalizedLoadingScreen";

const DocumentsPage = () => {
  // Master loading state for initial page load
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Component state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("All Documents");
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isIssueDocumentOpen, setIsIssueDocumentOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Data state
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [documentTracking, setDocumentTracking] = useState<any[]>([]);
  const [documentStats, setDocumentStats] = useState<any>(null);
  const [processingStats, setProcessingStats] = useState<any>(null);
  
  // Pagination state
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [trackingCurrentPage, setTrackingCurrentPage] = useState(1);
  const [trackingTotalCount, setTrackingTotalCount] = useState(0);
  
  // Document request details modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  
  // Document tracking modals state
  const [selectedTrackingItem, setSelectedTrackingItem] = useState(null);
  const [isTrackingDetailsOpen, setIsTrackingDetailsOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  
  const itemsPerPage = 3;
  const trackingItemsPerPage = 5;
  const { toast } = useToast();
  const { adminProfileId } = useCurrentAdmin();

  // Consolidated data fetching function
  const fetchAllData = async () => {
    try {
      if (!adminProfileId) {
        console.log('DEBUG: No adminProfileId available for initial fetch');
        setIsInitialLoading(false);
        return;
      }

      // Get current admin's brgyid first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', adminProfileId)
        .single();

      if (profileError || !profile?.brgyid) {
        console.log('DEBUG: No brgyid found in profile');
        setIsInitialLoading(false);
        return;
      }

      const brgyid = profile.brgyid;

      // Fetch all data concurrently using Promise.all
      const [
        documentTypesResult,
        documentRequestsResult,
        documentTrackingResult,
        documentStatsResult,
        processingStatsResult
      ] = await Promise.all([
        // Fetch document types
        supabase
          .from('document_types')
          .select('*')
          .order('name'),
        
        // Fetch document requests (Request status only)
        supabase
          .from('docrequests')
          .select('*', { count: 'exact' })
          .ilike('status', 'Request')
          .range((requestsCurrentPage - 1) * itemsPerPage, requestsCurrentPage * itemsPerPage - 1)
          .order('created_at', { ascending: false }),
        
        // Fetch document tracking (processed documents)
        supabase
          .from('docrequests')
          .select('*', { count: 'exact' })
          .not('processedby', 'is', null)
          .neq('status', 'Request')
          .range((trackingCurrentPage - 1) * trackingItemsPerPage, trackingCurrentPage * trackingItemsPerPage - 1)
          .order('updated_at', { ascending: false }),
        
        // Fetch document stats
        Promise.all([
          supabase
            .from('docrequests')
            .select('*', { count: 'exact', head: true })
            .eq('brgyid', brgyid),
          supabase
            .from('docrequests')
            .select('*', { count: 'exact', head: true })
            .eq('brgyid', brgyid)
            .eq('status', 'pending'),
          supabase
            .from('docrequests')
            .select('*', { count: 'exact', head: true })
            .eq('brgyid', brgyid)
            .not('processedby', 'is', null)
            .in('status', ['approved', 'processing', 'completed'])
            .gte('updated_at', new Date().toISOString().split('T')[0])
        ]),
        
        // Fetch processing stats
        supabase
          .from('docrequests')
          .select('status, created_at, updated_at')
          .eq('brgyid', brgyid)
      ]);

      // Process document types
      if (documentTypesResult.data) {
        setDocumentTypes(documentTypesResult.data);
      }

      // Process document requests
      if (documentRequestsResult.data) {
        const mappedRequests = documentRequestsResult.data.map(doc => {
          let name = 'Unknown';
          if (doc.receiver) {
            try {
              if (typeof doc.receiver === 'object' && doc.receiver !== null && !Array.isArray(doc.receiver)) {
                name = (doc.receiver as any).name || 'Unknown';
              } else if (typeof doc.receiver === 'string') {
                const parsed = JSON.parse(doc.receiver);
                name = parsed.name || 'Unknown';
              }
            } catch {
              name = 'Unknown';
            }
          }
          return {
            id: doc.id,
            name,
            document: doc.type,
            timeAgo: formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }),
            status: doc.status,
            docnumber: doc.docnumber,
            purpose: doc.purpose,
            amount: doc.amount,
            method: doc.method,
            paydate: doc.paydate,
            paymenturl: doc.paymenturl,
            notes: doc.notes,
            created_at: doc.created_at
          };
        });
        setDocumentRequests(mappedRequests);
        setTotalCount(documentRequestsResult.count || 0);
      }

      // Process document tracking
      if (documentTrackingResult.data) {
        const mappedTracking = documentTrackingResult.data.map(doc => {
          let requestedBy = 'Unknown';
          if (doc.receiver) {
            try {
              if (typeof doc.receiver === 'object' && doc.receiver !== null && !Array.isArray(doc.receiver)) {
                requestedBy = (doc.receiver as any).name || 'Unknown';
              } else if (typeof doc.receiver === 'string') {
                const parsed = JSON.parse(doc.receiver);
                requestedBy = parsed.name || 'Unknown';
              }
            } catch {
              requestedBy = 'Unknown';
            }
          }

          const getStatusColor = (status: string) => {
            switch (status.toLowerCase()) {
              case 'approved':
              case 'ready':
                return 'bg-green-500 text-white';
              case 'rejected':
                return 'bg-red-500 text-white';
              case 'pending':
                return 'bg-yellow-500 text-white';
              case 'processing':
                return 'bg-blue-500 text-white';
              case 'released':
                return 'bg-purple-500 text-white';
              default:
                return 'bg-gray-500 text-white';
            }
          };

          const getDisplayStatus = (status: string) => {
            switch (status.toLowerCase()) {
              case 'approved':
              case 'ready':
                return 'Ready for Pickup';
              case 'rejected':
                return 'Rejected';
              case 'pending':
                return 'Pending';
              case 'processing':
                return 'Processing';
              case 'released':
                return 'Released';
              default:
                return status;
            }
          };

          return {
            id: doc.docnumber,
            document: doc.type,
            requestedBy,
            status: getDisplayStatus(doc.status),
            statusColor: getStatusColor(doc.status),
            lastUpdate: doc.updated_at ? 
              formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true }) : 
              formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }),
            originalStatus: doc.status,
            fullData: doc
          };
        });
        setDocumentTracking(mappedTracking);
        setTrackingTotalCount(documentTrackingResult.count || 0);
      }

      // Process document stats
      if (documentStatsResult && Array.isArray(documentStatsResult)) {
        const [totalResult, pendingResult, issuedTodayResult] = documentStatsResult;
        const stats = {
          total: totalResult.count || 0,
          pending: pendingResult.count || 0,
          issuedToday: issuedTodayResult.count || 0
        };
        setDocumentStats(stats);
      }

      // Process processing stats
      if (processingStatsResult.data) {
        const stats = {
          readyForPickup: 0,
          processing: 0,
          forReview: 0,
          released: 0,
          rejected: 0,
          avgProcessingTime: null
        };

        processingStatsResult.data.forEach((doc) => {
          const status = doc.status?.toLowerCase();
          
          if (status === 'approved' || status === 'ready') {
            stats.readyForPickup += 1;
          } else if (status === 'processing' || status === 'pending') {
            stats.processing += 1;
          } else if (status === 'review' || status === 'for_review') {
            stats.forReview += 1;
          } else if (status === 'released' || status === 'completed') {
            stats.released += 1;
          } else if (status === 'rejected' || status === 'denied') {
            stats.rejected += 1;
          }
        });

        setProcessingStats(stats);
      }

    } catch (error) {
      console.error('Error fetching document data:', error);
    } finally {
      // Only set loading to false after ALL data has been processed
      setIsInitialLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (adminProfileId) {
      fetchAllData();
    }
  }, [adminProfileId, requestsCurrentPage, trackingCurrentPage]);

  // Real-time subscription setup
  useEffect(() => {
    // Set up real-time subscriptions after initial load
    if (!isInitialLoading) {
      const documentsChannel = supabase
        .channel('document-requests-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'docrequests'
          },
          () => {
            // Refetch data when changes occur
            fetchAllData();
          }
        )
        .subscribe();

      const typesChannel = supabase
        .channel('document-types-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'document_types'
          },
          () => {
            // Refetch data when changes occur
            fetchAllData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(documentsChannel);
        supabase.removeChannel(typesChannel);
      };
    }
  }, [isInitialLoading]);

  // Document templates from document_types table (connected)
  const documents = documentTypes?.map(docType => ({
    id: docType.id,
    name: docType.name,
    type: "template",
    status: "Active",
    size: "Template",
    updatedAt: formatDistanceToNow(new Date(docType.updated_at || docType.created_at), { addSuffix: true }),
    icon: FileText,
    color: "text-blue-500",
    description: docType.description,
    fee: docType.fee,
    template: docType.template,
    required_fields: docType.required_fields
  })) || [];

  // Mock data for status updates
  const statusUpdates = [
    {
      id: "1",
      title: "Document #BRG-2024-0001 Approved",
      description: "Barangay Clearance for Maria Santos is ready for pickup",
      time: "2 minutes ago",
      status: "approved",
      trackingId: "BRG-2024-0001"
    },
    {
      id: "2", 
      title: "Document #BRG-2024-0002 Processing",
      description: "Certificate of Residency for Juan Dela Cruz is being processed",
      time: "15 minutes ago",
      status: "processing",
      trackingId: "BRG-2024-0002"
    },
    {
      id: "3",
      title: "Document #BRG-2024-0003 Rejected", 
      description: "Business Permit application requires additional documents",
      time: "1 hour ago",
      status: "rejected",
      trackingId: "BRG-2024-0003"
    }
  ];

  const totalPages = Math.ceil((documents?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocumentTypes = documentTypes?.slice(startIndex, startIndex + itemsPerPage) || [];

  // Show loading screen on initial page load only
  if (isInitialLoading) {
    return (
      <div className="relative w-full min-h-screen">
        <LocalizedLoadingScreen isLoading={true} />
      </div>
    );
  }

  // Helper functions for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRequestsPageChange = (page: number) => {
    setRequestsCurrentPage(page);
  };

  // Helper functions for styling and formatting
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'ready':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      case 'released':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'ready':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'processing':
        return <FileCheck className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'released':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const matchesStatus = (document: any, status: string) => {
    if (status === "all") return true;
    return document.status?.toLowerCase() === status.toLowerCase();
  };

  const matchesAnyStatus = (document: any, statuses: string[]) => {
    return statuses.some(status => matchesStatus(document, status));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Event handlers
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsRequestDetailsOpen(true);
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('docrequests')
        .update({ 
          status: 'approved',
          processedby: adminProfileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: "The document request has been approved successfully.",
      });

      // Refresh data
      fetchAllData();
      setIsRequestDetailsOpen(false);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('docrequests')
        .update({ 
          status: 'rejected',
          processedby: adminProfileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Denied",
        description: "The document request has been denied.",
      });

      // Refresh data
      fetchAllData();
      setIsRequestDetailsOpen(false);
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: "Error",
        description: "Failed to deny the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (trackingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('docrequests')
        .update({ 
          status: newStatus.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('docnumber', trackingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Document status has been updated to ${newStatus}.`,
      });

      // Refresh data
      fetchAllData();
      setIsEditStatusOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update the status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseAddDocument = () => {
    setIsAddDocumentOpen(false);
    setEditingTemplate(null);
  };

  const handleTemplateSuccess = () => {
    fetchAllData();
    handleCloseAddDocument();
    toast({
      title: "Success",
      description: "Document template saved successfully.",
    });
  };

  const handleDeleteSuccess = () => {
    fetchAllData();
    setDeleteDialogOpen(false);
    setSelectedTemplate(null);
    toast({
      title: "Success",
      description: "Document template deleted successfully.",
    });
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsAddDocumentOpen(true);
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleDeleteTemplate = (template: any) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const requestsPages = Math.ceil(totalCount / itemsPerPage);
  const trackingPages = Math.ceil(trackingTotalCount / trackingItemsPerPage);

  return (
    <div className="w-full p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Barangay Document Management</h1>
        <p className="text-muted-foreground">Manage document templates, process requests, and track document status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{documentStats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{documentStats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Issued Today</p>
                <p className="text-2xl font-bold text-foreground">{documentStats?.issuedToday || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground">{processingStats?.processing || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Library */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Document Library</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddDocumentOpen(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                  <Button onClick={() => setIsIssueDocumentOpen(true)} variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                    <Upload className="h-4 w-4 mr-2" />
                    Issue Document
                  </Button>
                  <Button onClick={() => setIsSettingsDialogOpen(true)} variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted">
                  <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:text-foreground">All</TabsTrigger>
                  <TabsTrigger value="requests" className="data-[state=active]:bg-background data-[state=active]:text-foreground">New Requests</TabsTrigger>
                  <TabsTrigger value="tracking" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Document Tracking</TabsTrigger>
                  <TabsTrigger value="templates" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-border bg-background text-foreground"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background border-border">
                        <DropdownMenuItem className="text-foreground hover:bg-accent">All Documents</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-accent">Active</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-accent">Draft</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-accent">Archived</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid gap-4">
                    {paginatedDocumentTypes
                      .filter(doc => 
                        searchQuery === "" || 
                        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((doc) => (
                      <div key={doc.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{doc.name}</h3>
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">Fee: ₱{doc.fee || 0}</span>
                                <Badge variant="outline" className="text-xs border-border">Template</Badge>
                                <span className="text-xs text-muted-foreground">Updated {doc.updatedAt}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-background border-border">
                              <DropdownMenuItem onClick={() => handleViewTemplate(doc)} className="text-foreground hover:bg-accent">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTemplate(doc)} className="text-foreground hover:bg-accent">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteTemplate(doc)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for document types */}
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className={`cursor-pointer ${currentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                  <div className="space-y-4">
                    {documentRequests.map((request) => (
                      <div key={request.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded">
                              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{request.document}</h3>
                              <p className="text-sm text-muted-foreground">Requested by {request.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">{request.timeAgo}</span>
                                <Badge variant="outline" className="text-xs border-border">New Request</Badge>
                                <span className="text-xs text-muted-foreground">#{request.docnumber}</span>
                              </div>
                            </div>
                          </div>
                          <Button onClick={() => handleViewRequest(request)} variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for requests */}
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handleRequestsPageChange(Math.max(1, requestsCurrentPage - 1))}
                            className={`${requestsCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                        {Array.from({ length: requestsPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handleRequestsPageChange(page)}
                              isActive={requestsCurrentPage === page}
                              className={`cursor-pointer ${requestsCurrentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handleRequestsPageChange(Math.min(requestsPages, requestsCurrentPage + 1))}
                            className={`${requestsCurrentPage === requestsPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </TabsContent>

                <TabsContent value="tracking" className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by tracking ID or name..."
                        value={trackingSearchQuery}
                        onChange={(e) => setTrackingSearchQuery(e.target.value)}
                        className="pl-10 border-border bg-background text-foreground"
                      />
                    </div>
                    <Select value={trackingFilter} onValueChange={setTrackingFilter}>
                      <SelectTrigger className="w-48 border-border bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="All Documents" className="text-foreground hover:bg-accent">All Documents</SelectItem>
                        <SelectItem value="In Progress" className="text-foreground hover:bg-accent">In Progress</SelectItem>
                        <SelectItem value="Completed" className="text-foreground hover:bg-accent">Completed</SelectItem>
                        <SelectItem value="Rejected" className="text-foreground hover:bg-accent">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {documentTracking.map((item) => (
                      <div key={item.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{item.document}</h3>
                              <p className="text-sm text-muted-foreground">Requested by {item.requestedBy}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">Last update {item.lastUpdate}</span>
                                <Badge className={`text-xs text-white ${item.statusColor}`}>
                                  {item.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">#{item.id}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                setSelectedTrackingItem(item);
                                setIsTrackingDetailsOpen(true);
                              }} 
                              variant="outline" 
                              size="sm" 
                              className="border-border text-foreground hover:bg-accent"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button 
                              onClick={() => {
                                setSelectedTrackingItem(item);
                                setIsEditStatusOpen(true);
                              }} 
                              variant="outline" 
                              size="sm" 
                              className="border-border text-foreground hover:bg-accent"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for tracking */}
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setTrackingCurrentPage(Math.max(1, trackingCurrentPage - 1))}
                            className={`${trackingCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                        {Array.from({ length: trackingPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setTrackingCurrentPage(page)}
                              isActive={trackingCurrentPage === page}
                              className={`cursor-pointer ${trackingCurrentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setTrackingCurrentPage(Math.min(trackingPages, trackingCurrentPage + 1))}
                            className={`${trackingCurrentPage === trackingPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{doc.name}</h3>
                              <p className="text-sm text-muted-foreground">{doc.description}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">Fee: ₱{doc.fee || 0}</span>
                                <Badge variant="outline" className="text-xs border-border">Template</Badge>
                                <span className="text-xs text-muted-foreground">Updated {doc.updatedAt}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-background border-border">
                              <DropdownMenuItem onClick={() => handleViewTemplate(doc)} className="text-foreground hover:bg-accent">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTemplate(doc)} className="text-foreground hover:bg-accent">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteTemplate(doc)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for templates */}
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className={`cursor-pointer ${currentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Document Status Updates Sidebar */}
        <div>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <div className="bg-green-100 dark:bg-green-900/20 p-1 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                Document Status Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {(statusUpdates || []).map((update, index) => <div key={update.id} className={`p-4 border-b border-border ${index === (statusUpdates || []).length - 1 ? 'border-b-0' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full border-2 ${getStatusColor(update.status)}`}>
                        {getStatusIcon(update.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm">{update.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{update.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{update.time}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0 border-border">
                            {update.trackingId}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="outline" className="w-full text-sm border-border text-foreground hover:bg-accent">
                  View All Updates →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Document Template Dialog */}
      <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DocumentTemplateForm 
            template={editingTemplate}
            onClose={handleCloseAddDocument} 
            onSuccess={handleTemplateSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Issue Document Dialog */}
      <Dialog open={isIssueDocumentOpen} onOpenChange={setIsIssueDocumentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle>Issue New Document</DialogTitle>
          </DialogHeader>
          <IssueDocumentForm onClose={() => setIsIssueDocumentOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* View Document Template Dialog */}
      <DocumentViewDialog 
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        template={selectedTemplate}
      />

      {/* Delete Document Template Dialog */}
      <DocumentDeleteDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        template={selectedTemplate}
        onDeleteSuccess={handleDeleteSuccess}
      />

      {/* Document Settings Dialog */}
      <DocumentSettingsDialog 
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />

      {/* Document Request Details Modal */}
      <DocumentRequestDetailsModal
        isOpen={isRequestDetailsOpen}
        onClose={() => setIsRequestDetailsOpen(false)}
        request={selectedRequest}
        onApprove={handleApproveRequest}
        onDeny={handleDenyRequest}
      />

      {/* Edit Status Modal */}
      <Dialog open={isEditStatusOpen} onOpenChange={setIsEditStatusOpen}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>Edit Request Status</DialogTitle>
          </DialogHeader>
          {selectedTrackingItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Document: {selectedTrackingItem.document}</p>
                <p className="text-sm text-muted-foreground">Tracking ID: {selectedTrackingItem.id}</p>
                <p className="text-sm text-muted-foreground">Requested by: {selectedTrackingItem.requestedBy}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleUpdateStatus(selectedTrackingItem.id, 'Processing')}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                  >
                    Processing
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedTrackingItem.id, 'Ready')}
                    variant="outline"
                    className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                  >
                    Ready
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedTrackingItem.id, 'Rejected')}
                    variant="outline"
                    className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                  >
                    Rejected
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedTrackingItem.id, 'Released')}
                    variant="outline"
                    className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400"
                  >
                    Released
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsPage;
