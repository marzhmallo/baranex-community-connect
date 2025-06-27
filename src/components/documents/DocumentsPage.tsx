
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileTextIcon, 
  SearchIcon, 
  EyeIcon,
  EditIcon,
  SettingsIcon
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Mock data for document requests
  const documentRequests = [
    {
      id: "1",
      name: "Maria Santos",
      document: "Barangay Clearance",  
      timeAgo: "2 hours ago",
      status: "pending"
    },
    {
      id: "2", 
      name: "Juan Dela Cruz",
      document: "Certificate of Residency",
      timeAgo: "5 hours ago", 
      status: "pending"
    },
    {
      id: "3",
      name: "Anna Reyes", 
      document: "Business Permit",
      timeAgo: "1 day ago",
      status: "pending"
    }
  ];

  // Mock data for document tracking
  const trackingDocuments = [
    {
      id: "#BRG-2023-0042",
      document: "Barangay Clearance",
      requestedBy: "Maria Santos", 
      status: "Ready for pickup",
      statusColor: "bg-green-100 text-green-800",
      lastUpdate: "Today, 10:45 AM"
    },
    {
      id: "#BRG-2023-0041",
      document: "Certificate of Residency",
      requestedBy: "Juan Dela Cruz",
      status: "Processing", 
      statusColor: "bg-yellow-100 text-yellow-800",
      lastUpdate: "Today, 9:20 AM"
    },
    {
      id: "#BRG-2023-0040",
      document: "Business Permit",
      requestedBy: "Anna Reyes",
      status: "For Review",
      statusColor: "bg-blue-100 text-blue-800", 
      lastUpdate: "Yesterday, 4:30 PM"
    },
    {
      id: "#BRG-2023-0039",
      document: "Barangay ID",
      requestedBy: "Carlos Mendoza",
      status: "Rejected",
      statusColor: "bg-red-100 text-red-800",
      lastUpdate: "2 days ago"
    },
    {
      id: "#BRG-2023-0038",
      document: "Indigency Certificate", 
      requestedBy: "Elena Garcia",
      status: "Released",
      statusColor: "bg-purple-100 text-purple-800",
      lastUpdate: "3 days ago"
    }
  ];

  const filteredTrackingDocs = trackingDocuments.filter(doc => {
    if (activeTab === "all") return true;
    if (activeTab === "in-progress") return ["Processing", "For Review"].includes(doc.status);
    if (activeTab === "completed") return ["Ready for pickup", "Released"].includes(doc.status);
    if (activeTab === "rejected") return doc.status === "Rejected";
    return true;
  }).filter(doc => 
    searchQuery === "" || 
    doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Requests */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Document Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documentRequests.map((request) => (
                <div key={request.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{request.name}</h4>
                      <p className="text-sm text-gray-600">{request.document}</p>
                      <p className="text-xs text-gray-500">{request.timeAgo}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 text-xs">
                        Deny
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="link" className="w-full text-purple-600 hover:text-purple-700">
                View All Requests →
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-purple-100 text-purple-800 hover:bg-purple-200">
                <FileTextIcon className="h-4 w-4 mr-2" />
                Issue New Document
                <span className="text-xs ml-auto">Create and issue documents</span>
              </Button>
              <Button className="w-full justify-start bg-blue-100 text-blue-800 hover:bg-blue-200">
                <FileTextIcon className="h-4 w-4 mr-2" />
                Upload Template
                <span className="text-xs ml-auto">Add new document templates</span>
              </Button>
              <Button className="w-full justify-start bg-green-100 text-green-800 hover:bg-green-200">
                <FileTextIcon className="h-4 w-4 mr-2" />
                View Reports
                <span className="text-xs ml-auto">Document statistics and analytics</span>
              </Button>
              <Button className="w-full justify-start bg-orange-100 text-orange-800 hover:bg-orange-200">
                <SettingsIcon className="h-4 w-4 mr-2" />
                System Settings
                <span className="text-xs ml-auto">Configure document settings</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Document Tracking System */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Document Tracking System
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by tracking ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Tracking Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TRACKING ID</TableHead>
                      <TableHead>DOCUMENT</TableHead>
                      <TableHead>REQUESTED BY</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>LAST UPDATE</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrackingDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono text-purple-600">{doc.id}</TableCell>
                        <TableCell>{doc.document}</TableCell>
                        <TableCell>{doc.requestedBy}</TableCell>
                        <TableCell>
                          <Badge className={doc.statusColor}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{doc.lastUpdate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">Showing 5 of 42 documents</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
