import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, FileText, Users, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  target_audience: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
}

interface OfficialWithPosition {
  id: string;
  name: string;
  photo_url: string;
  position: string;
  term_start: string;
  term_end: string;
}

const HomePage = () => {
  const { userProfile } = useAuth();
  const [barangayName, setBarangayName] = useState<string>('');
  const [currentDate, setCurrentDate] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [barangayOfficials, setBarangayOfficials] = useState<OfficialWithPosition[]>([]);

  useEffect(() => {
    // Set current date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));

    // Fetch barangay name immediately
    const fetchBarangayName = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from('barangays')
            .select('barangayname')
            .eq('id', userProfile.brgyid)
            .single();
          
          if (data && !error) {
            setBarangayName(data.barangayname);
          }
        } catch (err) {
          console.error('Error fetching barangay name:', err);
        }
      }
    };

    // Fetch upcoming events
    const fetchUpcomingEvents = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('brgyid', userProfile.brgyid)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(3);
          
          if (data && !error) {
            setUpcomingEvents(data);
          }
        } catch (err) {
          console.error('Error fetching upcoming events:', err);
        }
      }
    };

    // Fetch latest announcements
    const fetchLatestAnnouncements = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('brgyid', userProfile.brgyid)
            .order('created_at', { ascending: false })
            .limit(2);
          
          if (data && !error) {
            setLatestAnnouncements(data);
          }
        } catch (err) {
          console.error('Error fetching latest announcements:', err);
        }
      }
    };

    // Fetch barangay officials with positions
    const fetchBarangayOfficials = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from('official_positions')
            .select(`
              id,
              position,
              term_start,
              term_end,
              is_current,
              officials (
                id,
                name,
                photo_url
              )
            `)
            .eq('officials.brgyid', userProfile.brgyid)
            .eq('is_current', true)
            .order('term_start', { ascending: true })
            .limit(5);
          
          if (data && !error) {
            // Transform the data to match our interface
            const officialsWithPositions: OfficialWithPosition[] = data
              .filter(item => item.officials) // Only include items with valid officials data
              .map(item => ({
                id: item.officials.id,
                name: item.officials.name,
                photo_url: item.officials.photo_url,
                position: item.position,
                term_start: item.term_start,
                term_end: item.term_end
              }));
            
            setBarangayOfficials(officialsWithPositions);
          }
        } catch (err) {
          console.error('Error fetching barangay officials:', err);
        }
      }
    };

    fetchBarangayName();
    fetchUpcomingEvents();
    fetchLatestAnnouncements();
    fetchBarangayOfficials();
  }, [userProfile]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventBorderColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'festival':
        return 'border-purple-500';
      case 'health':
        return 'border-blue-500';
      case 'environment':
        return 'border-green-500';
      default:
        return 'border-green-500';
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType?.toLowerCase()) {
      case 'festival':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'health':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'environment':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    }
  };

  const getAnnouncementBorderColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'alert':
        return 'border-red-200 dark:border-red-800';
      case 'news':
        return 'border-blue-200 dark:border-blue-800';
      default:
        return 'border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header Card */}
      <div className="relative bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 mb-6 text-primary-foreground">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userProfile?.firstname}!
            </h1>
            <p className="text-primary-foreground/80">
              Here's what's happening in {barangayName || 'your barangay'} today
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-primary-foreground/20 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Events
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground">•••</button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className={`border-l-4 ${getEventBorderColor(event.event_type)} pl-4 py-2`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.start_time)} • {formatTime(event.start_time)}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.location || 'Barangay Hall'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getEventBadgeColor(event.event_type)}`}>
                      {event.event_type || 'Event'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No upcoming events scheduled
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Announcements */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Latest Announcements
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground">•••</button>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestAnnouncements.length > 0 ? (
              latestAnnouncements.map((announcement) => (
                <div key={announcement.id} className={`border rounded-lg p-3 ${getAnnouncementBorderColor(announcement.category)}`}>
                  <div className="flex items-start space-x-2">
                    {announcement.category === 'Alert' && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />}
                    <div>
                      <h4 className={`font-medium ${announcement.category === 'Alert' ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'}`}>
                        {announcement.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {announcement.content.length > 100 
                          ? `${announcement.content.substring(0, 100)}...` 
                          : announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Posted by Admin • {formatDate(announcement.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No recent announcements
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Certificates & Documents */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Your Certificates & Documents
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground">•••</button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Barangay Clearance</h4>
                  <p className="text-xs text-muted-foreground">Requested May 14, 2023</p>
                </div>
              </div>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded dark:bg-yellow-900 dark:text-yellow-300">Pending</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Certificate of Residency</h4>
                  <p className="text-xs text-muted-foreground">Requested May 10, 2023</p>
                </div>
              </div>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded dark:bg-green-900 dark:text-green-300">Ready</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Indigency Certificate</h4>
                  <p className="text-xs text-muted-foreground">Requested Apr 25, 2023</p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-300">Approved</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Business Permit</h4>
                  <p className="text-xs text-muted-foreground">Requested May 1, 2023</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded dark:bg-red-900 dark:text-red-300">Declined</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barangay Officials Section */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-primary flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Your Barangay Officials
          </CardTitle>
          <button className="text-muted-foreground hover:text-foreground">•••</button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {barangayOfficials.length > 0 ? (
              barangayOfficials.map((official) => (
                <div key={official.id} className="text-center">
                  <div className="w-20 h-20 bg-muted rounded-lg mx-auto mb-3 overflow-hidden">
                    {official.photo_url ? (
                      <img 
                        src={official.photo_url} 
                        alt={official.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">
                          {official.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm text-foreground">{official.name}</h4>
                  <p className="text-xs text-primary">{official.position}</p>
                  <p className="text-xs text-muted-foreground">
                    Term: {official.term_start ? new Date(official.term_start).getFullYear() : 'N/A'}-
                    {official.term_end ? new Date(official.term_end).getFullYear() : 'Present'}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-4">
                No officials data available
              </div>
            )}
          </div>
          
          <div className="text-center mt-6">
            <Link 
              to="/hub/officials" 
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View all barangay officials →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
