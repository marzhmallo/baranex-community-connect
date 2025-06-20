
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BellRing, Calendar, User, Pin } from 'lucide-react';
import moment from 'moment';

const UserAnnouncementsPage = () => {
  const { userProfile } = useAuth();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['user-announcements'],
    queryFn: async () => {
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('brgyid', userProfile?.brgyid)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names
      const userIds = [...new Set(announcementsData.map(a => a.created_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, firstname, lastname')
        .in('id', userIds);

      const userMap = profilesData?.reduce((acc, user) => {
        acc[user.id] = `${user.firstname} ${user.lastname}`;
        return acc;
      }, {}) || {};

      return announcementsData.map(announcement => ({
        ...announcement,
        authorName: userMap[announcement.created_by] || 'Unknown User'
      }));
    },
    enabled: !!userProfile?.brgyid
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <BellRing className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barangay Announcements</h1>
          <p className="text-muted-foreground">Stay updated with the latest news and updates</p>
        </div>
      </div>

      <div className="space-y-6">
        {announcements?.map((announcement) => (
          <Card key={announcement.id} className={announcement.is_pinned ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {announcement.is_pinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-xl text-foreground">{announcement.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {announcement.authorName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {moment(announcement.created_at).format('MMM DD, YYYY')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={announcement.category === 'urgent' ? 'destructive' : 'secondary'}>
                    {announcement.category}
                  </Badge>
                  {announcement.is_pinned && (
                    <Badge variant="outline">Pinned</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
              
              {announcement.photo_url && (
                <div className="mt-4">
                  <img 
                    src={announcement.photo_url} 
                    alt="Announcement" 
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
              
              {announcement.attachment_url && (
                <div className="mt-4">
                  <a 
                    href={announcement.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {announcements?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BellRing className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No announcements available at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserAnnouncementsPage;
