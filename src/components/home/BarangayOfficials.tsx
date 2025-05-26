
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const BarangayOfficials = () => {
  const { userProfile } = useAuth();

  const { data: officials, isLoading } = useQuery({
    queryKey: ['barangay-officials', userProfile?.brgyid],
    queryFn: async () => {
      if (!userProfile?.brgyid) return [];
      
      const { data, error } = await supabase
        .from('officials')
        .select('*')
        .eq('brgyid', userProfile.brgyid)
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!userProfile?.brgyid,
  });

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Barangay Officials
        </CardTitle>
        <CardDescription>Meet your local government representatives</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-1"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : officials && officials.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {officials.map((official) => (
              <div key={official.id} className="text-center p-3 border rounded-lg hover:shadow-md transition-shadow">
                <Avatar className="w-16 h-16 mx-auto mb-2">
                  <AvatarImage src={official.photo_url || ''} alt={official.name} />
                  <AvatarFallback>
                    {official.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-sm mb-1">{official.name}</h4>
                <p className="text-xs text-muted-foreground mb-1">{official.position}</p>
                {official.term_end && (
                  <p className="text-xs text-muted-foreground">
                    Term: {new Date(official.term_end).getFullYear()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No officials information available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BarangayOfficials;
