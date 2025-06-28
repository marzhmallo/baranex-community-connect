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
import DocumentRequestForm from "./DocumentRequestForm";
import IssueDocumentForm from "./IssueDocumentForm";

const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("All Documents");
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isIssueDocumentOpen, setIsIssueDocumentOpen] = useState(false);

  // Fetch document types from the database
  const { data: documentTypes, isLoading: isLoadingDocuments } = useQuery({
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
        return "text-green-600 bg-green-50 border-green-200";
      case "processing":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "review":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
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

  return <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Barangay Document Management</h1>
        <p className="text-gray-600">Central hub for managing document requests and tracking their status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">23</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">8</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready for Pickup</p>
                <p className="text-2xl font-bold text-blue-600">{processingStats?.readyForPickup || 18}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Document Processing Status</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="week">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready for Pickup</p>
                <p className="text-2xl font-bold text-green-600">{processingStats?.readyForPickup || 18}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">{processingStats?.processing || 12}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">For Review</p>
                <p className="text-2xl font-bold text-blue-600">{processingStats?.forReview || 7}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Released</p>
                <p className="text-2xl font-bold text-purple-600">{processingStats?.released || 42}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{processingStats?.rejected || 3}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Processing Time (Average)</span>
              <span>Updated: Today, 11:30 AM</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{
              width: '70%'
            }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 days</span>
              <span className="font-medium text-purple-600">1.2 days</span>
              <span>3 days (target)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Requests and Quick Actions Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Document Requests Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>Document Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentRequests.map(request => <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{request.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{request.name}</h4>
                      <p className="text-sm text-gray-500">{request.document}</p>
                      <p className="text-xs text-gray-400">{request.timeAgo}</p>
                    </div>
                  </div>
                  <Badge className={`${request.statusColor} text-white hover:${request.statusColor}/80`}>
                    {request.status}
                  </Badge>
                </div>)}
              <div className="flex justify-center pt-4">
                <Button variant="link" className="text-purple-600">
                  View All Requests →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <Button 
                className="flex items-center gap-2 justify-start h-auto p-4 bg-purple-100 text-purple-800 hover:bg-purple-200"
                onClick={() => setIsAddDocumentOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Log Document Request</div>
                  <div className="text-xs">Record new document requests from residents</div>
                </div>
              </Button>
              
              <Button 
                className="flex items-center gap-2 justify-start h-auto p-4 bg-green-100 text-green-800 hover:bg-green-200"
                onClick={() => setIsIssueDocumentOpen(true)}
              >
                <FileCheck className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Update Request Status</div>
                  <div className="text-xs">Update status of existing requests</div>
                </div>
              </Button>
              
              <Button className="flex items-center gap-2 justify-start h-auto p-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
                <BarChart3 className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-xs">Document statistics and analytics</div>
                </div>
              </Button>
              
              <Button className="flex items-center gap-2 justify-start h-auto p-4 bg-orange-100 text-orange-800 hover:bg-orange-200">
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

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              <CardTitle>Document Tracking System</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search by tracking ID..." value={trackingSearchQuery} onChange={e => setTrackingSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {["All Documents", "In Progress", "Completed", "Rejected"].map(filter => <Button key={filter} variant={trackingFilter === filter ? "default" : "outline"} size="sm" onClick={() => setTrackingFilter(filter)} className={trackingFilter === filter ? "bg-purple-600 hover:bg-purple-700" : ""}>
                  {filter}
                </Button>)}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentTracking.map(doc => <TableRow key={doc.id}>
                  <TableCell>
                    <span className="text-purple-600 font-medium">{doc.id}</span>
                  </TableCell>
                  <TableCell>{doc.document}</TableCell>
                  <TableCell>{doc.requestedBy}</TableCell>
                  <TableCell>
                    <Badge className={`${doc.statusColor} text-white`}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{doc.lastUpdate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Showing 5 of 42 documents
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Request Management */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Document Request Management</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Manage and track all document requests from residents</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Search requests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-64" />
                  </div>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setIsAddDocumentOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Document Creation Outside System</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        This system tracks document requests only. Actual certificates and documents must be created outside the system by administrators.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Requests</h3>
                  <p className="text-gray-500 mb-4">Start by logging a new document request from a resident.</p>
                  <Button onClick={() => setIsAddDocumentOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Log First Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Status Updates Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-green-100 p-1 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                Document Status Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {statusUpdates.map((update, index) => <div key={update.id} className={`p-4 border-b border-gray-100 ${index === statusUpdates.length - 1 ? 'border-b-0' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded-full border-2 ${getStatusColor(update.status)}`}>
                        {getStatusIcon(update.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">{update.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{update.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{update.time}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {update.trackingId}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" className="w-full text-sm">
                  View All Updates →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Document Request Dialog */}
      <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DocumentRequestForm onClose={() => setIsAddDocumentOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Issue Document Dialog */}
      <Dialog open={isIssueDocumentOpen} onOpenChange={setIsIssueDocumentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <IssueDocumentForm onClose={() => setIsIssueDocumentOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>;
};

export default DocumentsPage;
