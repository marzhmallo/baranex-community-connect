
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

export default DocumentsPage;
