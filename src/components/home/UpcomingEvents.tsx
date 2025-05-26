
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';

const UpcomingEvents = () => {
  const { userProfile } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ['upcoming-events', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.brgyid,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>Stay informed about upcoming barangay activities</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border-l-4 border-primary pl-4 pb-3">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.start_time).toLocaleDateString()}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </div>
                )}
                {event.event_type && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {event.event_type}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No upcoming events at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
