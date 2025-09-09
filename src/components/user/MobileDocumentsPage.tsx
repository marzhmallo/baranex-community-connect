import React from 'react';

const MobileDocumentsPage = () => {
  return (
    <div className="w-full bg-background">
      {/* Mobile Version */}
      <div className="md:hidden">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-2">Documents</h1>
          
          {/* Status Overview Cards - Horizontal Scrolling */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Status Overview
              </h2>
              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
            </div>
            
            {/* Horizontal Scrolling Cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              <div className="min-w-[120px] snap-start rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 flex flex-col items-center text-center">
                <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-full mb-2">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">schedule</span>
                </div>
                <p className="text-xs text-muted-foreground">Requests</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">5</p>
              </div>
              
              <div className="min-w-[120px] snap-start rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 flex flex-col items-center text-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full mb-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">hourglass_top</span>
                </div>
                <p className="text-xs text-muted-foreground">Processing</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">3</p>
              </div>
              
              <div className="min-w-[120px] snap-start rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 flex flex-col items-center text-center">
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full mb-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">inventory_2</span>
                </div>
                <p className="text-xs text-muted-foreground">Ready</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">2</p>
              </div>
              
              <div className="min-w-[120px] snap-start rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3 flex flex-col items-center text-center">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full mb-2">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">task_alt</span>
                </div>
                <p className="text-xs text-muted-foreground">Released</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">8</p>
              </div>
              
              <div className="min-w-[120px] snap-start rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 flex flex-col items-center text-center">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full mb-2">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">cancel</span>
                </div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">1</p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              Total: 19
            </div>
          </div>
          
          {/* Document Tracking */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined">bar_chart</span>
                My Requests
              </h2>
            </div>
            
            {/* Search and Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">search</span>
                <input
                  type="text"
                  placeholder="Search by tracking ID..."
                  className="pl-10 pr-4 py-2 border border-border rounded-lg w-full bg-background"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                <button className="snap-start px-3 py-1 rounded-full text-sm whitespace-nowrap bg-primary/10 text-primary">
                  All Documents
                </button>
                <button className="snap-start px-3 py-1 rounded-full text-sm whitespace-nowrap bg-muted text-foreground hover:bg-muted/80 transition-colors">
                  Requests
                </button>
                <button className="snap-start px-3 py-1 rounded-full text-sm whitespace-nowrap bg-muted text-foreground hover:bg-muted/80 transition-colors">
                  Processing
                </button>
                <button className="snap-start px-3 py-1 rounded-full text-sm whitespace-nowrap bg-muted text-foreground hover:bg-muted/80 transition-colors">
                  Released
                </button>
                <button className="snap-start px-3 py-1 rounded-full text-sm whitespace-nowrap bg-muted text-foreground hover:bg-muted/80 transition-colors">
                  Ready
                </button>
                <button className="snap-start px-3 py-1 rounded-full text-sm whitespace-nowrap bg-muted text-foreground hover:bg-muted/80 transition-colors">
                  Rejected
                </button>
              </div>
            </div>
            
            {/* Document Cards */}
            <div className="space-y-3">
              <div className="border border-border rounded-lg hover:shadow-md transition-shadow p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-primary text-sm">#DOC-20230001</div>
                    <div className="text-foreground font-semibold">Barangay Clearance</div>
                  </div>
                  <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">Pending</div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested by:</span>
                    <span className="text-foreground font-medium">Juan Dela Cruz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last update:</span>
                    <span className="text-foreground">Aug 15, 2023, 10:30 AM</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                  <button className="px-3 py-1 text-sm rounded-md bg-transparent hover:bg-accent flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    View
                  </button>
                  <button className="px-3 py-1 text-sm rounded-md bg-transparent hover:bg-accent flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit
                  </button>
                </div>
              </div>
              
              <div className="border border-border rounded-lg hover:shadow-md transition-shadow p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-primary text-sm">#DOC-20230002</div>
                    <div className="text-foreground font-semibold">Certificate of Residency</div>
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Processing</div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested by:</span>
                    <span className="text-foreground font-medium">Juan Dela Cruz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last update:</span>
                    <span className="text-foreground">Aug 10, 2023, 02:15 PM</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                  <button className="px-3 py-1 text-sm rounded-md bg-transparent hover:bg-accent flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    View
                  </button>
                </div>
              </div>
              
              <div className="border border-border rounded-lg hover:shadow-md transition-shadow p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-primary text-sm">#DOC-20230003</div>
                    <div className="text-foreground font-semibold">Business Permit</div>
                  </div>
                  <div className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Ready</div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested by:</span>
                    <span className="text-foreground font-medium">Juan Dela Cruz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last update:</span>
                    <span className="text-foreground">Aug 5, 2023, 09:45 AM</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                  <button className="px-3 py-1 text-sm rounded-md bg-transparent hover:bg-accent flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    View
                  </button>
                </div>
              </div>
            </div>
            
            {/* Simple Pagination */}
            <div className="flex justify-center mt-6 gap-1">
              <button className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary text-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-sm">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-sm">3</button>
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          
          {/* Available Documents */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Available Documents</h2>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">search</span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-border rounded-lg w-40 bg-background"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                    <span className="material-symbols-outlined text-blue-500">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground text-sm truncate">Barangay Clearance</h4>
                    <p className="text-xs text-muted-foreground">₱100</p>
                  </div>
                  <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                    <span className="material-symbols-outlined text-blue-500">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground text-sm truncate">Certificate of Residency</h4>
                    <p className="text-xs text-muted-foreground">₱50</p>
                  </div>
                  <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                    <span className="material-symbols-outlined text-blue-500">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground text-sm truncate">Business Permit</h4>
                    <p className="text-xs text-muted-foreground">₱250</p>
                  </div>
                  <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                    <span className="material-symbols-outlined text-blue-500">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-foreground text-sm truncate">Barangay ID</h4>
                    <p className="text-xs text-muted-foreground">₱150</p>
                  </div>
                  <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Simple Pagination */}
            <div className="flex justify-center mt-6 gap-1">
              <button className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary text-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-sm">2</button>
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          
          {/* Floating Action Button */}
          <button className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center z-40 transform hover:scale-105 transition-all duration-200">
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileDocumentsPage;