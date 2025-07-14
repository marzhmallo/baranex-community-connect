import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { Search, Activity, User, Clock, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchActivityLogs();
  }, [user]);

  const fetchActivityLogs = async () => {
    if (!user) return;

    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('id', user.id)
        .single();

      if (!userProfile?.brgyid) return;

      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setActivities(logs || []);

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set(logs?.map(log => log.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, firstname, lastname, username, email, role')
          .in('id', userIds);

        const profileMap = profiles?.reduce((acc, profile) => ({
          ...acc,
          [profile.id]: profile
        }), {}) || {};

        setUserProfiles(profileMap);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseDeviceInfo = (userAgent?: string): string => {
    if (!userAgent) return 'Unknown Device';
    
    let device = 'Desktop';
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    
    // Detect device type
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      device = 'Tablet';
    }
    
    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';
    
    return `${device} (${browser} on ${os})`;
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
        return '👤';
      case 'logout':
      case 'sign_out':
        return '🚪';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'logout':
      case 'sign_out':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const getActionDescription = (action: string, userName: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
        return `${userName} successfully signed in.`;
      case 'logout':
      case 'sign_out':
        return `${userName} signed out.`;
      default:
        return `${userName} performed ${action}.`;
    }
  };

  const getActionTitle = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
        return 'User Login';
      case 'logout':
      case 'sign_out':
        return 'User Logout';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const searchLower = searchQuery.toLowerCase();
    const userName = getUserName(activity.user_id).toLowerCase();
    const action = activity.action.toLowerCase();
    const details = JSON.stringify(activity.details).toLowerCase();
    
    return userName.includes(searchLower) || 
           action.includes(searchLower) || 
           details.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          Track all user activities and system events in your barangay
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by user, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities ({filteredActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                 <div 
                   key={activity.id} 
                   className={`p-6 border-b border-border ${index === filteredActivities.length - 1 ? 'border-b-0' : ''}`}
                 >
                   <div className="space-y-3">
                     {/* Action Title with Icon */}
                     <div className="flex items-center gap-2">
                       <span className="text-lg">{getActionIcon(activity.action)}</span>
                       <h3 className="text-lg font-semibold text-foreground">
                         {getActionTitle(activity.action)}
                       </h3>
                     </div>

                     {/* Action Description */}
                     <p className="text-muted-foreground">
                       {getActionDescription(activity.action, getUserName(activity.user_id))}
                     </p>

                     {/* Timestamp */}
                     <div className="text-sm">
                       <span className="font-medium text-foreground">When: </span>
                       <span className="text-muted-foreground">
                         {format(new Date(activity.created_at), "MMMM d, yyyy, h:mm a")}
                       </span>
                     </div>

                     {/* User Role */}
                     <div className="text-sm">
                       <span className="font-medium text-foreground">Role: </span>
                       <span className="text-muted-foreground capitalize">
                         {getUserRole(activity.user_id)}
                       </span>
                     </div>

                     {/* Device/Browser Info */}
                     {activity.agent && (
                       <div className="text-sm">
                         <span className="font-medium text-foreground">From: </span>
                         <span className="text-muted-foreground">
                           {parseDeviceInfo(activity.agent)}
                         </span>
                       </div>
                     )}

                     {/* IP Address */}
                     {activity.ip && (
                       <div className="text-sm">
                         <span className="font-medium text-foreground">IP Address: </span>
                         <span className="text-muted-foreground font-mono">
                           {activity.ip}
                         </span>
                       </div>
                     )}

                     {/* Additional Details (if any) */}
                     {Object.keys(activity.details || {}).length > 0 && (
                       <div className="text-sm">
                         <span className="font-medium text-foreground">Additional Details: </span>
                         <div className="mt-1 p-3 bg-muted rounded-md">
                           <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                             {JSON.stringify(activity.details, null, 2)}
                           </pre>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No activity logs found</p>
                <p className="text-sm">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Activity logs will appear here when users interact with the system'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}