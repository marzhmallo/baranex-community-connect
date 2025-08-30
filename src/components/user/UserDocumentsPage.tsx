import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
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
const UserDocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const {
    userProfile
  } = useAuth();

  // Fetch user's document requests from Supabase with real-time updates
  const {
    data: documentRequests = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['user-document-requests', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const {
        data,
        error
      } = await supabase.from('docrequests').select('*').eq('resident_id', userProfile.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data || [];
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

  // Pagination for document requests
  const requestsPerPage = 4;
  const requestsTotalPages = Math.ceil(documentRequests.length / requestsPerPage);

  // Filter and sort document types by active tab and search query
  const normalize = (s: any) => String(s || '').trim().toLowerCase();
  const knownTypes = ['certificate', 'certificates', 'permit', 'permits', 'clearance', 'clearances', 'ids', 'identification', 'other'];
  
  const filteredDocumentTypes = (documentTypes || []).filter((dt: any) => {
    // Filter by search query first
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = (dt.name || '').toLowerCase().includes(searchLower);
      const matchesDescription = (dt.description || '').toLowerCase().includes(searchLower);
      const matchesType = (dt.type || '').toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesDescription && !matchesType) {
        return false;
      }
    }
    
    // Then filter by tab
    const t = normalize(dt.type);
    if (activeTab === 'all') return true;
    if (activeTab === 'certificates') return t === 'certificate' || t === 'certificates';
    if (activeTab === 'permits') return t === 'permit' || t === 'permits';
    if (activeTab === 'clearances') return t === 'clearance' || t === 'clearances';
    if (activeTab === 'ids') return t === 'ids' || t === 'identification';
    if (activeTab === 'other') return t === 'other' || !knownTypes.includes(t);
    return true;
  });

  const sortedDocumentTypes = filteredDocumentTypes.slice().sort((a: any, b: any) => {
    const at = normalize(a.type);
    const bt = normalize(b.type);
    if (at < bt) return -1;
    if (at > bt) return 1;
    const an = normalize(a.name);
    const bn = normalize(b.name);
    if (an < bn) return -1;
    if (an > bn) return 1;
    return 0;
  });

  const totalPages = Math.ceil((sortedDocumentTypes.length || 0) / itemsPerPage);
  
  // Calculate paginated data using filtered and sorted data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = sortedDocumentTypes.slice(startIndex, endIndex);

  // Calculate paginated document requests
  const requestsStartIndex = (requestsCurrentPage - 1) * requestsPerPage;
  const requestsEndIndex = requestsStartIndex + requestsPerPage;
  const paginatedRequests = documentRequests.slice(requestsStartIndex, requestsEndIndex);
  // Reset page when search query or tab changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, activeTab]);

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
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready for pickup':
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'for review':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      case 'released':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
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
  return <div className="w-full p-6 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Barangay Document Management</h1>
        <p className="text-muted-foreground">Manage official documents, requests, and issuances for the barangay community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm p-4 col-span-full border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              My Document Status
            </h2>
            <div className="flex gap-2">
              <button onClick={() => refetch()} className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {documentRequests.filter(req => matchesStatus(req.status, 'pending')).length}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Processing</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {documentRequests.filter(req => matchesStatus(req.status, 'processing')).length}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                <Hourglass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Ready to Pickup</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {documentRequests.filter(req => matchesAnyStatus(req.status, ['approved', 'ready'])).length}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed'])).length}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {documentRequests.filter(req => matchesStatus(req.status, 'rejected')).length}
                </p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
            <span>Total Documents: {documentRequests.length}</span>
            <span>Last Updated: {documentRequests.length > 0 ? formatDate(new Date(Math.max(...documentRequests.map(req => new Date(req.updated_at || req.created_at).getTime()))).toISOString()) : 'No documents'}</span>
          </div>
          
          {documentRequests.length > 0 && <>
              <div className="w-full bg-muted rounded-full h-2.5 mb-1">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{
              width: `${Math.round(documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed', 'approved'])).length / documentRequests.length * 100)}%`
            }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">0%</span>
                <span className="font-medium text-primary">
                  {Math.round(documentRequests.filter(req => matchesAnyStatus(req.status, ['released', 'completed', 'approved'])).length / documentRequests.length * 100)}% Completed
                </span>
                <span className="text-muted-foreground">100%</span>
              </div>
            </>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowRequestModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Document
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
                    <TabsTrigger value="ids" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 rounded-none text-foreground">
                      IDs
                    </TabsTrigger>
                    <TabsTrigger value="other" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 dark:data-[state=active]:border-purple-400 rounded-none text-foreground">
                      Other
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="p-6">
                    

                    <div className="space-y-3">
                      {isLoadingTemplates ? <div className="text-center py-8 text-muted-foreground">Loading document templates...</div> : paginatedTemplates && paginatedTemplates.length > 0 ? paginatedTemplates.map(doc => <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
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
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                                Active
                              </Badge>
                              <Button variant="ghost" size="sm" className="hover:bg-accent">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>) : <div className="text-center py-8">
                          <p className="text-muted-foreground">No document templates found.</p>
                          <p className="text-sm text-muted-foreground">Request documents from available templates.</p>
                        </div>}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Showing {Math.min(paginatedTemplates?.length || 0, itemsPerPage)} of {sortedDocumentTypes?.length || 0} documents
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious onClick={() => handlePageChange(Math.max(1, currentPage - 1))} className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`} />
                            </PaginationItem>
                            {Array.from({
                            length: totalPages
                          }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                                <PaginationLink onClick={() => handlePageChange(page)} isActive={currentPage === page} className={`cursor-pointer ${currentPage === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                                  {page}
                                </PaginationLink>
                              </PaginationItem>)}
                            <PaginationItem>
                              <PaginationNext onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-accent"}`} />
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

        <div className="space-y-6">
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

      <div className="mb-8 bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Document Tracking System
            </h2>
            <div className="flex gap-3">
              <Button onClick={() => setShowRequestModal(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Request Document
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input type="text" placeholder="Search by tracking ID..." className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64 bg-background text-foreground" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm hover:bg-primary/20 transition-colors">All Documents</button>
              <button className="bg-muted text-foreground px-3 py-1 rounded-full text-sm hover:bg-muted/80 transition-colors">In Progress</button>
              <button className="bg-muted text-foreground px-3 py-1 rounded-full text-sm hover:bg-muted/80 transition-colors">Completed</button>
              <button className="bg-muted text-foreground px-3 py-1 rounded-full text-sm hover:bg-muted/80 transition-colors">Rejected</button>
            </div>
          </div>
          
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {userProfile?.firstname} {userProfile?.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor(request.status)}`}></div>
                          <span className="text-sm text-foreground capitalize">{request.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(request.updated_at || request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>)}
              </tbody>
            </table>
          </div>
          
          {requestsTotalPages > 1 && <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {requestsStartIndex + 1} to {Math.min(requestsEndIndex, documentRequests.length)} of {documentRequests.length} requests
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleRequestsPageChange(requestsCurrentPage - 1)} disabled={requestsCurrentPage === 1} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${requestsCurrentPage === 1 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-accent'}`}>
                  Previous
                </button>
                <div className="flex">
                  {Array.from({
                length: requestsTotalPages
              }, (_, i) => i + 1).map(page => <button key={page} onClick={() => handleRequestsPageChange(page)} className={`px-3 py-1 text-sm rounded-md font-medium ${requestsCurrentPage === page ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}`}>
                      {page}
                    </button>)}
                </div>
                <button onClick={() => handleRequestsPageChange(requestsCurrentPage + 1)} disabled={requestsCurrentPage === requestsTotalPages} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${requestsCurrentPage === requestsTotalPages ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-accent'}`}>
                  Next
                </button>
              </div>
            </div>}
        </div>
      </div>


      {showIssueForm && <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
            <DocumentIssueForm onClose={() => setShowIssueForm(false)} />
          </div>
        </div>}

      {showRequestModal && <DocumentRequestModal onClose={() => setShowRequestModal(false)} />}
    </div>;
};
export default UserDocumentsPage;