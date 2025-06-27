
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, FileText, Clock, Users, Star, Calendar, Filter, MoreHorizontal, Edit, Trash2, Copy, Download, Eye, BarChart3, Settings, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface DocumentType {
  id: string;
  created_at: string;
  name: string;
  description: string;
  template: string;
  fee: number;
  validity_days: number;
  required_fields: any;
  brgyid?: string;
  content?: string;
  updated_at?: string;
}

interface DocumentRequest {
  id: string;
  name: string;
  document: string;
  timeAgo: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DocumentStatusUpdate {
  id: string;
  document: string;
  status: string;
  timeAgo: string;
  description: string;
  trackingId: string;
}

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("All Documents");

  // Mock data for demonstration
  const documentStats = {
    totalDocuments: 1247,
    pendingRequests: 23,
    issuedToday: 8,
    activeTemplates: 5
  };

  const processingStatus = {
    readyForPickup: 18,
    processing: 12,
    forReview: 7,
    released: 42,
    rejected: 3
  };

  const documentTemplates = [
    { id: 1, name: "Barangay Certification", description: "General certification of residency with personal information", fee: "₱50", status: "Active" },
    { id: 2, name: "Barangay Clearance", description: "General purpose clearance for residents", fee: "₱50", status: "Active" },
    { id: 3, name: "Certificate of Residency", description: "Certifies that a person is a resident of the barangay", fee: "₱30", status: "Active" },
    { id: 4, name: "Business Permit", description: "Permit for operating a business within the barangay", fee: "₱100", status: "Active" }
  ];

  const trackingDocuments = [
    { id: "#BRG-2023-0042", document: "Barangay Clearance", requestedBy: "Maria Santos", status: "Ready for pickup", lastUpdate: "Today, 10:45 AM" },
    { id: "#BRG-2023-0041", document: "Certificate of Residency", requestedBy: "Juan Dela Cruz", status: "Processing", lastUpdate: "Today, 9:20 AM" },
    { id: "#BRG-2023-0040", document: "Business Permit", requestedBy: "Anna Reyes", status: "For Review", lastUpdate: "Yesterday, 4:30 PM" }
  ];

  const documentRequests: DocumentRequest[] = [
    { id: "1", name: "Maria Santos", document: "Barangay Clearance", timeAgo: "2 hours ago", status: "pending" },
    { id: "2", name: "Juan Dela Cruz", document: "Certificate of Residency", timeAgo: "5 hours ago", status: "pending" },
    { id: "3", name: "Anna Reyes", document: "Business Permit", timeAgo: "1 day ago", status: "pending" }
  ];

  const documentStatusUpdates: DocumentStatusUpdate[] = [
    {
      id: "1",
      document: "Barangay Clearance",
      status: "Ready for pickup",
      timeAgo: "10 minutes ago",
      description: "Document for Maria Santos has been signed and is ready for pickup at the Barangay Hall.",
      trackingId: "#BRG-2023-0042"
    },
    {
      id: "2", 
      document: "Certificate of Residency",
      status: "Processing",
      timeAgo: "2 hours ago",
      description: "Juan Dela Cruz's document is being processed. Pending approval from the Barangay Captain.",
      trackingId: "#BRG-2023-0041"
    },
    {
      id: "3",
      document: "Business Permit", 
      status: "For Review",
      timeAgo: "5 hours ago",
      description: "Business Permit application for Anna Reyes has been submitted for review. Pending verification of business requirements.",
      trackingId: "#BRG-2023-0040"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Ready for pickup": "bg-green-100 text-green-800",
      "Processing": "bg-yellow-100 text-yellow-800",
      "For Review": "bg-blue-100 text-blue-800",
      "Released": "bg-purple-100 text-purple-800",
      "Rejected": "bg-red-100 text-red-800"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      "Ready for pickup": "bg-green-500",
      "Processing": "bg-yellow-500", 
      "For Review": "bg-blue-500",
      "Released": "bg-purple-500",
      "Rejected": "bg-red-500"
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-500";
  };

  const handleApproveRequest = (requestId: string) => {
    toast({
      title: "Request Approved",
      description: "Document request has been approved successfully.",
    });
  };

  const handleDenyRequest = (requestId: string) => {
    toast({
      title: "Request Denied",
      description: "Document request has been denied.",
      variant: "destructive",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barangay Document Management</h1>
          <p className="text-muted-foreground">
            Manage official documents, requests, and issuances for the barangay community
          </p>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.totalDocuments.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.pendingRequests}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued Today</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.issuedToday}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.activeTemplates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Document Processing Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Document Processing Status</CardTitle>
          </div>
          <Select defaultValue="This Week">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="Last Month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{processingStatus.readyForPickup}</div>
                <div className="text-sm text-green-600">Ready for Pickup</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{processingStatus.processing}</div>
                <div className="text-sm text-yellow-600">Processing</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{processingStatus.forReview}</div>
                <div className="text-sm text-blue-600">For Review</div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{processingStatus.released}</div>
                <div className="text-sm text-purple-600">Released</div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{processingStatus.rejected}</div>
                <div className="text-sm text-red-600">Rejected</div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing Time (Average)</span>
              <span>Updated: Today, 11:30 AM</span>
            </div>
            <Progress value={75} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 days</span>
              <span>1.5 days</span>
              <span>3 days (target)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Templates */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Document Templates</CardTitle>
              <Button onClick={() => navigate("/documents/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Document Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {["All", "Certificates", "Permits", "Clearances", "IDs"].map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Bulk Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Activate Selected</SelectItem>
                    <SelectItem value="deactivate">Deactivate Selected</SelectItem>
                    <SelectItem value="delete">Delete Selected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>

              <div className="space-y-3">
                {documentTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox />
                      <FileText className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                        <div className="text-sm">Fee: {template.fee}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">{template.status}</Badge>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Tracking System */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Document Tracking System</CardTitle>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Issue Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by tracking ID..."
                    value={trackingSearchQuery}
                    onChange={(e) => setTrackingSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {["All Documents", "In Progress", "Completed", "Rejected"].map((filter) => (
                    <Button
                      key={filter}
                      variant={trackingFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTrackingFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {trackingDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-blue-600">{doc.id}</div>
                        <div className="text-sm">{doc.document}</div>
                        <div className="text-xs text-muted-foreground">{doc.requestedBy}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusBadge(doc.status)}>{doc.status}</Badge>
                      <div className="text-sm text-muted-foreground">{doc.lastUpdate}</div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                Showing 3 of 42 documents
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Document Status Updates */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Document Status Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documentStatusUpdates.map((update) => (
                <div key={update.id} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(update.status)}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">{update.document}</div>
                      <div className="text-xs text-muted-foreground">{update.timeAgo}</div>
                    </div>
                    <Badge className={`${getStatusBadge(update.status)} text-xs mb-2`}>
                      {update.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mb-1">
                      {update.description}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {update.trackingId}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="link" className="text-blue-600 p-0 text-sm">
                View All Updates →
              </Button>
            </CardContent>
          </Card>

          {/* Document Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Document Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documentRequests.map((request) => (
                <div key={request.id} className="border-l-4 border-orange-400 pl-4 py-2">
                  <div className="font-medium">{request.name}</div>
                  <div className="text-sm text-muted-foreground">{request.document}</div>
                  <div className="text-xs text-muted-foreground">{request.timeAgo}</div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDenyRequest(request.id)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="link" className="text-blue-600 p-0">
                View All Requests →
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Plus className="h-5 w-5" />
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3">
                <div className="bg-blue-100 p-1 rounded">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Issue New Document</div>
                  <div className="text-xs text-muted-foreground">Create and issue documents</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-3">
                <div className="bg-purple-100 p-1 rounded">
                  <Download className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Add Document Template</div>
                  <div className="text-xs text-muted-foreground">Create new document templates</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-3">
                <div className="bg-green-100 p-1 rounded">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-xs text-muted-foreground">Document statistics and analytics</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-3">
                <div className="bg-orange-100 p-1 rounded">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">System Settings</div>
                  <div className="text-xs text-muted-foreground">Configure document settings</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};








<div id="webcrumbs"> 
        	<div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
	  <div  className="mb-8">
	    <h1 className="text-3xl font-bold text-gray-900 mb-2">Barangay Document Management</h1>
	    <p className="text-gray-600">Manage official documents, requests, and issuances for the barangay community</p>
	  </div>
	
	  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
	    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
	      <div  className="flex items-center justify-between">
	        <div>
	          <p className="text-sm font-medium text-gray-600">Total Documents</p>
	          <p  className="text-2xl font-bold text-gray-900">1,247</p>
	        </div>
	        <div  className="bg-primary-100 p-3 rounded-full">
	          <span className="material-symbols-outlined text-primary-600">description</span>
	        </div>
	      </div>
	    </div>
	
	    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
	      <div className="flex items-center justify-between">
	        <div >
	          <p  className="text-sm font-medium text-gray-600">Pending Requests</p>
	          <p className="text-2xl font-bold text-orange-600">23</p>
	        </div>
	        <div className="bg-orange-100 p-3 rounded-full">
	          <span className="material-symbols-outlined text-orange-600">pending_actions</span>
	        </div>
	      </div>
	    </div>
	
	    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
	      <div  className="flex items-center justify-between">
	        <div>
	          <p className="text-sm font-medium text-gray-600">Issued Today</p>
	          <p className="text-2xl font-bold text-green-600">8</p>
	        </div>
	        <div className="bg-green-100 p-3 rounded-full">
	          <span className="material-symbols-outlined text-green-600">task_alt</span>
	        </div>
	      </div>
	    </div>
	
	    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
	      <div className="flex items-center justify-between">
	        <div>
	          <p className="text-sm font-medium text-gray-600">Active Templates</p>
	          <p className="text-2xl font-bold text-blue-600">15</p>
	        </div>
	        <div className="bg-blue-100 p-3 rounded-full">
	          <span  className="material-symbols-outlined text-blue-600">landscape</span>
	        </div>
	      </div>
	    </div>
	  </div>
	
	<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
	  <div className="bg-white rounded-lg shadow-sm p-4 col-span-full">
	    <div className="flex items-center justify-between mb-4">
	      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
	        <span className="material-symbols-outlined text-primary-600">trending_up</span>
	        Document Processing Status
	      </h2>
	      <div className="flex gap-2">
	        <select className="text-xs border border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
	          <option>This Week</option>
	          <option>This Month</option>
	          <option>Last 3 Months</option>
	          <option>Last Year</option>
	        </select>
	        <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
	          <span className="material-symbols-outlined text-sm">refresh</span>
	        </button>
	      </div>
	    </div>
	    
	    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
	      <div className="rounded-lg bg-green-50 border border-green-100 p-3 flex justify-between items-center">
	        <div>
	          <p className="text-xs text-gray-500">Ready for Pickup</p>
	          <p className="text-xl font-bold text-green-600">18</p>
	        </div>
	        <div className="bg-green-100 p-2 rounded-full">
	          <span className="material-symbols-outlined text-green-600">inventory</span>
	        </div>
	      </div>
	      
	      <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3 flex justify-between items-center">
	        <div>
	          <p className="text-xs text-gray-500">Processing</p>
	          <p className="text-xl font-bold text-yellow-600">12</p>
	        </div>
	        <div className="bg-yellow-100 p-2 rounded-full">
	          <span className="material-symbols-outlined text-yellow-600">hourglass_top</span>
	        </div>
	      </div>
	      
	      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex justify-between items-center">
	        <div>
	          <p className="text-xs text-gray-500">For Review</p>
	          <p className="text-xl font-bold text-blue-600">7</p>
	        </div>
	        <div className="bg-blue-100 p-2 rounded-full">
	          <span className="material-symbols-outlined text-blue-600">rate_review</span>
	        </div>
	      </div>
	      
	      <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 flex justify-between items-center">
	        <div>
	          <p className="text-xs text-gray-500">Released</p>
	          <p className="text-xl font-bold text-purple-600">42</p>
	        </div>
	        <div className="bg-purple-100 p-2 rounded-full">
	          <span className="material-symbols-outlined text-purple-600">task_alt</span>
	        </div>
	      </div>
	      
	      <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex justify-between items-center">
	        <div>
	          <p className="text-xs text-gray-500">Rejected</p>
	          <p className="text-xl font-bold text-red-600">3</p>
	        </div>
	        <div className="bg-red-100 p-2 rounded-full">
	          <span className="material-symbols-outlined text-red-600">cancel</span>
	        </div>
	      </div>
	    </div>
	    
	    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
	      <span>Processing Time (Average)</span>
	      <span>Updated: Today, 11:30 AM</span>
	    </div>
	    
	    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
	      <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
	    </div>
	    
	    <div className="flex justify-between items-center text-xs">
	      <span className="text-gray-500">0 days</span>
	      <span className="font-medium text-primary-600">1.2 days</span>
	      <span className="text-gray-500">3 days (target)</span>
	    </div>
	  </div>
	</div>
	
	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
	    <div className="lg:col-span-2">
	      <div className="bg-white rounded-lg shadow-sm">
	        <div  className="p-6 border-b border-gray-200">
	          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
	            <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
	            <div className="flex flex-col sm:flex-row gap-3">
	              <div className="relative">
	                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
	                <input
	                  type="text"
	                  placeholder="Search documents..."
	                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
	                />
	              </div>
	              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
	                <span className="material-symbols-outlined">add</span>
	                Add Document
	              </button>
	            </div>
	          </div>
	        </div>
	
	        <div className="p-6">
	  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
	    <div className="flex flex-wrap gap-2">
	      <button className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-200 transition-colors">All</button>
	      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Certificates</button>
	      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Permits</button>
	      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Clearances</button>
	      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">IDs</button>
	    </div>
	    <div className="flex flex-wrap items-center gap-2">
	      <button className="flex items-center gap-1 border border-gray-300 rounded px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
	        <span className="material-symbols-outlined text-gray-600 text-sm">filter_list</span>
	        Advanced Filters
	      </button>
	      <div className="flex items-center border border-gray-300 rounded-lg">
	        <select className="text-sm px-3 py-1.5 rounded-l-lg border-r border-gray-300 focus:outline-none bg-white text-gray-700">
	          <option >Bulk Actions</option>
	          <option>Download Selected</option>
	          <option>Archive Selected</option>
	          <option>Delete Selected</option>
	        </select>
	        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-r-lg hover:bg-gray-200 transition-colors text-sm">
	          Apply
	        </button>
	      </div>
	    </div>
	  </div>
	
	  <div className="space-y-4">
	    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
	      <div className="flex items-center justify-between">
	        <div className="flex items-center gap-3">
	          <div className="flex items-center h-5">
	            <input
	              id="doc1"
	              type="checkbox"
	              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
	            />
	          </div>
	          <div className="bg-red-100 p-2 rounded-lg">
	            <span className="material-symbols-outlined text-red-600">picture_as_pdf</span>
	          </div>
	          <div>
	            <h3 className="font-medium text-gray-900">Barangay Clearance Template</h3>
	            <p  className="text-sm text-gray-500">Updated 2 hours ago • 45 KB</p>
	          </div>
	        </div>
	        <div className="flex items-center gap-2">
	          <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">download</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">edit</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">delete</span>
	          </button>
	        </div>
	      </div>
	    </div>
	
	    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
	      <div className="flex items-center justify-between">
	        <div className="flex items-center gap-3">
	          <div className="flex items-center h-5">
	            <input
	              id="doc2"
	              type="checkbox"
	              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
	            />
	          </div>
	          <div className="bg-blue-100 p-2 rounded-lg">
	            <span className="material-symbols-outlined text-blue-600">description</span>
	          </div>
	          <div>
	            <h3 className="font-medium text-gray-900">Certificate of Residency</h3>
	            <p className="text-sm text-gray-500">Updated 1 day ago • 32 KB</p>
	          </div>
	        </div>
	        <div className="flex items-center gap-2">
	          <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">download</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">edit</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">delete</span>
	          </button>
	        </div>
	      </div>
	    </div>
	
	    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
	      <div className="flex items-center justify-between">
	        <div className="flex items-center gap-3">
	          <div className="flex items-center h-5">
	            <input
	              id="doc3"
	              type="checkbox"
	              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
	            />
	          </div>
	          <div className="bg-green-100 p-2 rounded-lg">
	            <span className="material-symbols-outlined text-green-600">verified</span>
	          </div>
	          <div>
	            <h3 className="font-medium text-gray-900">Business Permit Form</h3>
	            <p className="text-sm text-gray-500">Updated 3 days ago • 28 KB</p>
	          </div>
	        </div>
	        <div className="flex items-center gap-2">
	          <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">download</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">edit</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">delete</span>
	          </button>
	        </div>
	      </div>
	    </div>
	
	    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
	      <div  className="flex items-center justify-between">
	        <div className="flex items-center gap-3">
	          <div className="flex items-center h-5">
	            <input
	              id="doc4"
	              type="checkbox"
	              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
	            />
	          </div>
	          <div className="bg-purple-100 p-2 rounded-lg">
	            <span className="material-symbols-outlined text-purple-600">badge</span>
	          </div>
	          <div>
	            <h3 className="font-medium text-gray-900">Barangay ID Application</h3>
	            <p className="text-sm text-gray-500">Updated 1 week ago • 41 KB</p>
	          </div>
	        </div>
	        <div className="flex items-center gap-2">
	          <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
	          <button  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">download</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">edit</span>
	          </button>
	          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
	            <span className="material-symbols-outlined">delete</span>
	          </button>
	        </div>
	      </div>
	    </div>
	  </div>
	
	  <div className="mt-6 flex justify-between items-center">
	    <div className="flex items-center gap-2">
	      <input
	        id="selectAll"
	        type="checkbox"
	        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
	      />
	      <label htmlFor="selectAll" className="text-sm text-gray-600">
	        Select All
	      </label>
	    </div>
	    <div className="flex items-center gap-2">
	      <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	        Previous
	      </button>
	      <div  className="flex">
	        <button className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm font-medium">1</button>
	        <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm">2</button>
	        <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm">3</button>
	      </div>
	      <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	        Next
	      </button>
	    </div>
	  </div>
	</div>
	
	
	      </div>
	
	<div className="mt-6 bg-white rounded-lg shadow-sm">
	  <div className="p-6 border-b border-gray-200">
	    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
	      <span className="material-symbols-outlined">filter_alt</span>
	      Advanced Filters
	    </h2>
	  </div>
	  <div className="p-6">
	    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
	      <div>
	        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
	        <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
	          <option value="">All Types</option>
	          <option  value="certificate">Certificates</option>
	          <option value="permit">Permits</option>
	          <option value="clearance">Clearances</option>
	          <option value="id">IDs</option>
	        </select>
	      </div>
	      
	      <div>
	        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
	        <div className="flex items-center gap-2">
	          <input 
	            type="date" 
	            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	          />
	          <span className="text-gray-500">to</span>
	          <input 
	            type="date" 
	            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	          />
	        </div>
	      </div>
	      
	      <div>
	        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
	        <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
	          <option value="">All Statuses</option>
	          <option value="active">Active</option>
	          <option value="archived">Archived</option>
	          <option value="expired">Expired</option>
	        </select>
	      </div>
	    </div>
	    
	    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
	      <div >
	        <label className="block text-sm font-medium text-gray-700 mb-1">Creator</label>
	        <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
	          <option value="">All Users</option>
	          <option value="admin">Admin Users</option>
	          <option value="staff">Staff Members</option>
	        </select>
	      </div>
	      
	      <div>
	        <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
	        <div className="flex items-center gap-2">
	          <input 
	            type="number" 
	            placeholder="Min KB"
	            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	          />
	          <span className="text-gray-500">to</span>
	          <input 
	            type="number" 
	            placeholder="Max KB"
	            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	          />
	        </div>
	      </div>
	      
	      <div>
	        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
	        <input 
	          type="text" 
	          placeholder="Enter tags..."
	          className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	        />
	      </div>
	    </div>
	    
	    <div className="flex justify-end gap-3">
	      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
	        Reset Filters
	      </button>
	      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
	        <span className="material-symbols-outlined text-sm">filter_list</span>
	        Apply Filters
	      </button>
	    </div>
	  </div>
	</div>
	    </div>
	
	    <div className="space-y-6">
	
	<div  className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
	  <div className="p-6 border-b border-gray-200">
	    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
	      <span className="material-symbols-outlined">history</span>
	      Document Status Updates
	    </h2>
	  </div>
	  <div className="p-0">
	    <div className="relative">
	      <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-gray-200 z-0"></div>
	      <div className="p-6 relative z-10">
	        <div className="grid grid-cols-[auto_1fr] gap-4 mb-6">
	          <div className="mt-1">
	            <div className="h-6 w-6 rounded-full bg-green-500 border-4 border-white shadow"></div>
	          </div>
	          <div className="bg-green-50 p-4 rounded-lg">
	            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
	              <h3 className="font-medium text-gray-900">Barangay Clearance - Ready for Pickup</h3>
	              <span className="text-xs text-gray-500">10 minutes ago</span>
	            </div>
	            <p className="text-sm text-gray-600">Document for Maria Santos has been signed and is ready for pickup at the Barangay Hall.</p>
	            <div className="flex mt-2 gap-2">
	              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Ready for pickup</span>
	              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">ID: #BRG-2023-0042</span>
	            </div>
	          </div>
	        </div>
	        
	        <div className="grid grid-cols-[auto_1fr] gap-4 mb-6">
	          <div className="mt-1">
	            <div className="h-6 w-6 rounded-full bg-yellow-500 border-4 border-white shadow"></div>
	          </div>
	          <div className="bg-yellow-50 p-4 rounded-lg">
	            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
	              <h3 className="font-medium text-gray-900">Certificate of Residency - Processing</h3>
	              <span className="text-xs text-gray-500">2 hours ago</span>
	            </div>
	            <p className="text-sm text-gray-600">Juan Dela Cruz's document is being processed. Pending approval from the Barangay Captain.</p>
	            <div className="flex mt-2 gap-2">
	              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Processing</span>
	              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">ID: #BRG-2023-0041</span>
	            </div>
	          </div>
	        </div>
	        
	        <div className="grid grid-cols-[auto_1fr] gap-4 mb-6">
	          <div className="mt-1">
	            <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow"></div>
	          </div>
	          <div className="bg-blue-50 p-4 rounded-lg">
	            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
	              <h3 className="font-medium text-gray-900">Business Permit - For Review</h3>
	              <span className="text-xs text-gray-500">5 hours ago</span>
	            </div>
	            <p className="text-sm text-gray-600">Business Permit application for Anna Reyes has been submitted for review. Pending verification of business requirements.</p>
	            <div className="flex mt-2 gap-2">
	              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">For Review</span>
	              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">ID: #BRG-2023-0040</span>
	            </div>
	          </div>
	        </div>
	        
	        <div className="grid grid-cols-[auto_1fr] gap-4">
	          <div className="mt-1">
	            <div className="h-6 w-6 rounded-full bg-red-500 border-4 border-white shadow"></div>
	          </div>
	          <div className="bg-red-50 p-4 rounded-lg">
	            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
	              <h3 className="font-medium text-gray-900">Barangay ID - Rejected</h3>
	              <span className="text-xs text-gray-500">Yesterday, 2:15 PM</span>
	            </div>
	            <p className="text-sm text-gray-600">Carlos Mendoza's application for Barangay ID was rejected. Reason: Insufficient supporting documents.</p>
	            <div className="flex mt-2 gap-2">
	              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Rejected</span>
	              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">ID: #BRG-2023-0039</span>
	            </div>
	          </div>
	        </div>
	      </div>
	    </div>
	    
	    <div className="border-t border-gray-200 p-4 text-center">
	      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1 mx-auto">
	        View All Updates
	        <span className="material-symbols-outlined text-sm">arrow_forward</span>
	      </button>
	    </div>
	  </div>
	</div>
	
	
	      <div  className="bg-white rounded-lg shadow-sm">
	        <div  className="p-6 border-b border-gray-200">
	          <h2  className="text-xl font-semibold text-gray-900 flex items-center gap-2">
	            <span className="material-symbols-outlined">notifications</span>
	            Document Requests
	          </h2>
	        </div>
	        <div className="p-6">
	          <div className="space-y-4">
	            <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg">
	              <div className="flex items-start justify-between">
	                <div>
	                  <p className="font-medium text-gray-900">Maria Santos</p>
	                  <p className="text-sm text-gray-600">Barangay Clearance</p>
	                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
	                </div>
	                <div className="flex gap-2">
	                  <button   className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
	                    Approve
	                  </button>
	                  <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors">
	                    Deny
	                  </button>
	                </div>
	              </div>
	            </div>
	
	            <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg">
	              <div className="flex items-start justify-between">
	                <div >
	                  <p className="font-medium text-gray-900">Juan Dela Cruz</p>
	                  <p className="text-sm text-gray-600">Certificate of Residency</p>
	                  <p  className="text-xs text-gray-500 mt-1">5 hours ago</p>
	                </div>
	                <div className="flex gap-2">
	                  <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
	                    Approve
	                  </button>
	                  <button  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors">
	                    Deny
	                  </button>
	                </div>
	              </div>
	            </div>
	
	            <div  className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg">
	              <div className="flex items-start justify-between">
	                <div>
	                  <p className="font-medium text-gray-900">Anna Reyes</p>
	                  <p className="text-sm text-gray-600">Business Permit</p>
	                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
	                </div>
	                <div className="flex gap-2">
	                  <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
	                    Approve
	                  </button>
	                  <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors">
	                    Deny
	                  </button>
	                </div>
	              </div>
	            </div>
	          </div>
	          <button  className="w-full mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1">
	            View All Requests
	            <span className="material-symbols-outlined text-sm">arrow_forward</span>
	          </button>
	        </div>
	      </div>
	
	      <div  className="bg-white rounded-lg shadow-sm">
	        <div className="p-6 border-b border-gray-200">
	          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
	            <span className="material-symbols-outlined">add_circle</span>
	            Quick Actions
	          </h2>
	        </div>
	        <div  className="p-6">
	          <div className="grid grid-cols-1 gap-3">
	            <button  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
	              <div className="bg-primary-100 p-2 rounded-lg">
	                <span className="material-symbols-outlined text-primary-600">add_circle</span>
	              </div>
	              <div>
	                <p  className="font-medium text-gray-900">Issue New Document</p>
	                <p className="text-sm text-gray-500">Create and issue documents</p>
	              </div>
	            </button>
	
	            <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
	              <div className="bg-blue-100 p-2 rounded-lg">
	                <span   className="material-symbols-outlined text-blue-600">upload_file</span>
	              </div>
	              <div>
	                <p className="font-medium text-gray-900">Upload Template</p>
	                <p className="text-sm text-gray-500">Add new document templates</p>
	              </div>
	            </button>
	
	            <button   className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
	              <div className="bg-green-100 p-2 rounded-lg">
	                <span className="material-symbols-outlined text-green-600">analytics</span>
	              </div>
	              <div>
	                <p className="font-medium text-gray-900">View Reports</p>
	                <p className="text-sm text-gray-500">Document statistics and analytics</p>
	              </div>
	            </button>
	
	            <button  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
	              <div className="bg-orange-100 p-2 rounded-lg">
	                <span className="material-symbols-outlined text-orange-600">settings</span>
	              </div>
	              <div>
	                <p  className="font-medium text-gray-900">System Settings</p>
	                <p  className="text-sm text-gray-500">Configure document settings</p>
	              </div>
	            </button>
	          </div>
	        </div>
	      </div>
	    </div>
	  </div><div  className="mb-8 bg-white rounded-lg shadow-sm">
	  <div className="p-6 border-b border-gray-200">
	    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
	      <span className="material-symbols-outlined">timeline</span>
	      Document Tracking System
	    </h2>
	  </div>
	  <div className="p-6">
	    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
	      <div className="relative">
	        <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
	        <input
	          type="text"
	          placeholder="Search by tracking ID..."
	          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
	        />
	      </div>
	      <div className="flex flex-wrap gap-2">
	        <button className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-200 transition-colors">All Documents</button>
	        <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">In Progress</button>
	        <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Completed</button>
	        <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Rejected</button>
	      </div>
	    </div>
	    
	    <div className="overflow-x-auto">
	      <table className="min-w-full divide-y divide-gray-200">
	        <thead className="bg-gray-50">
	          <tr>
	            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking ID</th>
	            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
	            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
	            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
	            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
	            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
	          </tr>
	        </thead>
	        <tbody className="bg-white divide-y divide-gray-200">
	          <tr className="hover:bg-gray-50 transition-colors">
	            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">#BRG-2023-0042</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Barangay Clearance</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Maria Santos</td>
	            <td className="px-6 py-4 whitespace-nowrap">
	              <div className="flex items-center">
	                <div  className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
	                <span className="text-sm text-gray-700">Ready for pickup</span>
	              </div>
	            </td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Today, 10:45 AM</td>
	            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
	              <div className="flex justify-end gap-2">
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">visibility</span>
	                </button>
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">edit</span>
	                </button>
	              </div>
	            </td>
	          </tr>
	          <tr className="hover:bg-gray-50 transition-colors">
	            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">#BRG-2023-0041</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Certificate of Residency</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Juan Dela Cruz</td>
	            <td className="px-6 py-4 whitespace-nowrap">
	              <div className="flex items-center">
	                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 mr-2"></div>
	                <span className="text-sm text-gray-700">Processing</span>
	              </div>
	            </td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Today, 9:20 AM</td>
	            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
	              <div className="flex justify-end gap-2">
	                <button  className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">visibility</span>
	                </button>
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">edit</span>
	                </button>
	              </div>
	            </td>
	          </tr>
	          <tr className="hover:bg-gray-50 transition-colors">
	            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">#BRG-2023-0040</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Business Permit</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Anna Reyes</td>
	            <td className="px-6 py-4 whitespace-nowrap">
	              <div className="flex items-center">
	                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-2"></div>
	                <span className="text-sm text-gray-700">For Review</span>
	              </div>
	            </td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yesterday, 4:30 PM</td>
	            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
	              <div  className="flex justify-end gap-2">
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">visibility</span>
	                </button>
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span  className="material-symbols-outlined text-sm">edit</span>
	                </button>
	              </div>
	            </td>
	          </tr>
	          <tr className="hover:bg-gray-50 transition-colors">
	            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">#BRG-2023-0039</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Barangay ID</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Carlos Mendoza</td>
	            <td className="px-6 py-4 whitespace-nowrap">
	              <div className="flex items-center">
	                <div className="h-2.5 w-2.5 rounded-full bg-red-500 mr-2"></div>
	                <span className="text-sm text-gray-700">Rejected</span>
	              </div>
	            </td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 days ago</td>
	            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
	              <div className="flex justify-end gap-2">
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">visibility</span>
	                </button>
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">edit</span>
	                </button>
	              </div>
	            </td>
	          </tr>
	          <tr className="hover:bg-gray-50 transition-colors">
	            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">#BRG-2023-0038</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Indigency Certificate</td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">Elena Garcia</td>
	            <td className="px-6 py-4 whitespace-nowrap">
	              <div className="flex items-center">
	                <div className="h-2.5 w-2.5 rounded-full bg-purple-500 mr-2"></div>
	                <span className="text-sm text-gray-700">Released</span>
	              </div>
	            </td>
	            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3 days ago</td>
	            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
	              <div className="flex justify-end gap-2">
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">visibility</span>
	                </button>
	                <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
	                  <span className="material-symbols-outlined text-sm">edit</span>
	                </button>
	              </div>
	            </td>
	          </tr>
	        </tbody>
	      </table>
	    </div>
	    
	    <div className="mt-6 flex justify-between items-center">
	      <div  className="text-sm text-gray-600">
	        Showing 5 of 42 documents
	      </div>
	      <div className="flex items-center gap-2">
	        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	          Previous
	        </button>
	        <div className="flex">
	          <button className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm font-medium">1</button>
	          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm">2</button>
	          <button  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm">3</button>
	        </div>
	        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
	          Next
	        </button>
	      </div>
	    </div>
	  </div>
	</div>
	
	
	
	  
	  
	  
	  {/* Next: "Add digital signature integration for official documents" */}
	<div >
	  
	  
	  <div id="documentModal" className="hidden absolute inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
	    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-fadeIn">
	      <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
	        <h3 className="text-xl font-semibold text-gray-900">Issue New Document</h3>
	        <button  
	          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
	          onclick="document.getElementById('documentModal').classList.add('hidden')"
	        >
	          <span className="material-symbols-outlined">close</span>
	        </button>
	      </div>
	      
	      <div className="p-6 overflow-y-auto">
	        <div  className="grid grid-cols-1 md:grid-cols-2 gap-6">
	          <div >
	            <div className="mb-4">
	              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="document-type">
	                Document Type
	              </label>
	              <select 
	                id="document-type" 
	                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	              >
	                <option value="">Select document type</option>
	                <option value="clearance">Barangay Clearance</option>
	                <option value="residency">Certificate of Residency</option>
	                <option value="business">Business Permit</option>
	                <option value="id">Barangay ID</option>
	              </select>
	            </div>
	            
	            <div className="mb-4">
	              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="resident-name">
	                Resident Name
	              </label>
	              <input  
	                type="text" 
	                id="resident-name" 
	                placeholder="Enter full name"
	                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	              />
	            </div>
	            
	            <div className="mb-4">
	              <label  className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
	                Address
	              </label>
	              <input 
	                type="text" 
	                id="address" 
	                placeholder="Enter complete address"
	                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	              />
	            </div>
	            
	            <div className="mb-4">
	              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="purpose">
	                Purpose
	              </label>
	              <input 
	                type="text" 
	                id="purpose" 
	                placeholder="Enter purpose of document"
	                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	              />
	            </div>
	            
	            <div className="mb-4">
	              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="issue-date">
	                Issue Date
	              </label>
	              <input 
	                type="date" 
	                id="issue-date" 
	                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	              />
	            </div>
	            
	            <div className="mb-4">
	              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="expiry-date">
	                Expiry Date
	              </label>
	              <input 
	                type="date" 
	                id="expiry-date" 
	                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
	              />
	            </div>
	          </div>
	          
	          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
	            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
	              <span className="material-symbols-outlined text-primary-600">preview</span>
	              Document Preview
	            </h4>
	            
	            <div className="bg-white rounded-lg border border-gray-300 p-6 min-h-[400px] shadow-sm flex flex-col items-center">
	              <div className="text-center mb-6 w-full">
	                <div className="text-sm uppercase text-gray-500 mb-1">Republic of the Philippines</div>
	                <div  className="text-sm uppercase text-gray-500">City/Municipality of _______</div>
	                <div  className="font-bold text-lg text-gray-900 mt-2">BARANGAY CERTIFICATE</div>
	                <div className="w-full border-b border-gray-300 mt-2"></div>
	              </div>
	              
	              <div className="text-sm text-gray-700 space-y-4 self-start w-full">
	                <p>This is to certify that <span className="font-medium border-b border-dashed border-gray-400">Juan Dela Cruz</span>, of legal age, Filipino, and a resident of <span  className="font-medium border-b border-dashed border-gray-400">123 Main Street</span>, is a bonafide resident of this Barangay.</p>
	                
	                <p>This certification is being issued upon the request of the above-named person for <span  className="font-medium border-b border-dashed border-gray-400">employment purposes</span>.</p>
	                
	                <p>Issued this <span className="font-medium border-b border-dashed border-gray-400">15th day of June 2023</span> at the Barangay Hall.</p>
	              </div>
	              
	              <div  className="mt-auto pt-8 self-end">
	                <div className="font-medium text-center">
	                  BARANGAY CAPTAIN
	                </div>
	                <div className="border-t border-gray-900 w-40 mt-10 text-center">
	                  Signature
	                </div>
	              </div>
	              
	              <div className="absolute right-8 top-8 opacity-30">
	                <div className="border-2 border-gray-300 rounded-full w-24 h-24 flex items-center justify-center">
	                  <span  className="material-symbols-outlined text-4xl text-gray-400">verified</span>
	                </div>
	              </div>
	            </div>
	            
	            <div className="mt-4 flex justify-end gap-2">
	              <button className="text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 hover:bg-gray-100 rounded transition-colors text-sm flex items-center gap-1">
	                <span  className="material-symbols-outlined text-sm">print</span>
	                Print
	              </button>
	              <button className="text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 hover:bg-gray-100 rounded transition-colors text-sm flex items-center gap-1">
	                <span className="material-symbols-outlined text-sm">download</span>
	                Download
	              </button>
	            </div>
	          </div>
	        </div>
	      </div>
	      
	      <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
	        <button  
	          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
	          onclick="document.getElementById('documentModal').classList.add('hidden')"
	        >
	          Cancel
	        </button>
	        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
	          <span className="material-symbols-outlined text-sm">check_circle</span>
	          Issue Document
	        </button>
	      </div>
	    </div>
	  </div>
	</div></div> 
        </div>



export default DocumentsPage;
