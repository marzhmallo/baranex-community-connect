import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Search, Activity, Download, Filter, RefreshCw, MoreVertical, ChevronLeft, ChevronRight, X, Eye, FileDown, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { UAParser } from 'ua-parser-js';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  ip?: string;
  agent?: string;
  brgyid: string;
}

interface UserProfile {
  id: string;
  firstname?: string;
  lastname?: string;
  username: string;
  email: string;
  role: string;
}

export default function ActivityLogPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tempFromDate, setTempFromDate] = useState({ month: "", day: "", year: "" });
  const [tempToDate, setTempToDate] = useState({ month: "", day: "", year: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  const { activities, userProfiles, loading, totalItems, refetch } = useActivityLogs({
    searchQuery,
    selectedUser,
    selectedAction,
    dateRange,
    currentPage,
    itemsPerPage
  });


  const parseDeviceInfo = (userAgent?: string): string => {
    if (!userAgent) return 'Unknown Device';
    
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      
      const { browser, os, device } = result;
      
      // Check if it's a mobile device
      if (device.type === 'mobile' || device.type === 'tablet') {
        if (device.vendor && device.model) {
          return `${device.vendor} ${device.model} (${browser.name || 'Unknown Browser'})`;
        } else if (os.name && os.version) {
          return `${os.name} ${os.version} (${browser.name || 'Unknown Browser'})`;
        } else {
          return `Mobile Device (${browser.name || 'Unknown Browser'})`;
        }
      }
      
      // Desktop/Laptop devices
      let deviceInfo = '';
      
      // Build OS info
      if (os.name) {
        deviceInfo = os.name;
        if (os.version) {
          deviceInfo += ` ${os.version}`;
        }
      } else {
        deviceInfo = 'Unknown OS';
      }
      
      // Add browser info
      if (browser.name) {
        deviceInfo += ` (${browser.name}`;
        if (browser.version) {
          // Only show major version number
          const majorVersion = browser.version.split('.')[0];
          deviceInfo += ` ${majorVersion}`;
        }
        deviceInfo += ')';
      }
      
      return deviceInfo || 'Unknown Device';
    } catch (error) {
      console.error('Error parsing user agent:', error);
      return 'Unknown Device';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
      case 'user_sign_in':
        return '👤';
      case 'logout':
      case 'sign_out':
      case 'user_sign_out':
        return '🚪';
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'export':
        return '📤';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
      case 'user_sign_in':
        return 'bg-green-100 text-green-800';
      case 'logout':
      case 'sign_out':
      case 'user_sign_out':
        return 'bg-gray-100 text-gray-800';
      case 'create':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const profile = userProfiles[userId];
    if (!profile) return 'Unknown User';
    
    if (profile.firstname && profile.lastname) {
      return `${profile.firstname} ${profile.lastname}`;
    }
    return profile.username || profile.email || 'Unknown User';
  };

  const getUserRole = (userId: string) => {
    const profile = userProfiles[userId];
    return profile?.role || 'Unknown';
  };

  const getUserInitials = (userId: string) => {
    const profile = userProfiles[userId];
    if (!profile) return 'U';
    
    if (profile.firstname && profile.lastname) {
      return `${profile.firstname[0]}${profile.lastname[0]}`;
    }
    return profile.username ? profile.username.substring(0, 2).toUpperCase() : 'U';
  };

  const getActionTitle = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
      case 'user_sign_in':
        return 'Login';
      case 'logout':
      case 'sign_out':
      case 'user_sign_out':
        return 'Logout';
      case 'create':
        return 'Create';
      case 'update':
        return 'Update';
      case 'delete':
        return 'Delete';
      case 'export':
        return 'Export';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  const getActionDescription = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
      case 'user_sign_in':
        return 'Successful authentication';
      case 'logout':
      case 'sign_out':
      case 'user_sign_out':
        return 'User signed out';
      default:
        return 'Action performed';
    }
  };

  const handleViewDetails = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const handleSaveDateRange = () => {
    if (tempFromDate.month && tempFromDate.day && tempFromDate.year && 
        tempToDate.month && tempToDate.day && tempToDate.year) {
      const fromDate = new Date(
        parseInt(tempFromDate.year), 
        parseInt(tempFromDate.month) - 1, 
        parseInt(tempFromDate.day)
      );
      const toDate = new Date(
        parseInt(tempToDate.year), 
        parseInt(tempToDate.month) - 1, 
        parseInt(tempToDate.day)
      );
      setDateRange({ from: fromDate, to: toDate });
    } else if (tempFromDate.month && tempFromDate.day && tempFromDate.year) {
      const fromDate = new Date(
        parseInt(tempFromDate.year), 
        parseInt(tempFromDate.month) - 1, 
        parseInt(tempFromDate.day)
      );
      setDateRange({ from: fromDate, to: undefined });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Activity logs export will be ready shortly",
    });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background p-6">
      <div className="w-full">
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Activity className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
                  <p className="text-primary-foreground/80 text-sm">Track all user activities and system events</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                  <span className="text-white text-sm font-medium">{totalItems} Total Logs</span>
                </div>
                <button 
                  onClick={refetch}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
                >
                  <RefreshCw className="text-white" size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">Search Activities</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by action, user, or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background"
                  />
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">Sort by User</label>
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admin Users</option>
                  <option value="user">Regular Users</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">Sort by Action</label>
                <select 
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 bg-background"
                >
                  <option value="all">All Actions</option>
                  <option value="user_sign_in">Login</option>
                  <option value="user_sign_out">Logout</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="export">Export</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Select Date Range</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateRange(undefined)}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">From Date</label>
                          <div className="flex gap-2 mt-1">
                            <select 
                              value={tempFromDate.month}
                              onChange={(e) => setTempFromDate(prev => ({ ...prev, month: e.target.value }))}
                              className="flex-1 px-2 py-1 text-sm border rounded-md bg-background"
                            >
                              <option value="">Month</option>
                              {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i + 1}>{new Date(0, i).toLocaleDateString('en', { month: 'long' })}</option>
                              ))}
                            </select>
                            <select 
                              value={tempFromDate.day}
                              onChange={(e) => setTempFromDate(prev => ({ ...prev, day: e.target.value }))}
                              className="w-16 px-2 py-1 text-sm border rounded-md bg-background"
                            >
                              <option value="">Day</option>
                              {Array.from({ length: 31 }, (_, i) => (
                                <option key={i} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                            <select 
                              value={tempFromDate.year}
                              onChange={(e) => setTempFromDate(prev => ({ ...prev, year: e.target.value }))}
                              className="w-20 px-2 py-1 text-sm border rounded-md bg-background"
                            >
                              <option value="">Year</option>
                              {Array.from({ length: 11 }, (_, i) => (
                                <option key={i} value={2020 + i}>{2020 + i}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">To Date</label>
                          <div className="flex gap-2 mt-1">
                            <select 
                              value={tempToDate.month}
                              onChange={(e) => setTempToDate(prev => ({ ...prev, month: e.target.value }))}
                              className="flex-1 px-2 py-1 text-sm border rounded-md bg-background"
                            >
                              <option value="">Month</option>
                              {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i + 1}>{new Date(0, i).toLocaleDateString('en', { month: 'long' })}</option>
                              ))}
                            </select>
                            <select 
                              value={tempToDate.day}
                              onChange={(e) => setTempToDate(prev => ({ ...prev, day: e.target.value }))}
                              className="w-16 px-2 py-1 text-sm border rounded-md bg-background"
                            >
                              <option value="">Day</option>
                              {Array.from({ length: 31 }, (_, i) => (
                                <option key={i} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                            <select 
                              value={tempToDate.year}
                              onChange={(e) => setTempToDate(prev => ({ ...prev, year: e.target.value }))}
                              className="w-20 px-2 py-1 text-sm border rounded-md bg-background"
                            >
                              <option value="">Year</option>
                              {Array.from({ length: 11 }, (_, i) => (
                                <option key={i} value={2020 + i}>{2020 + i}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <Button 
                            onClick={handleSaveDateRange}
                            className="w-full"
                            size="sm"
                          >
                            Apply Date Range
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-muted/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{format(new Date(activity.created_at), "yyyy-MM-dd HH:mm:ss")}</div>
                      <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.created_at))} ago</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-medium">{getUserInitials(activity.user_id)}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-foreground">{getUserName(activity.user_id)}</div>
                          <div className="text-sm text-muted-foreground capitalize">{getUserRole(activity.user_id)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                        <span className="mr-1">{getActionIcon(activity.action)}</span>
                        {getActionTitle(activity.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {activity.details?.resource || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{getActionDescription(activity.action)}</div>
                      {activity.agent && (
                        <div className="text-xs text-muted-foreground">{parseDeviceInfo(activity.agent)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
                      {activity.ip || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Success
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(activity)}
                        className="p-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-muted/50 px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-foreground">Showing</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1 border border-input rounded bg-background"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-foreground">of {totalItems} results</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-input rounded hover:bg-muted transition-colors duration-200 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded transition-colors duration-200 ${
                        currentPage === page 
                          ? 'bg-primary text-primary-foreground' 
                          : 'border border-input hover:bg-muted'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-input rounded hover:bg-muted transition-colors duration-200 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-card border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200"
                >
                  <Download size={16} />
                  <span>Export Logs</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors duration-200">
                  <Filter size={16} />
                  <span>Advanced Filter</span>
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Activity size={16} />
                <span>Last updated: {formatDistanceToNow(new Date())} ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-primary to-primary/90 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Eye className="text-white" size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Audit Log Details</h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-200 text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">{getUserInitials(selectedActivity.user_id)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{getActionTitle(selectedActivity.action)} Activity</h3>
                    <p className="text-muted-foreground">Performed by {getUserName(selectedActivity.user_id)} ({getUserRole(selectedActivity.user_id)}) • {formatDistanceToNow(new Date(selectedActivity.created_at))} ago</p>
                  </div>
                  <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Success
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase mb-2">Event Information</h4>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <div className="flex">
                        <span className="text-muted-foreground w-1/3">Timestamp:</span>
                        <span className="font-medium">{format(new Date(selectedActivity.created_at), "MMMM d, yyyy, h:mm a")}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-1/3">Event ID:</span>
                        <span className="font-medium">{selectedActivity.id}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-1/3">IP Address:</span>
                        <span className="font-medium">{selectedActivity.ip || 'N/A'}</span>
                      </div>
                      <div className="flex">
                        <span className="text-muted-foreground w-1/3">Action:</span>
                        <span className="font-medium">{selectedActivity.action}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase mb-2">Device Information</h4>
                    <div className="bg-muted rounded-lg p-4 space-y-4">
                      {selectedActivity.agent ? (
                        <>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Device</div>
                            <div className="font-medium">{parseDeviceInfo(selectedActivity.agent)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">User Agent</div>
                            <div className="font-mono text-xs break-all bg-background p-2 rounded border">{selectedActivity.agent}</div>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">No device information available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase mb-2">Detailed Event Data</h4>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
                    {JSON.stringify(selectedActivity.details || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="bg-muted px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-4 py-2 border border-input rounded-lg hover:bg-background transition-colors duration-200">
                  <FileDown size={16} />
                  <span>Export</span>
                </button>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}