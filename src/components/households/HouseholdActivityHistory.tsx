import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Users, 
  Edit, 
  Plus, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { useHouseholdActivityLogs } from '@/hooks/useHouseholdActivityLogs';
import CachedAvatar from '@/components/ui/CachedAvatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HouseholdActivityHistoryProps {
  householdId: string;
  householdName: string;
}

const HouseholdActivityHistory: React.FC<HouseholdActivityHistoryProps> = ({
  householdId,
  householdName
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: logsData, isLoading, error } = useHouseholdActivityLogs(householdId, currentPage, 10);

  // Fetch user profiles for the logs
  const userIds = logsData?.logs?.map(log => log.user_id).filter(Boolean) || [];
  const { data: userProfiles } = useQuery({
    queryKey: ['user-profiles-household-logs', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, firstname, lastname, username')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return {};
      }

      const profileMap: Record<string, any> = {};
      data?.forEach(profile => {
        profileMap[profile.id] = profile;
      });

      return profileMap;
    },
    enabled: userIds.length > 0,
  });

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
      case 'household_created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
      case 'household_updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
      case 'household_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Home className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      case 'household_created':
        return 'Household Created';
      case 'household_updated':
        return 'Household Updated';
      case 'household_deleted':
        return 'Household Deleted';
      default:
        return action;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
      case 'household_created':
        return 'default';
      case 'update':
      case 'household_updated':
        return 'secondary';
      case 'delete':
      case 'household_deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Failed to load activity history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logsData?.logs || logsData.logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activity history found for this household</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History for {householdName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logsData.logs.map((log) => {
              const user = userProfiles?.[log.user_id];
              const userName = user ? `${user.firstname} ${user.lastname}`.trim() || user.username : 'Unknown User';
              
              return (
                <div key={log.id} className="flex items-start space-x-4 p-4 rounded-lg border bg-card/50">
                  <div className="flex-shrink-0">
                    <CachedAvatar
                      userId={log.user_id}
                      fallback={userName.charAt(0).toUpperCase()}
                      className="h-8 w-8"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getActionIcon(log.action)}
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by {userName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.created_at)}
                    </div>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                        className="mt-2 h-7 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {logsData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {logsData.logs.length} of {logsData.totalCount} activities
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {logsData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(logsData.totalPages, prev + 1))}
                  disabled={currentPage === logsData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getActionIcon(selectedLog.action)}
              Activity Details
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Action</p>
                    <p>{getActionLabel(selectedLog.action)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Date</p>
                    <p>{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">User</p>
                    <p>{userProfiles?.[selectedLog.user_id] ? 
                      `${userProfiles[selectedLog.user_id].firstname} ${userProfiles[selectedLog.user_id].lastname}`.trim() || 
                      userProfiles[selectedLog.user_id].username : 'Unknown User'}</p>
                  </div>
                  {selectedLog.ip && (
                    <div>
                      <p className="font-medium text-muted-foreground">IP Address</p>
                      <p>{selectedLog.ip}</p>
                    </div>
                  )}
                </div>
                
                {selectedLog.details && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Details</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HouseholdActivityHistory;