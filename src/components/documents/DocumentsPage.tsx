import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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

const DocumentsPage = () => {
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
  
  // Document requests state
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Document request details modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  
  // Document tracking modals state
  const [selectedTrackingItem, setSelectedTrackingItem] = useState(null);
  const [isTrackingDetailsOpen, setIsTrackingDetailsOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  
  const itemsPerPage = 3;
  const { toast } = useToast();
  const { adminProfileId } = useCurrentAdmin();

  // Fetch document requests from Supabase with real-time updates
  useEffect(() => {
    fetchDocumentRequests();
    
    // Set up real-time subscription for document requests
    const channel = supabase
      .channel('document-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'docrequests'
        },
        () => {
          // Refetch document requests when changes occur
          fetchDocumentRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestsCurrentPage]);

  const fetchDocumentRequests = async () => {
    setRequestsLoading(true);
    try {
      // Build query for Request status only
      let query = supabase
        .from('docrequests')
        .select('*', { count: 'exact' })
        .ilike('status', 'Request');

      // Apply pagination
      const from = (requestsCurrentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching document requests:', error);
        return;
      }

      // Map data to match the expected format
      const mappedData = data?.map(doc => {
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
      }) || [];

      setDocumentRequests(mappedData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setRequestsLoading(false);
    }
  };
  const { data: documentTypes, isLoading: isLoadingDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ['document-types', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('document_types')
        .select('*');
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Set up real-time subscription for document types
  useEffect(() => {
    const channel = supabase
      .channel('document-types-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_types'
        },
        () => {
          // Refetch document types when changes occur
          refetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchDocuments]);

  // Fetch document request stats
  const { data: documentStats } = useQuery({
    queryKey: ['document-request-stats'],
    queryFn: async () => {
      console.log('DEBUG: adminProfileId:', adminProfileId);
      if (!adminProfileId) {
        console.log('DEBUG: No adminProfileId found');
        return null;
      }

      // Get current admin's brgyid
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', adminProfileId)
        .single();

      console.log('DEBUG: Profile query result:', { profile, profileError });

      if (!profile?.brgyid) {
        console.log('DEBUG: No brgyid found in profile');
        return null;
      }

      console.log('DEBUG: Using brgyid:', profile.brgyid);

      // Get total documents count
      const { count: totalCount, error: totalError } = await supabase
        .from('docrequests')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', profile.brgyid);

      console.log('DEBUG: Total count query:', { totalCount, totalError });

      // Get pending requests count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('docrequests')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', profile.brgyid)
        .eq('status', 'pending');

      console.log('DEBUG: Pending count query:', { pendingCount, pendingError });

      // Get documents issued today (only those that have been processed by an admin)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: issuedTodayCount, error: issuedError } = await supabase
        .from('docrequests')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', profile.brgyid)
        .not('processedby', 'is', null)
        .in('status', ['approved', 'processing', 'completed'])
        .gte('updated_at', today.toISOString());

      console.log('DEBUG: Issued today query:', { issuedTodayCount, issuedError, todayISO: today.toISOString() });

      const stats = {
        total: totalCount || 0,
        pending: pendingCount || 0,
        issuedToday: issuedTodayCount || 0
      };

      console.log('DEBUG: Final stats:', stats);
      return stats;
    }
  });

  // Fetch document processing status data
  const { data: processingStats } = useQuery({
    queryKey: ['document-processing-stats', adminProfileId],
    queryFn: async () => {
      if (!adminProfileId) {
        console.log('DEBUG: No adminProfileId available');
        return {
          readyForPickup: 0,
          processing: 0,
          forReview: 0,
          released: 0,
          rejected: 0,
          avgProcessingTime: null
        };
      }

      // Get current admin's brgyid
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', adminProfileId)
        .single();

      if (!profile?.brgyid) {
        console.log('DEBUG: No brgyid found in profile');
        return {
          readyForPickup: 0,
          processing: 0,
          forReview: 0,
          released: 0,
          rejected: 0,
          avgProcessingTime: null
        };
      }

      console.log('DEBUG: Fetching document stats from docrequests table');
      const { data, error } = await supabase
        .from('docrequests')
        .select('status, created_at, updated_at')
        .eq('brgyid', profile.brgyid);
      
      console.log('DEBUG: Query result:', { data, error });
      
      if (error) {
        console.log('DEBUG: Query error:', error);
        throw error;
      }

      // Process the data to calculate statistics
      const stats = {
        readyForPickup: 0,
        processing: 0,
        forReview: 0,
        released: 0,
        rejected: 0,
        avgProcessingTime: null
      };

      data?.forEach((doc) => {
        const status = doc.status?.toLowerCase();
        
        console.log('DEBUG: Processing status:', status);
        
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

      console.log('DEBUG: Final processing stats:', stats);
      return stats;
    }
  });

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

  // Mock data for document requests - REPLACED WITH REAL DATA ABOVE
  // const documentRequests = [{...}];

  // Document tracking state
  const [documentTracking, setDocumentTracking] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [trackingCurrentPage, setTrackingCurrentPage] = useState(1);
  const [trackingTotalCount, setTrackingTotalCount] = useState(0);
  
  const trackingItemsPerPage = 5;

  // Fetch document tracking data with real-time updates
  useEffect(() => {
    fetchDocumentTracking();
    
    // Set up real-time subscription for document tracking
    const channel = supabase
      .channel('document-tracking-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'docrequests'
        },
        () => {
          // Refetch tracking data when changes occur
          fetchDocumentTracking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackingCurrentPage, trackingSearchQuery, trackingFilter]);

  // Reset page when search or filter changes
  useEffect(() => {
    if (trackingCurrentPage !== 1) {
      setTrackingCurrentPage(1);
    }
  }, [trackingSearchQuery, trackingFilter]);

  const fetchDocumentTracking = async () => {
    setTrackingLoading(true);
    try {
      let query = supabase
        .from('docrequests')
        .select('*', { count: 'exact' })
        .not('processedby', 'is', null)
        .neq('status', 'Request');

      // Apply search filter
      if (trackingSearchQuery) {
        query = query.or(`docnumber.ilike.%${trackingSearchQuery}%,receiver->>name.ilike.%${trackingSearchQuery}%`);
      }

      // Apply status filter
      if (trackingFilter !== 'All Documents') {
        if (trackingFilter === 'In Progress') {
          query = query.in('status', ['pending', 'processing']);
        } else if (trackingFilter === 'Completed') {
          query = query.in('status', ['approved', 'completed', 'released']);
        } else if (trackingFilter === 'Rejected') {
          query = query.eq('status', 'rejected');
        }
      }

      // Apply pagination
      const from = (trackingCurrentPage - 1) * trackingItemsPerPage;
      const to = from + trackingItemsPerPage - 1;
      query = query.range(from, to);

      // Order by updated_at desc
      query = query.order('updated_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching document tracking:', error);
        return;
      }

      // Map data to match the expected format
      const mappedData = data?.map(doc => {
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
            formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })
        };
      }) || [];

      setDocumentTracking(mappedData);
      setTrackingTotalCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready for pickup':
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800";
      case 'pending':
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800";
      case 'processing':
        return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800";
      case 'rejected':
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800/20 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready for pickup':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Eye className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Mock data for recent updates (should connect to actual data)
  const recentUpdates = useQuery({
    queryKey: ['recent-updates', adminProfileId],
    queryFn: async () => {
      if (!adminProfileId) return [];

      // Get current admin's brgyid
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', adminProfileId)
        .single();

      if (!profile?.brgyid) return [];

      // Get recent updates on document requests
      const { data, error } = await supabase
        .from('docrequests')
        .select('*')
        .eq('brgyid', profile.brgyid)
        .not('processedby', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data?.map(doc => {
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

        const getStatusString = (status: string) => {
          switch (status.toLowerCase()) {
            case 'approved':
            case 'ready':
              return 'Ready for Pickup';
            case 'processing':
              return 'Processing';
            case 'review':
              return 'For Review';
            case 'rejected':
              return 'Rejected';
            case 'released':
              return 'Released';
            default:
              return status;
          }
        };

        const getNotificationText = (status: string, name: string, type: string) => {
          switch (status.toLowerCase()) {
            case 'approved':
            case 'ready':
              return `Document for ${name} has been signed and is ready for pickup at the Barangay Hall.`;
            case 'processing':
              return `${name}'s document is being processed. Pending approval from the Barangay Captain.`;
            case 'review':
              return `${type} application for ${name} has been submitted for review. Pending verification of requirements.`;
            case 'rejected':
              return `${name}'s application for ${type} was rejected. Please contact the office for details.`;
            case 'released':
              return `${type} for ${name} has been successfully released.`;
            default:
              return `${type} for ${name} - Status: ${status}`;
          }
        };

        return {
          id: doc.id,
          name,
          status: getStatusString(doc.status),
          type: doc.type,
          time: formatDistanceToNow(new Date(doc.updated_at || doc.created_at), { addSuffix: true }),
          notification: getNotificationText(doc.status, name, doc.type)
        };
      }) || [];
    }
  });

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setIsRequestDetailsOpen(true);
  };

  const handleViewTrackingDetails = (item: any) => {
    setSelectedTrackingItem(item);
    setIsTrackingDetailsOpen(true);
  };

  const handleEditTrackingStatus = (item: any) => {
    setSelectedTrackingItem(item);
    setIsEditStatusOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTrackingItem) return;
    
    // Here you would update the status in the database
    toast({
      title: "Status Updated",
      description: `Document status updated to ${newStatus}`,
    });
    setIsEditStatusOpen(false);
    setSelectedTrackingItem(null);
  };

  // Real handlers for approve/deny actions
  const handleApproveRequest = async (id: string, name: string) => {
    if (!adminProfileId) {
      toast({
        title: "Error",
        description: "Admin profile not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('docrequests')
        .update({ 
          status: 'Pending',
          processedby: adminProfileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Request Approved",
        description: `${name}'s document request has been approved and moved to processing.`,
      });
      
      // The real-time subscription will handle the refresh
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDenyRequest = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('docrequests')
        .update({ 
          status: 'Rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Request Denied",
        description: `${name}'s document request has been denied.`,
      });
      
      // The real-time subscription will handle the refresh
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: "Error",
        description: "Failed to deny the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsAddDocumentOpen(true);
  };

  const handleDeleteClick = (template: any) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleViewTemplate = (template: any) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleTemplateSuccess = () => {
    setIsAddDocumentOpen(false);
    setEditingTemplate(null);
    refetchDocuments();
  };

  const handleCloseAddDocument = () => {
    setIsAddDocumentOpen(false);
    setEditingTemplate(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const totalPages = Math.ceil((documents.length || 0) / itemsPerPage);
  const paginatedDocumentTypes = documentTypes?.slice(startIndex, startIndex + itemsPerPage) || [];

  // Combined loading state for all data fetching
  const isPageLoading = isLoadingDocuments || requestsLoading || trackingLoading;

  return (
    <div className="w-full p-6 bg-background min-h-screen relative">
      {/* Localized loading screen that covers the whole page */}
      {isPageLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <FileText className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-primary/20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Loading documents</p>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Content only renders when not loading */}
      {!isPageLoading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Barangay Document Management</h1>
            <p className="text-muted-foreground">Manage official documents, requests, and issuances for the barangay community</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                    <p className="text-2xl font-bold text-foreground">{documentStats?.total || 0}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{documentStats?.pending || 0}</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issued Today</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{documentStats?.issuedToday || 0}</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processing Rate</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">87%</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Processing Status */}
          <Card className="mb-8 border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle className="text-foreground">Document Processing Progress</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average Processing Time</span>
                  <span className="font-medium text-foreground">1.2 days</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full" style={{
                  width: '70%'
                }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 days</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">1.2 days</span>
                  <span>3 days (target)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Requests and Quick Actions Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Document Requests Section with improved buttons */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  <CardTitle className="text-foreground">Document Requests</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentRequests.length > 0 ? (
                    <>
                      {documentRequests.map(request => 
                        <div 
                          key={request.id} 
                          className="flex items-center justify-between p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleRequestClick(request)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-foreground">{request.name.split(' ').map((n: string) => n[0]).join('')}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{request.name}</h4>
                              <p className="text-sm text-muted-foreground">{request.document}</p>
                              <p className="text-xs text-muted-foreground">{request.timeAgo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveRequest(request.id, request.name);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDenyRequest(request.id, request.name);
                              }}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Pagination for Document Requests */}
                      {totalCount > itemsPerPage && (
                        <div className="flex items-center justify-between pt-4">
                          <p className="text-sm text-muted-foreground">
                            Showing {documentRequests.length} of {totalCount} requests
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestsCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={requestsCurrentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {requestsCurrentPage} of {Math.ceil(totalCount / itemsPerPage)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRequestsCurrentPage(prev => prev + 1)}
                              disabled={requestsCurrentPage >= Math.ceil(totalCount / itemsPerPage)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">No pending requests</h3>
                      <p className="text-muted-foreground">All document requests have been processed.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setIsAddDocumentOpen(true)}
                    className="h-20 flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">Add Template</span>
                  </Button>
                  <Button 
                    onClick={() => setIsIssueDocumentOpen(true)}
                    className="h-20 flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Issue Document</span>
                  </Button>
                  <Button 
                    onClick={() => setIsSettingsDialogOpen(true)}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2 border-border text-foreground hover:bg-accent"
                  >
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">Settings</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2 border-border text-foreground hover:bg-accent"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Bulk Upload</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Status Updates */}
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Status Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUpdates.data && recentUpdates.data.length > 0 ? (
                  recentUpdates.data.map(update => (
                    <div key={update.id} className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">{update.name} - {update.type}</h4>
                          <span className="text-xs text-muted-foreground">{update.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{update.notification}</p>
                        <Badge className={`mt-2 ${getStatusBadgeClass(update.status)}`}>
                          {getStatusIcon(update.status)}
                          <span className="ml-1">{update.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No recent updates</h3>
                    <p className="text-muted-foreground">Document status updates will appear here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Tracking System */}
          <Card className="mb-8 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Document Tracking</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by ID or name..."
                      value={trackingSearchQuery}
                      onChange={(e) => setTrackingSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={trackingFilter} onValueChange={setTrackingFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Documents">All Documents</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document ID</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentTracking.length > 0 ? (
                      documentTracking.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.document}</TableCell>
                          <TableCell>{item.requestedBy}</TableCell>
                          <TableCell>
                            <Badge className={item.statusColor}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.lastUpdate}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewTrackingDetails(item)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditTrackingStatus(item)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Update Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground mb-2">No documents to track</h3>
                          <p className="text-muted-foreground">Processed documents will appear here for tracking.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination for Document Tracking */}
              {trackingTotalCount > trackingItemsPerPage && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {documentTracking.length} of {trackingTotalCount} documents
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrackingCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={trackingCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {trackingCurrentPage} of {Math.ceil(trackingTotalCount / trackingItemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrackingCurrentPage(prev => prev + 1)}
                      disabled={trackingCurrentPage >= Math.ceil(trackingTotalCount / trackingItemsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Library */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Document Library</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button onClick={() => setIsAddDocumentOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4">
                    {paginatedDocumentTypes.length > 0 ? (
                      <>
                        {paginatedDocumentTypes.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{doc.name}</h3>
                                <p className="text-sm text-muted-foreground">{doc.description || 'No description available'}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-muted-foreground">Fee: ₱{doc.fee || 0}</span>
                                  <span className="text-xs text-muted-foreground">Updated {formatDistanceToNow(new Date(doc.updated_at || doc.created_at), { addSuffix: true })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTemplate(doc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTemplate(doc)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(doc)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <Pagination>
                            <PaginationContent>
                              <PaginationPrevious 
                                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                              <PaginationNext 
                                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
                        <p className="text-muted-foreground mb-4">Start by creating your first document template.</p>
                        <Button onClick={() => setIsAddDocumentOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Document Template
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="templates" className="mt-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Document templates will be shown here</h3>
                    <p className="text-muted-foreground">Filter functionality coming soon.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="archived" className="mt-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No archived documents</h3>
                    <p className="text-muted-foreground">Archived documents will appear here.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      <DocumentTemplateForm
        template={editingTemplate}
        onClose={handleCloseAddDocument}
        onSuccess={handleTemplateSuccess}
      />

      <IssueDocumentForm />

      <DocumentViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        template={selectedTemplate}
      />

      <DocumentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        template={selectedTemplate}
        onDeleteSuccess={refetchDocuments}
      />

      <DocumentSettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />

      <DocumentRequestDetailsModal
        isOpen={isRequestDetailsOpen}
        onClose={() => setIsRequestDetailsOpen(false)}
        request={selectedRequest}
        onApprove={handleApproveRequest}
        onDeny={handleDenyRequest}
      />
    </div>
  );
};

export default DocumentsPage;