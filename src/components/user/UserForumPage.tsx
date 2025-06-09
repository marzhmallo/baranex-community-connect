
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Clock, Eye } from 'lucide-react';
import moment from 'moment';

const UserForumPage = () => {
  const { userProfile } = useAuth();
  const [selectedForum, setSelectedForum] = useState(null);

  const { data: forums, isLoading } = useQuery({
    queryKey: ['user-forums'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const myBarangayForums = forums?.filter(
    (forum) => forum.brgyid === userProfile?.brgyid
  );

  const publicForums = forums?.filter(
    (forum) => forum.is_public && forum.brgyid !== userProfile?.brgyid
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ForumCard = ({ forum }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedForum(forum)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{forum.title}</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">{forum.description}</p>
          </div>
          <Badge variant={forum.is_public ? "default" : "secondary"}>
            {forum.is_public ? "Public" : "Private"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {moment(forum.created_at).format('MMM DD, YYYY')}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            View Discussions
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedForum) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <button 
            onClick={() => setSelectedForum(null)}
            className="text-primary hover:underline mb-4"
          >
            ← Back to Forums
          </button>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{selectedForum.title}</h1>
              <p className="text-muted-foreground">{selectedForum.description}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Forum discussions are currently view-only for residents.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your barangay officials to participate in discussions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Barangay Forums</h1>
          <p className="text-muted-foreground">View community discussions and updates</p>
        </div>
      </div>

      <Tabs defaultValue="myBarangay" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">All Forums</TabsTrigger>
          <TabsTrigger value="myBarangay">My Barangay</TabsTrigger>
          <TabsTrigger value="public">Public Forums</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {forums?.map((forum) => (
              <ForumCard key={forum.id} forum={forum} />
            ))}
            {forums?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No forums available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="myBarangay">
          <div className="space-y-4">
            {myBarangayForums?.map((forum) => (
              <ForumCard key={forum.id} forum={forum} />
            ))}
            {myBarangayForums?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No forums available for your barangay.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="public">
          <div className="space-y-4">
            {publicForums?.map((forum) => (
              <ForumCard key={forum.id} forum={forum} />
            ))}
            {publicForums?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No public forums available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserForumPage;
