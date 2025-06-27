
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentsList from "./DocumentsList";
import DocumentTemplatesList from "./DocumentTemplatesList";
import DocumentLogsList from "./DocumentLogsList";
import DocumentsStats from "./DocumentsStats";
import DocumentIssueForm from "./DocumentIssueForm";

const DocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [showIssueForm, setShowIssueForm] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
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
              <span className="material-symbols-outlined text-primary-600">description</span>
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
              <span className="material-symbols-outlined text-orange-600">pending_actions</span>
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
              <span className="material-symbols-outlined text-blue-600">landscape</span>
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>
                  <button 
                    onClick={() => setShowIssueForm(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Add Document
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="requests" className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                      <button className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-200 transition-colors">All</button>
                      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Pending</button>
                      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Approved</button>
                      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors">Rejected</button>
                    </div>
                  </div>
                  <DocumentsList status="all" searchQuery={searchQuery} />
                </TabsContent>
                
                <TabsContent value="templates" className="mt-6">
                  <DocumentTemplatesList />
                </TabsContent>
                
                <TabsContent value="logs" className="mt-6">
                  <DocumentLogsList />
                </TabsContent>
                
                <TabsContent value="stats" className="mt-6">
                  <DocumentsStats />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined">history</span>
                Recent Activity
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
                        <h3 className="font-medium text-gray-900">Barangay Clearance - Approved</h3>
                        <span className="text-xs text-gray-500">10 minutes ago</span>
                      </div>
                      <p className="text-sm text-gray-600">Document for Maria Santos has been approved and is ready for pickup.</p>
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
                      <p className="text-sm text-gray-600">Juan Dela Cruz's document is being processed.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[auto_1fr] gap-4">
                    <div className="mt-1">
                      <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow"></div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">Business Permit - New Request</h3>
                        <span className="text-xs text-gray-500">5 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-600">New business permit application submitted by Anna Reyes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined">add_circle</span>
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
                    <span className="material-symbols-outlined text-primary-600">add_circle</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Issue New Document</p>
                    <p className="text-sm text-gray-500">Create and issue documents</p>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-blue-600">upload_file</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload Template</p>
                    <p className="text-sm text-gray-500">Add new document templates</p>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-green-600">analytics</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-500">Document statistics and analytics</p>
                  </div>
                </button>
              </div>
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
    </div>
  );
};

export default DocumentsPage;
