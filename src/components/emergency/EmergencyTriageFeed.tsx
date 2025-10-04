import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, MapPin, Phone, Search, Flame, Droplets, Heart, Wrench, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface EmergencyRequest {
  id: string;
  request_type: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  details: string | null;
  created_at: string;
  resident_id: string;
}

interface EmergencyTriageFeedProps {
  brgyid: string;
  onRequestClick: (requestId: string) => void;
}

const requestTypeIcons: Record<string, any> = {
  'Fire': Flame,
  'Medical Emergency': Heart,
  'Flood': Droplets,
  'Infrastructure Damage': Wrench,
  'Rescue Operation': Users,
};

const statusConfig = {
  'Pending': { color: 'bg-red-500', textColor: 'text-red-500', icon: '🔴', badgeVariant: 'destructive' as const },
  'In Progress': { color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: '🟡', badgeVariant: 'secondary' as const },
  'Responded': { color: 'bg-green-500', textColor: 'text-green-500', icon: '🟢', badgeVariant: 'default' as const },
};

export const EmergencyTriageFeed = ({ brgyid, onRequestClick }: EmergencyTriageFeedProps) => {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
    setupRealtimeSubscription();
  }, [brgyid]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_requests' as any)
        .select('*')
        .eq('brgyid', brgyid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('emergency-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests',
          filter: `brgyid=eq.${brgyid}`
        },
        (payload) => {
          console.log('Emergency request change:', payload);

          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as EmergencyRequest, ...prev]);
            toast({
              title: "🚨 New Emergency Request",
              description: `${(payload.new as EmergencyRequest).request_type} request received`,
              variant: "destructive",
            });
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(req => req.id === payload.new.id ? payload.new as EmergencyRequest : req)
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(req => req.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredRequests = requests
    .filter(req => filterStatus === 'All' || req.status === filterStatus)
    .filter(req => 
      searchQuery === '' || 
      req.request_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.details?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by status priority (Pending > In Progress > Responded), then by timestamp
      const statusPriority = { 'Pending': 0, 'In Progress': 1, 'Responded': 2 };
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 3;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 3;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statusCounts = {
    'All': requests.length,
    'Pending': requests.filter(r => r.status === 'Pending').length,
    'In Progress': requests.filter(r => r.status === 'In Progress').length,
    'Responded': requests.filter(r => r.status === 'Responded').length,
  };

  if (loading) {
    return (
      <div className="w-80 h-full border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <aside className="w-80 h-full border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Emergency Triage
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="text-xs"
            >
              {status}
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {filterStatus === 'All' ? 'No emergency requests' : `No ${filterStatus.toLowerCase()} requests`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const Icon = requestTypeIcons[request.request_type] || AlertCircle;
              const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig['Pending'];

              return (
                <Card 
                  key={request.id} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
                  onClick={() => onRequestClick(request.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${status.color} bg-opacity-10`}>
                          <Icon className={`h-4 w-4 ${status.textColor}`} />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {request.request_type}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            ID: {request.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.badgeVariant} className="text-xs">
                        {status.icon} {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {request.details && (
                      <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                        {request.details}
                      </p>
                    )}
                    {request.latitude && request.longitude && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-mono">
                          {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
                        </span>
                      </div>
                    )}
                    <Button size="sm" className="w-full mt-2" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
