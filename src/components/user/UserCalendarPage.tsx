
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

const localizer = momentLocalizer(moment);

const UserCalendarPage = () => {
  const { userProfile } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch events for users (view-only)
  const { data: events, isLoading } = useQuery({
    queryKey: ['user-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('brgyid', userProfile?.brgyid)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return data?.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        resource: event
      })) || [];
    },
    enabled: !!userProfile?.brgyid
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Barangay Calendar</h1>
          <p className="text-muted-foreground">View upcoming events and activities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Event Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events || []}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={setSelectedEvent}
                  views={['month', 'week', 'day']}
                  defaultView="month"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events?.slice(0, 5).map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{event.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {moment(event.start).format('MMM DD, YYYY')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium">{selectedEvent.title}</h4>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {moment(selectedEvent.start).format('MMM DD, YYYY HH:mm')}
                  </div>
                  {selectedEvent.resource?.location && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {selectedEvent.resource.location}
                    </div>
                  )}
                  {selectedEvent.resource?.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedEvent.resource.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCalendarPage;
