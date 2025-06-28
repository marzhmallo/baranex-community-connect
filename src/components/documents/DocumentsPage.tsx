
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Edit, Trash2, Search, Plus, Filter, MoreHorizontal, Clock, CheckCircle, AlertCircle, XCircle, Eye, Upload, BarChart3, Settings, FileCheck, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentTemplateForm from "./DocumentTemplateForm";
import IssueDocumentForm from "./IssueDocumentForm";
import DocumentViewDialog from "./DocumentViewDialog";
import DocumentDeleteDialog from "./DocumentDeleteDialog";

const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("All Documents");
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isIssueDocumentOpen, setIsIssueDocumentOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Fetch document types from the database
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

  // Fetch document processing status data
  const { data: processingStats } = useQuery({
    queryKey: ['document-processing-stats'],
    queryFn: async () => {
      const { data: issuedDocs, error } = await supabase
        .from('issued_documents')
        .select('status, created_at, expiry_date');
      
      if (error) throw error;

      const now = new Date();
      const stats = {
        readyForPickup: 0,
        processing: 0,
        forReview: 0,
        released: 0,
        rejected: 0
      };

      issuedDocs?.forEach(doc => {
        const status = doc.status?.toLowerCase();
        if (status === 'issued' || status === 'ready') {
          stats.readyForPickup++;
        } else if (status === 'processing' || status === 'pending') {
          stats.processing++;
        } else if (status === 'review' || status === 'for_review') {
          stats.forReview++;
        } else if (status === 'released' || status === 'completed') {
          stats.released++;
        } else if (status === 'rejected' || status === 'denied') {
          stats.rejected++;
        }
      });

      return stats;
    }
  });

  // Mock data for documents
  const documents = [{
    id: "1",
    name: "Barangay Clearance Template",
    type: "template",
    status: "Active",
    size: "45 kB",
    updatedAt: "2 hours ago",
    icon: FileText,
    color: "text-red-500"
  }, {
    id: "2",
    name: "Certificate of Residency",
    type: "template",
    status: "Active",
    size: "32 kB",
    updatedAt: "1 day ago",
    icon: FileText,
    color: "text-blue-500"
  }, {
    id: "3",
    name: "Business Permit Form",
    type: "template",
    status: "Active",
    size: "28 kB",
    updatedAt: "3 days ago",
    icon: FileText,
    color: "text-green-500"
  }, {
    id: "4",
    name: "Barangay ID Application",
    type: "template",
    status: "Active",
    size: "41 kB",
    updatedAt: "1 week ago",
    icon: FileText,
    color: "text-purple-500"
  }];

  // Mock data for document requests
  const documentRequests = [{
    id: "1",
    name: "Maria Santos",
    document: "Barangay Clearance",
    timeAgo: "2 hours ago",
    status: "Approve",
    statusColor: "bg-green-500"
  }, {
    id: "2",
    name: "Juan Dela Cruz",
    document: "Certificate of Residency",
    timeAgo: "5 hours ago",
    status: "Deny",
    statusColor: "bg-red-500"
  }, {
    id: "3",
    name: "Anna Reyes",
    document: "Business Permit",
    timeAgo: "1 day ago",
    status: "Approve",
    statusColor: "bg-green-500"
  }];

  // Mock data for document tracking
  const documentTracking = [{
    id: "#BRG-2023-0042",
    document: "Barangay Clearance",
    requestedBy: "Maria Santos",
    status: "Ready for pickup",
    statusColor: "bg-green-500",
    lastUpdate: "Today, 10:45 AM"
  }, {
    id: "#BRG-2023-0041",
    document: "Certificate of Residency",
    requestedBy: "Juan Dela Cruz",
    status: "Processing",
    statusColor: "bg-yellow-500",
    lastUpdate: "Today, 9:20 AM"
  }, {
    id: "#BRG-2023-0040",
    document: "Business Permit",
    requestedBy: "Anna Reyes",
    status: "For Review",
    statusColor: "bg-blue-500",
    lastUpdate: "Yesterday, 4:30 PM"
  }, {
    id: "#BRG-2023-0039",
    document: "Barangay ID",
    requestedBy: "Carlos Mendoza",
    status: "Rejected",
    statusColor: "bg-red-500",
    lastUpdate: "2 days ago"
  }, {
    id: "#BRG-2023-0038",
    document: "Indigency Certificate",
    requestedBy: "Elena Garcia",
    status: "Released",
    statusColor: "bg-purple-500",
    lastUpdate: "3 days ago"
  }];
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

  // Mock data for document status updates
  const statusUpdates = [{
    id: "1",
    title: "Barangay Clearance - Ready for Pickup",
    description: "Document for Maria Santos has been signed and is ready for pickup at the Barangay Hall.",
    time: "10 minutes ago",
    status: "ready",
    trackingId: "#BRG-2023-0042"
  }, {
    id: "2",
    title: "Certificate of Residency - Processing",
    description: "Juan Dela Cruz's document is being processed. Pending approval from the Barangay Captain.",
    time: "2 hours ago",
    status: "processing",
    trackingId: "#BRG-2023-0041"
  }, {
    id: "3",
    title: "Business Permit - For Review",
    description: "Business Permit application for Anna Reyes has been submitted for review. Pending verification of business requirements.",
    time: "5 hours ago",
    status: "review",
    trackingId: "#BRG-2023-0040"
  }, {
    id: "4",
    title: "Barangay ID - Rejected",
    description: "Carlos Mendoza's application for Barangay ID was rejected. Reason: insufficient supporting documents.",
    time: "Yesterday, 2:15 PM",
    status: "rejected",
    trackingId: "#BRG-2023-0039"
  }];

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

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-background min-h-screen">
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
                <p className="text-2xl font-bold text-foreground">1,247</p>
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
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">23</p>
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
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">8</p>
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
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{processingStats?.readyForPickup || 18}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{processingStats?.processing || 12}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">For Review</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{processingStats?.forReview || 7}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Released</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{processingStats?.released || 42}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{processingStats?.rejected || 3}</p>
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
        {/* Document Requests Section */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle className="text-foreground">Document Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentRequests.map(request => <div key={request.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-foreground">{request.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{request.name}</h4>
                      <p className="text-sm text-muted-foreground">{request.document}</p>
                      <p className="text-xs text-muted-foreground">{request.timeAgo}</p>
                    </div>
                  </div>
                  <Badge className={`${request.statusColor} text-white hover:${request.statusColor}/80`}>
                    {request.status}
                  </Badge>
                </div>)}
              <div className="flex justify-center pt-4">
                <Button variant="link" className="text-purple-600 dark:text-purple-400">
                  View All Requests →
                </Button>
              </div>
            </div>
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
              
              <Button className="flex items-center gap-2 justify-start h-auto p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
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
                      <Button variant="ghost" size="sm" className="hover:bg-accent">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-accent">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing 5 of 42 documents
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" className="hover:bg-accent" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive className="bg-primary text-primary-foreground">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" className="hover:bg-accent">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" className="hover:bg-accent">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" className="hover:bg-accent" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
                {statusUpdates.map((update, index) => <div key={update.id} className={`p-4 border-b border-border ${index === statusUpdates.length - 1 ? 'border-b-0' : ''}`}>
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
    </div>
  );
};

export default DocumentsPage;
