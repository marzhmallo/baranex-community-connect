import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import IssueDocumentForm from "@/components/documents/IssueDocumentForm";
import DocumentTemplateForm from "@/components/documents/DocumentTemplateForm";
import { FileText, Clock, CheckCircle, AlertTriangle, Search, Plus, Upload, BarChart3, Settings, Filter, Download, Edit, Trash2, Eye, TrendingUp, RefreshCw, Calendar, Users, Activity, X } from "lucide-react";
const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const {
    userProfile
  } = useAuth();

  // Fetch document templates from the database
  const {
    data: documentTemplates,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('document_types').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    }
  });

  // For display purposes, we'll still show some mock data if no real templates exist
  const mockTemplates = [{
    id: '1',
    name: 'Barangay Clearance',
    description: 'Certificate of good moral character and residence',
    fee: 50,
    requirements: 'Valid ID, Proof of residence'
  }, {
    id: '2',
    name: 'Certificate of Indigency',
    description: 'Certification for financial assistance applications',
    fee: 0,
    requirements: 'Valid ID, Proof of income (if any)'
  }, {
    id: '3',
    name: 'Business Permit',
    description: 'Permit to operate small business in the barangay',
    fee: 200,
    requirements: 'Valid ID, Business registration, Location map'
  }];

  // Use real templates if available, otherwise fallback to mock data
  const templatesData = documentTemplates && documentTemplates.length > 0 ? documentTemplates : mockTemplates;
  const handleTemplateFormClose = () => {
    setShowTemplateForm(false);
    refetch(); // Refresh the templates list
  };
  return <div className="w-full max-w-7xl mx-auto p-4 bg-background min-h-screen space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Barangay Document Management</h1>
        <p className="text-muted-foreground">Manage official documents, requests, and issuances for the barangay community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Documents</p>
              <p className="text-lg font-bold text-foreground">1,247</p>
            </div>
            <div className="bg-primary/20 p-2 rounded-full">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending Requests</p>
              <p className="text-lg font-bold text-orange-600">23</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-full">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Issued Today</p>
              <p className="text-lg font-bold text-green-600">8</p>
            </div>
            <div className="bg-green-100 dark:bg-green-500/20 p-2 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Templates</p>
              <p className="text-lg font-bold text-blue-600">{templatesData.length}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-full">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="bg-card rounded-lg shadow-sm border p-4 col-span-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Document Processing Status
            </h2>
            <div className="flex gap-2">
              <select className="text-xs border border-input rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground">
                <option>This Week</option>
                <option>This Month</option>
                <option>Last 3 Months</option>
                <option>Last Year</option>
              </select>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Ready for Pickup</p>
                <p className="text-lg font-bold text-green-600">18</p>
              </div>
              <div className="bg-green-100 dark:bg-green-500/20 p-1.5 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Processing</p>
                <p className="text-lg font-bold text-yellow-600">12</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-500/20 p-1.5 rounded-full">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">For Review</p>
                <p className="text-lg font-bold text-blue-600">7</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-500/20 p-1.5 rounded-full">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-lg font-bold text-purple-600">42</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-500/20 p-1.5 rounded-full">
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-lg font-bold text-red-600">3</p>
              </div>
              <div className="bg-red-100 dark:bg-red-500/20 p-1.5 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
            <span>Processing Time (Average)</span>
            <span>Updated: Today, 11:30 AM</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2 mb-1">
            <div className="bg-primary h-2 rounded-full" style={{
            width: '70%'
          }}></div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">0 days</span>
            <span className="font-medium text-primary">1.2 days</span>
            <span className="text-muted-foreground">3 days (target)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg shadow-sm border border-border min-h-[620px] flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Document Templates</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input type="text" placeholder="Search templates..." className="pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-56 bg-background text-foreground" />
                  </div>
                  <button onClick={() => setShowTemplateForm(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 border border-border">
                    <Plus className="h-4 w-4" />
                    Add Document Template
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  <button className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm hover:bg-primary/30 transition-colors border border-border">All</button>
                  <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors border border-border">Certificates</button>
                  <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors border border-border">Permits</button>
                  <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors border border-border">Clearances</button>
                  <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors border border-border">IDs</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center border border-input rounded-lg">
                    <select className="text-sm px-3 py-2 rounded-l-lg border-r border-input focus:outline-none bg-background text-foreground">
                      <option>Bulk Actions</option>
                      <option>Download Selected</option>
                      <option>Archive Selected</option>
                      <option>Delete Selected</option>
                    </select>
                    <button className="px-3 py-2 bg-muted text-foreground rounded-r-lg hover:bg-muted/80 transition-colors text-sm border-l border-border">
                      Apply
                    </button>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 border border-input rounded px-3 py-2 text-sm hover:bg-muted transition-colors">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        Advanced Filters
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-6" align="end">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Document Type</label>
                            <select className="w-full border border-input rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground">
                              <option value="">All Types</option>
                              <option value="certificate">Certificates</option>
                              <option value="permit">Permits</option>
                              <option value="clearance">Clearances</option>
                              <option value="id">IDs</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
                            <div className="grid grid-cols-2 gap-3">
                              <input type="date" className="w-full border border-input rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
                              <input type="date" className="w-full border border-input rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                            <select className="w-full border border-input rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground">
                              <option value="">All Statuses</option>
                              <option value="active">Active</option>
                              <option value="archived">Archived</option>
                              <option value="expired">Expired</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Creator</label>
                            <select className="w-full border border-input rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground">
                              <option value="">All Users</option>
                              <option value="admin">Admin Users</option>
                              <option value="staff">Staff Members</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                            <select className="w-full border border-input rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground">
                              <option value="">All Priority</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4">
                          <button className="px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors">
                            Reset Filters
                          </button>
                          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Apply Filters
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-3 flex-1 mb-4">
                {isLoading ? <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading templates...</p>
                  </div> : templatesData.map(template => <div key={template.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center h-5">
                            <input id={`doc${template.id}`} type="checkbox" className="w-4 h-4 text-primary border-input rounded focus:ring-primary" />
                          </div>
                          <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-lg">
                            <FileText className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            {template.fee !== undefined && <p className="text-xs text-muted-foreground">Fee: ₱{template.fee}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-full">Active</span>
                          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>)}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input id="selectAll" type="checkbox" className="w-4 h-4 text-primary border-input rounded focus:ring-primary" />
                    <label htmlFor="selectAll" className="text-sm text-muted-foreground">
                      Select All
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                      Previous
                    </button>
                    <div className="flex gap-1">
                      <button className="px-3 py-1 bg-primary/20 text-primary rounded-md text-sm font-medium">1</button>
                      <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md text-sm">2</button>
                      <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md text-sm">3</button>
                    </div>
                    <button className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow-sm border overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Document Status Updates
              </h2>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-border z-0"></div>
                <div className="p-4 relative z-10 space-y-4">
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <div className="mt-1">
                      <div className="h-5 w-5 rounded-full bg-green-500 border-4 border-card shadow"></div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-3 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground">Barangay Clearance - Ready for Pickup</h3>
                        <span className="text-xs text-muted-foreground">10 minutes ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Document for Maria Santos has been signed and is ready for pickup at the Barangay Hall.</p>
                      <div className="flex mt-2 gap-2">
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-full">Ready for pickup</span>
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">ID: #BRG-2023-0042</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <div className="mt-1">
                      <div className="h-5 w-5 rounded-full bg-yellow-500 border-4 border-card shadow"></div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-3 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground">Certificate of Residency - Processing</h3>
                        <span className="text-xs text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Juan Dela Cruz's document is being processed. Pending approval from the Barangay Captain.</p>
                      <div className="flex mt-2 gap-2">
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full">Processing</span>
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">ID: #BRG-2023-0041</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <div className="mt-1">
                      <div className="h-5 w-5 rounded-full bg-red-500 border-4 border-card shadow"></div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h3 className="font-medium text-foreground">Barangay ID - Rejected</h3>
                        <span className="text-xs text-muted-foreground">Yesterday, 2:15 PM</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Carlos Mendoza's application for Barangay ID was rejected. Reason: Insufficient supporting documents.</p>
                      <div className="flex mt-2 gap-2">
                        <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full">Rejected</span>
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">ID: #BRG-2023-0039</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-border p-3 text-center">
                <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center justify-center gap-1 mx-auto">
                  View All Updates
                  <TrendingUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Document Tracking System
            </h2>
            <Button onClick={() => setShowIssueForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Issue Document
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input type="text" placeholder="Search by tracking ID..." className="pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64 bg-background text-foreground" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm hover:bg-primary/30 transition-colors">All Documents</button>
              <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors">In Progress</button>
              <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors">Completed</button>
              <button className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm hover:bg-muted/80 transition-colors">Rejected</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tracking ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Document</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Requested By</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Update</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">#BRG-2023-0042</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">Barangay Clearance</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">Maria Santos</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-foreground">Ready for pickup</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">Today, 10:45 AM</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1">
                      <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">#BRG-2023-0041</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">Certificate of Residency</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">Juan Dela Cruz</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-sm text-foreground">Processing</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">Today, 9:20 AM</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1">
                      <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">#BRG-2023-0040</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">Business Permit</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">Anna Reyes</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-foreground">For Review</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">Yesterday, 4:30 PM</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-1">
                      <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing 3 of 42 documents
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                Previous
              </button>
              <div className="flex gap-1">
                <button className="px-3 py-1 bg-primary/20 text-primary rounded-md text-sm font-medium">1</button>
                <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md text-sm">2</button>
                <button className="px-3 py-1 text-muted-foreground hover:bg-muted rounded-md text-sm">3</button>
              </div>
              <button className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg shadow-sm border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Document Requests
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-500/10 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">Maria Santos</p>
                    <p className="text-sm text-muted-foreground">Barangay Clearance</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors">
                      Deny
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-500/10 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">Juan Dela Cruz</p>
                    <p className="text-sm text-muted-foreground">Certificate of Residency</p>
                    <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors">
                      Deny
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-500/10 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">Anna Reyes</p>
                    <p className="text-sm text-muted-foreground">Business Permit</p>
                    <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors">
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 text-primary hover:text-primary/80 text-sm font-medium flex items-center justify-center gap-1">
              View All Requests
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setShowIssueForm(true)} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Issue New Document</p>
                  <p className="text-sm text-muted-foreground">Create and issue documents</p>
                </div>
              </button>

              <button onClick={() => setShowTemplateForm(true)} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Add Document Template</p>
                  <p className="text-sm text-muted-foreground">Create new document templates</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="bg-green-100 dark:bg-green-500/20 p-2 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">View Reports</p>
                  <p className="text-sm text-muted-foreground">Document statistics and analytics</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">System Settings</p>
                  <p className="text-sm text-muted-foreground">Configure document settings</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIssueForm && <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <IssueDocumentForm onClose={() => setShowIssueForm(false)} />
          </div>
        </div>}

      {showTemplateForm && <div className="fixed inset-0 z-50 overflow-auto bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 py-[26px] mx-0 my-0">
          <div className="bg-card rounded-xl shadow-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <DocumentTemplateForm template={null} onClose={handleTemplateFormClose} />
            </div>
          </div>
        </div>}
    </div>;
};
export default DocumentsPage;