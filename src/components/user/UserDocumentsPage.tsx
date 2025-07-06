
import { useState } from "react";
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
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Package, 
  Hourglass, 
  Eye, 
  XCircle, 
  TrendingUp,
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  FileX,
  History,
  PlusCircle,
  Bell,
  Upload,
  ArrowRight,
  Settings,
  MoreHorizontal
} from "lucide-react";

const UserDocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { userProfile } = useAuth();

  // Mock templates data
  const mockTemplates = [
    {
      id: '1',
      name: 'Barangay Clearance',
      description: 'Certificate of good moral character and residence',
      fee: 50,
      requirements: 'Valid ID, Proof of residence'
    },
    {
      id: '2', 
      name: 'Certificate of Indigency',
      description: 'Certification for financial assistance applications',
      fee: 0,
      requirements: 'Valid ID, Proof of income (if any)'
    },
    {
      id: '3',
      name: 'Business Permit',
      description: 'Permit to operate small business in the barangay',
      fee: 200,
      requirements: 'Valid ID, Business registration, Location map'
    }
  ];

  const itemsPerPage = 3;
  const totalPages = Math.ceil(mockTemplates.length / itemsPerPage);
  
  // Calculate paginated data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = mockTemplates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Fetch user's document requests from Supabase
  const { data: documentRequests = [], isLoading } = useQuery({
    queryKey: ['user-document-requests', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('docrequests')
        .select('*')
        .eq('resident_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Barangay Document Management</h1>
        <p className="text-gray-600">Manage official documents, requests, and issuances for the barangay community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-orange-600">23</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issued Today</p>
              <p className="text-2xl font-bold text-green-600">8</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
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
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 col-span-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
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
                <RefreshCw className="h-4 w-4" />
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
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Processing</p>
                <p className="text-xl font-bold text-yellow-600">12</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Hourglass className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">For Review</p>
                <p className="text-xl font-bold text-blue-600">7</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Released</p>
                <p className="text-xl font-bold text-purple-600">42</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Rejected</p>
                <p className="text-xl font-bold text-red-600">3</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
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
                    onClick={() => setShowRequestModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Request Document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value="all" className="w-full">
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

                <TabsContent value="all" className="mt-0">
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
                      {paginatedTemplates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-4">
                            <input type="checkbox" className="rounded border-border" />
                            <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                              <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {template.description} • Fee: ₱{template.fee}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="hover:bg-accent">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-border bg-background">
                                <DropdownMenuItem className="text-foreground hover:bg-accent">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Template
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-foreground hover:bg-accent">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-border" />
                        <label className="text-sm text-foreground">Select All</label>
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(currentPage - 1);
                              }}
                              className={`hover:bg-accent cursor-pointer ${
                                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink 
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(page);
                                }}
                                isActive={currentPage === page}
                                className={`cursor-pointer ${
                                  currentPage === page 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'hover:bg-accent'
                                }`}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(currentPage + 1);
                              }}
                              className={`hover:bg-accent cursor-pointer ${
                                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">All Types</option>
                    <option value="certificate">Certificates</option>
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
                <div>
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
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5" />
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
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Document Tracking System
            </h2>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowRequestModal(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Request Document
              </Button>
              <Button 
                onClick={() => setShowIssueForm(true)}
                className="bg-primary-600 text-white hover:bg-primary-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Issue Document
              </Button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading your document requests...
                    </td>
                  </tr>
                ) : documentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No document requests found
                    </td>
                  </tr>
                ) : (
                  documentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">
                        {request.docnumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {userProfile?.firstname} {userProfile?.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mr-2 ${getStatusColor(request.status)}`}></div>
                          <span className="text-sm text-gray-700 capitalize">{request.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.updated_at || request.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing 5 of 42 documents
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Previous
              </button>
              <div className="flex">
                <button className="px-3 py-1 bg-primary-100 text-primary-700 rounded-md text-sm font-medium">1</button>
                <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm">2</button>
                <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm">3</button>
              </div>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5" />
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
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
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
                  <div>
                    <p className="font-medium text-gray-900">Juan Dela Cruz</p>
                    <p className="text-sm text-gray-600">Certificate of Residency</p>
                    <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
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

              <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded-r-lg">
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
            <button className="w-full mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center gap-1">
              View All Requests
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setShowIssueForm(true)}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="bg-primary-100 p-2 rounded-lg">
                  <PlusCircle className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Issue New Document</p>
                  <p className="text-sm text-gray-500">Create and issue documents</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Upload Template</p>
                  <p className="text-sm text-gray-500">Add new document templates</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Reports</p>
                  <p className="text-sm text-gray-500">Document statistics and analytics</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">System Settings</p>
                  <p className="text-sm text-gray-500">Configure document settings</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIssueForm && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <DocumentIssueForm onClose={() => setShowIssueForm(false)} />
          </div>
        </div>
      )}

      {showRequestModal && (
        <DocumentRequestModal onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
};

export default UserDocumentsPage;
