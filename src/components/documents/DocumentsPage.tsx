
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Search, 
  Plus,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Mock data for documents
  const documents = [
    {
      id: "1",
      name: "Barangay Clearance Template",
      type: "template",
      status: "Active",
      size: "45 kB",
      updatedAt: "2 hours ago",
      icon: FileText,
      color: "text-red-500"
    },
    {
      id: "2",
      name: "Certificate of Residency",
      type: "template",
      status: "Active", 
      size: "32 kB",
      updatedAt: "1 day ago",
      icon: FileText,
      color: "text-blue-500"
    },
    {
      id: "3",
      name: "Business Permit Form",
      type: "template",
      status: "Active",
      size: "28 kB", 
      updatedAt: "3 days ago",
      icon: FileText,
      color: "text-green-500"
    },
    {
      id: "4",
      name: "Barangay ID Application",
      type: "template",
      status: "Active",
      size: "41 kB",
      updatedAt: "1 week ago",
      icon: FileText,
      color: "text-purple-500"
    }
  ];

  // Mock data for document status updates
  const statusUpdates = [
    {
      id: "1",
      title: "Barangay Clearance - Ready for Pickup",
      description: "Document for Maria Santos has been signed and is ready for pickup at the Barangay Hall.",
      time: "10 minutes ago",
      status: "ready",
      trackingId: "#BRG-2023-0042"
    },
    {
      id: "2", 
      title: "Certificate of Residency - Processing",
      description: "Juan Dela Cruz's document is being processed. Pending approval from the Barangay Captain.",
      time: "2 hours ago",
      status: "processing",
      trackingId: "#BRG-2023-0041"
    },
    {
      id: "3",
      title: "Business Permit - For Review", 
      description: "Business Permit application for Anna Reyes has been submitted for review. Pending verification of business requirements.",
      time: "5 hours ago",
      status: "review",
      trackingId: "#BRG-2023-0040"
    },
    {
      id: "4",
      title: "Barangay ID - Rejected",
      description: "Carlos Mendoza's application for Barangay ID was rejected. Reason: insufficient supporting documents.",
      time: "Yesterday, 2:15 PM",
      status: "rejected", 
      trackingId: "#BRG-2023-0039"
    }
  ];

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

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Barangay Document Management</h1>
        <p className="text-gray-600">Manage official documents, requests, and issuances for the barangay community</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
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
                <p className="text-sm font-medium text-gray-600">Issued Today</p>
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
                <p className="text-sm font-medium text-gray-600">Active Templates</p>
                <p className="text-2xl font-bold text-blue-600">15</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Processing Status */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">DIV</div>
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
                <p className="text-2xl font-bold text-green-600">18</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">For Review</p>
                <p className="text-2xl font-bold text-blue-600">7</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Released</p>
                <p className="text-2xl font-bold text-purple-600">42</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">3</p>
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
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 days</span>
              <span className="font-medium text-purple-600">1.2 days</span>
              <span>3 days (target)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Library */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Document Library</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 border-b">
                  <TabsList className="bg-transparent h-auto p-0">
                    <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="certificates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none">
                      Certificates
                    </TabsTrigger>
                    <TabsTrigger value="permits" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none">
                      Permits
                    </TabsTrigger>
                    <TabsTrigger value="clearances" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none">
                      Clearances
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Advanced Filters
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Bulk Actions
                        </Button>
                        <Button variant="outline" size="sm">
                          Apply
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <input type="checkbox" className="rounded" />
                            <div className={`p-2 rounded ${doc.color.includes('red') ? 'bg-red-100' : doc.color.includes('blue') ? 'bg-blue-100' : doc.color.includes('green') ? 'bg-green-100' : 'bg-purple-100'}`}>
                              <doc.icon className={`h-5 w-5 ${doc.color}`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{doc.name}</h4>
                              <p className="text-sm text-gray-500">Updated {doc.updatedAt} • {doc.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {doc.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span className="text-sm text-gray-600">Select All</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Previous</Button>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="bg-purple-600 text-white">1</Button>
                          <Button variant="outline" size="sm">2</Button>
                          <Button variant="outline" size="sm">3</Button>
                        </div>
                        <Button variant="outline" size="sm">Next</Button>
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
                {statusUpdates.map((update, index) => (
                  <div key={update.id} className={`p-4 border-b border-gray-100 ${index === statusUpdates.length - 1 ? 'border-b-0' : ''}`}>
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
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="outline" className="w-full text-sm">
                  View All Updates →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Document Requests Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Document Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full bg-green-100 text-green-800 hover:bg-green-200 justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                  <span className="text-xs ml-auto">Document statistics and analytics</span>
                </Button>
                <Button className="w-full bg-orange-100 text-orange-800 hover:bg-orange-200 justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  System Settings
                  <span className="text-xs ml-auto">Configure document settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
