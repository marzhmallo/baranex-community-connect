import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Calendar, MapPin } from 'lucide-react';
import moment from 'moment';

interface OfficialData {
  id: string;
  name: string;
  photo_url?: string;
}

interface PositionData {
  id: string;
  position: string;
  committee?: string;
  term_start: string;
  term_end?: string;
  description?: string;
  official_id: string;
}

interface OfficialPositionData extends PositionData {
  officials: OfficialData | null;
}

const UserOfficialsPage = () => {
  const { userProfile } = useAuth();

  const { data: officials, isLoading } = useQuery({
    queryKey: ['user-officials'],
    queryFn: async (): Promise<OfficialPositionData[]> => {
      if (!userProfile?.brgyid) {
        return [];
      }

      try {
        // Step 1: Get official positions using raw query
        const currentDate = new Date().toISOString();
        const { data: positions, error: positionsError } = await supabase
          .rpc('get_current_official_positions', {
            barangay_id: userProfile.brgyid,
            current_date: currentDate
          })
          .returns<PositionData[]>();

        if (positionsError) {
          console.error('Error fetching positions:', positionsError);
          // Fallback to direct query if RPC fails
          const fallbackQuery = await supabase
            .from('official_positions')
            .select('id, position, committee, term_start, term_end, description, official_id');
          
          const positions = fallbackQuery.data as PositionData[] || [];
          
          if (!positions || positions.length === 0) {
            return [];
          }

          // Step 2: Get officials data
          const officialIds = positions.map(pos => pos.official_id);
          const uniqueOfficialIds = [...new Set(officialIds)];

          const { data: officials, error: officialsError } = await supabase
            .from('officials')
            .select('id, name, photo_url');

          if (officialsError) {
            console.error('Error fetching officials:', officialsError);
            throw officialsError;
          }

          const officialsData = officials as OfficialData[] || [];

          // Step 3: Manually combine the data
          const result: OfficialPositionData[] = positions.map(position => {
            const official = officialsData.find(off => off.id === position.official_id) || null;
            return {
              ...position,
              officials: official
            };
          });

          return result;
        }

        if (!positions || positions.length === 0) {
          return [];
        }

        // Step 2: Get officials data
        const officialIds = positions.map(pos => pos.official_id);
        const uniqueOfficialIds = [...new Set(officialIds)];

        const { data: officials, error: officialsError } = await supabase
          .from('officials')
          .select('id, name, photo_url');

        if (officialsError) {
          console.error('Error fetching officials:', officialsError);
          throw officialsError;
        }

        const officialsData = officials as OfficialData[] || [];

        // Step 3: Manually combine the data
        const result: OfficialPositionData[] = positions.map(position => {
          const official = officialsData.find(off => off.id === position.official_id) || null;
          return {
            ...position,
            officials: official
          };
        });

        return result;
      } catch (error) {
        console.error('Error in officials query:', error);
        throw error;
      }
    },
    enabled: !!userProfile?.brgyid
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Barangay Officials</h1>
          <p className="text-muted-foreground">Meet your local government representatives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {officials?.map((position) => (
          <Card key={position.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage 
                  src={position.officials?.photo_url} 
                  alt={position.officials?.name} 
                />
                <AvatarFallback className="text-lg">
                  {position.officials?.name?.split(' ').map((n: string) => n.charAt(0)).join('') || 'OF'}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg">
                {position.officials?.name || 'Unknown Official'}
              </CardTitle>
              <Badge variant="secondary" className="mx-auto">
                {position.position}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Since {moment(position.term_start).format('MMM YYYY')}
                  {position.term_end && ` - ${moment(position.term_end).format('MMM YYYY')}`}
                </span>
              </div>
              
              {position.description && (
                <p className="text-sm text-muted-foreground">
                  {position.description}
                </p>
              )}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Term Status:</span>
                  <Badge variant={position.term_end ? "outline" : "default"}>
                    {position.term_end ? "Term Ended" : "Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {officials?.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No officials information available at this time.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOfficialsPage;
