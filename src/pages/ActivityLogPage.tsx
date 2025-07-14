import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
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
          .select('id, firstname, lastname, username, email')
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
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return 'Mobile Device';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'sign_in':
        return <User className="h-4 w-4 text-green-500" />;
      case 'logout':
      case 'sign_out':
        return <User className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
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
                  className={`p-4 border-b border-border ${index === filteredActivities.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full border-2 border-border">
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActionColor(activity.action)}>
                          {activity.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {getUserName(activity.user_id)}
                      </p>
                      {Object.keys(activity.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mb-2">
                          <pre className="whitespace-pre-wrap font-mono bg-muted p-2 rounded text-xs">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {activity.ip && (
                          <span>IP: {activity.ip}</span>
                        )}
                        {activity.agent && (
                          <span className="flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            {parseDeviceInfo(activity.agent)}
                          </span>
                        )}
                      </div>
                    </div>
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