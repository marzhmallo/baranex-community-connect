
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Calendar, MapPin } from 'lucide-react';
import moment from 'moment';

const UserOfficialsPage = () => {
  const { userProfile } = useAuth();

  const { data: officials, isLoading } = useQuery({
    queryKey: ['user-officials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('official_positions')
        .select(`
          *,
          officials (
            id,
            firstname,
            lastname,
            photo_url
          )
        `)
        .eq('brgyid', userProfile?.brgyid)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('position_order', { ascending: true });

      if (error) throw error;
      return data || [];
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
                  alt={`${position.officials?.firstname} ${position.officials?.lastname}`} 
                />
                <AvatarFallback className="text-lg">
                  {position.officials?.firstname?.charAt(0)}{position.officials?.lastname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg">
                {position.officials?.firstname} {position.officials?.lastname}
              </CardTitle>
              <Badge variant="secondary" className="mx-auto">
                {position.position_title}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Since {moment(position.start_date).format('MMM YYYY')}
                  {position.end_date && ` - ${moment(position.end_date).format('MMM YYYY')}`}
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
                  <Badge variant={position.end_date ? "outline" : "default"}>
                    {position.end_date ? "Term Ended" : "Active"}
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
