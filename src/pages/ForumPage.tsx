
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ForumList from '@/components/forum/ForumList';
import CreateForumDialog from '@/components/forum/CreateForumDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThreadsView from '@/components/forum/ThreadsView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export interface Forum {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  brgyid: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const ForumPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const fetchForums = async () => {
    try {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching forums:', error);
      toast({
        title: "Error",
        description: "Failed to load forums: " + error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const { data: forums, isLoading, error, refetch } = useQuery({
    queryKey: ['forums'],
    queryFn: fetchForums
  });

  const handleForumCreated = () => {
    setShowCreateDialog(false);
    refetch();
    toast({
      title: "Forum Created",
      description: "Your forum has been created successfully."
    });
  };

  const handleForumSelected = (forum: Forum) => {
    setSelectedForum(forum);
  };

  const handleBackToForums = () => {
    setSelectedForum(null);
  };

  const myBarangayForums = forums?.filter(
    (forum) => forum.brgyid === userProfile?.brgyid
  );

  const publicForums = forums?.filter(
    (forum) => forum.is_public && forum.brgyid !== userProfile?.brgyid
  );

  const isAdmin = userProfile?.role === 'admin';

  if (selectedForum) {
    return (
      <ThreadsView 
        forum={selectedForum} 
        onBack={handleBackToForums} 
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Barangay Forums</h1>
        {isAdmin && (
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Forum
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load forums. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {showCreateDialog && (
        <CreateForumDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog} 
          onForumCreated={handleForumCreated}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">All Forums</TabsTrigger>
          <TabsTrigger value="myBarangay">My Barangay</TabsTrigger>
          <TabsTrigger value="public">Public Forums</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ForumList 
            forums={forums || []} 
            isLoading={isLoading} 
            onForumSelect={handleForumSelected}
          />
        </TabsContent>
        
        <TabsContent value="myBarangay">
          <ForumList 
            forums={myBarangayForums || []} 
            isLoading={isLoading} 
            onForumSelect={handleForumSelected}
          />
        </TabsContent>
        
        <TabsContent value="public">
          <ForumList 
            forums={publicForums || []} 
            isLoading={isLoading} 
            onForumSelect={handleForumSelected}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForumPage;
