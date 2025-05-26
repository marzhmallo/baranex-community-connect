
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Pin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';

const LatestAnnouncements = () => {
  const { userProfile } = useAuth();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['latest-announcements', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
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
          <Megaphone className="h-5 w-5" />
          Latest Announcements
        </CardTitle>
        <CardDescription>Important updates from your barangay</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    {announcement.title}
                    {announcement.is_pinned && (
                      <Pin className="h-3 w-3 text-primary" />
                    )}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {announcement.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {announcement.content}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No announcements available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestAnnouncements;
