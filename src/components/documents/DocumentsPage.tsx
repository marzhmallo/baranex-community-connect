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
import LocalizedLoadingScreen from "@/components/ui/LocalizedLoadingScreen";

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
  
  // Document tracking state  
  const [documentTracking, setDocumentTracking] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [trackingCurrentPage, setTrackingCurrentPage] = useState(1);
  const [trackingTotalCount, setTrackingTotalCount] = useState(0);
  
  const itemsPerPage = 3;
  const trackingItemsPerPage = 5;
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
    },
    staleTime: 0,
    refetchOnWindowFocus: false
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
  const { data: documentStats, isLoading: isLoadingStats } = useQuery({
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
  const { data: processingStats, isLoading: isLoadingProcessing } = useQuery({
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800";
      case "processing":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800";
      case "review":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800/20 dark:border-gray-700";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "review":
        return <Eye className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Fetch recent document status updates from docrequests table
  const { data: statusUpdates } = useQuery({
    queryKey: ['document-status-updates', adminProfileId],
    queryFn: async () => {
      if (!adminProfileId) return [];
      
      // Get current admin's brgyid
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', adminProfileId)
        .single();

      if (!profile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('docrequests')
        .select(`
          id,
          docnumber,
          type,
          status,
          updated_at,
          receiver
        `)
        .eq('brgyid', profile.brgyid)
        .not('status', 'eq', 'Request')
        .order('updated_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      
      return data?.map(doc => {
        let requesterName = 'Unknown';
        if (doc.receiver) {
          try {
            if (typeof doc.receiver === 'object' && doc.receiver !== null && !Array.isArray(doc.receiver)) {
              requesterName = (doc.receiver as any).name || 'Unknown';
            } else if (typeof doc.receiver === 'string') {
              const parsed = JSON.parse(doc.receiver);
              requesterName = parsed.name || 'Unknown';
            }
          } catch {
            requesterName = 'Unknown';
          }
        }

        const getStatusText = (status: string) => {
          switch (status.toLowerCase()) {
            case 'approved':
            case 'ready':
              return 'Ready for Pickup';
            case 'processing':
              return 'Processing';
            case 'pending':
              return 'For Review';
            case 'rejected':
              return 'Rejected';
            case 'released':
              return 'Released';
            default:
              return status;
          }
        };

        const getDescriptionText = (status: string, type: string, name: string) => {
          switch (status.toLowerCase()) {
            case 'approved':
            case 'ready':
              return `Document for ${name} has been signed and is ready for pickup at the Barangay Hall.`;
            case 'processing':
              return `${name}'s document is being processed. Pending approval from the Barangay Captain.`;
            case 'pending':
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
          title: `${doc.type} - ${getStatusText(doc.status)}`,
          description: getDescriptionText(doc.status, doc.type, requesterName),
          time: formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true }),
          status: doc.status.toLowerCase(),
          trackingId: doc.docnumber
        };
      }) || [];
    },
    enabled: !!adminProfileId
  });

  // Handler to open request details modal
  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    setIsRequestDetailsOpen(true);
  };

  // Handler to view tracking item details
  const handleViewTrackingDetails = async (trackingItem: any) => {
    try {
      // Fetch full request details using docnumber
      const { data, error } = await supabase
        .from('docrequests')
        .select('*')
        .eq('docnumber', trackingItem.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch request details",
          variant: "destructive",
        });
        return;
      }

      // Transform data to match expected format
      let name = 'Unknown';
      if (data.receiver) {
        try {
          if (typeof data.receiver === 'object' && data.receiver !== null && !Array.isArray(data.receiver)) {
            name = (data.receiver as any).name || 'Unknown';
          } else if (typeof data.receiver === 'string') {
            const parsed = JSON.parse(data.receiver);
            name = parsed.name || 'Unknown';
          }
        } catch {
          name = 'Unknown';
        }
      }

      const requestData = {
        ...data,
        name
      };

      setSelectedRequest(requestData);
      setIsRequestDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching tracking details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch request details",
        variant: "destructive",
      });
    }
  };

  // Handler to edit tracking item status
  const handleEditTrackingStatus = (trackingItem: any) => {
    setSelectedTrackingItem(trackingItem);
    setIsEditStatusOpen(true);
  };

  // Handler to update request status
  const handleUpdateStatus = async (docnumber: string, newStatus: string) => {
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
          status: newStatus,
          processedby: adminProfileId,
          updated_at: new Date().toISOString()
        })
        .eq('docnumber', docnumber);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Request status updated to ${newStatus}`,
      });

      // Refresh tracking data
      fetchDocumentTracking();
      setIsEditStatusOpen(false);
      setSelectedTrackingItem(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
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
        description: `Approved request for ${name}`,
      });

      // Refresh the list
      fetchDocumentRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleDenyRequest = async (id: string, name: string) => {
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
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Request Denied",
        description: `Denied and removed request for ${name}`,
      });

      // Refresh the list
      fetchDocumentRequests();
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: "Error",
        description: "Failed to deny request",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsAddDocumentOpen(true);
  };

  const handleDeleteClick = (template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Refetch the data instead of reloading the page
    refetchDocuments();
    setSelectedTemplate(null);
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleTemplateSuccess = () => {
    setEditingTemplate(null);
    // Refetch the data instead of reloading the page
    refetchDocuments();
  };

  const handleCloseAddDocument = () => {
    setIsAddDocumentOpen(false);
    setEditingTemplate(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate pagination for document types
  const totalPages = Math.ceil((documentTypes?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocumentTypes = documentTypes?.slice(startIndex, startIndex + itemsPerPage) || [];

  // Show loading screen on initial page load while essential data is being fetched
  const isInitialLoading = requestsLoading || trackingLoading || isLoadingStats || isLoadingProcessing;
  
  if (isInitialLoading) {
    return (
      <div className="relative w-full min-h-screen">
        <LocalizedLoadingScreen isLoading={true} />
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-background min-h-screen">
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
                <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{documentTypes?.length || 0}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Processing Status */}
      <Card className="mb-8 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              <CardTitle className="text-lg text-foreground">Document Processing Status</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="week">
                <SelectTrigger className="w-32 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready for Pickup</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{processingStats?.readyForPickup || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{processingStats?.processing || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">For Review</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{processingStats?.forReview || 0}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Released</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{processingStats?.released || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{processingStats?.rejected || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing Time (Average)</span>
              <span>Updated: Today, 11:30 AM</span>
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
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="ml-2 text-sm text-muted-foreground">Loading requests...</p>
              </div>
            ) : (
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
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveRequest(request.id, request.name);
                            }}
                            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDenyRequest(request.id, request.name);
                            }}
                            className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    )}
                    
                     {/* Pagination */}
                     {Math.ceil(totalCount / itemsPerPage) > 1 && (
                       <div className="flex items-center justify-between pt-4">
                         <p className="text-xs text-muted-foreground">
                           Page {requestsCurrentPage} of {Math.ceil(totalCount / itemsPerPage)}
                         </p>
                         <div className="flex items-center space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setRequestsCurrentPage(prev => Math.max(prev - 1, 1))}
                             disabled={requestsCurrentPage === 1}
                           >
                             <ChevronLeft className="h-3 w-3" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setRequestsCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
                             disabled={requestsCurrentPage === Math.ceil(totalCount / itemsPerPage)}
                           >
                             <ChevronRight className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                     )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No pending requests found</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Section */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="flex items-center gap-2 justify-start h-auto p-4 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
                onClick={() => setIsIssueDocumentOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Issue New Document</div>
                  <div className="text-xs">Create and issue documents</div>
                </div>
              </Button>
              
              <Button className="flex items-center gap-2 justify-start h-auto p-4 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                <Upload className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Upload Template</div>
                  <div className="text-xs">Add new document templates</div>
                </div>
              </Button>
              
              <Button className="flex items-center gap-2 justify-start h-auto p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800">
                <BarChart3 className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-xs">Document statistics and analytics</div>
                </div>
              </Button>
              
              <Button className="flex items-center gap-2 justify-start h-auto p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800" onClick={() => setIsSettingsDialogOpen(true)}>
                <Settings className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">System Settings</div>
                  <div className="text-xs">Configure document settings</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Tracking System */}
      <Card className="mb-8 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <CardTitle className="text-foreground">Document Tracking System</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search by tracking ID..." value={trackingSearchQuery} onChange={e => setTrackingSearchQuery(e.target.value)} className="pl-10 border-border bg-background text-foreground" />
            </div>
            <div className="flex gap-2">
              {["All Documents", "In Progress", "Completed", "Rejected"].map(filter => <Button key={filter} variant={trackingFilter === filter ? "default" : "outline"} size="sm" onClick={() => setTrackingFilter(filter)} className={trackingFilter === filter ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-border text-foreground hover:bg-accent"}>
                  {filter}
                </Button>)}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-foreground">Tracking ID</TableHead>
                <TableHead className="text-foreground">Document</TableHead>
                <TableHead className="text-foreground">Requested By</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Last Update</TableHead>
                <TableHead className="text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentTracking.map(doc => <TableRow key={doc.id} className="border-border hover:bg-accent">
                  <TableCell>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">{doc.id}</span>
                  </TableCell>
                  <TableCell className="text-foreground">{doc.document}</TableCell>
                  <TableCell className="text-foreground">{doc.requestedBy}</TableCell>
                  <TableCell>
                    <Badge className={`${doc.statusColor} text-white`}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.lastUpdate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-accent"
                        onClick={() => handleViewTrackingDetails(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-accent"
                        onClick={() => handleEditTrackingStatus(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(trackingItemsPerPage, trackingTotalCount)} of {trackingTotalCount} documents
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrackingCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={trackingCurrentPage === 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {trackingCurrentPage} of {Math.ceil(trackingTotalCount / trackingItemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrackingCurrentPage(prev => Math.min(prev + 1, Math.ceil(trackingTotalCount / trackingItemsPerPage)))}
                disabled={trackingCurrentPage === Math.ceil(trackingTotalCount / trackingItemsPerPage)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Library */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-foreground">Document Library</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-64 border-border bg-background text-foreground" />
                  </div>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setIsAddDocumentOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 border-b border-border">
                  <TabsList className="bg-transparent h-auto p-0">
                    <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 rounded-none text-foreground">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="certificates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 rounded-none text-foreground">
                      Certificates
                    </TabsTrigger>
                    <TabsTrigger value="permits" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 rounded-none text-foreground">
                      Permits
                    </TabsTrigger>
                    <TabsTrigger value="clearances" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 rounded-none text-foreground">
                      Clearances
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                          <Filter className="h-4 w-4 mr-2" />
                          Advanced Filters
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                          Bulk Actions
                        </Button>
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                          Apply
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {isLoadingDocuments ? (
                        <div className="text-center py-8 text-muted-foreground">Loading document templates...</div>
                      ) : paginatedDocumentTypes && paginatedDocumentTypes.length > 0 ? (
                        paginatedDocumentTypes.map(doc => <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex items-center gap-4">
                              <input type="checkbox" className="rounded border-border" />
                              <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                                <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{doc.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {doc.description ? `${doc.description} • ` : ''}
                                  Fee: ₱{doc.fee || 0}
                                  {doc.validity_days ? ` • Valid for ${doc.validity_days} days` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                                Active
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => handleViewTemplate(doc)} className="hover:bg-accent">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(doc)} className="hover:bg-accent">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(doc)} className="hover:bg-accent">
                                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>)
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No document templates found.</p>
                          <p className="text-sm text-muted-foreground">Add a new template to get started.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="border-border" />
                        <span className="text-sm text-muted-foreground">Select All</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                    </div>
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
