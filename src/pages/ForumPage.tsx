
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ForumList from '@/components/forum/ForumList';
import CreateForumDialog from '@/components/forum/CreateForumDialog';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Building, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThreadsView from '@/components/forum/ThreadsView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [forumStats, setForumStats] = useState<{[key: string]: {threads: number, posts: number}}>({});
  
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

  // Fetch actual thread and comment counts for each forum
  const getForumStats = async (forumId: string) => {
    try {
      // Get thread count
      const { count: threadCount, error: threadError } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('forum_id', forumId);

      if (threadError) throw threadError;

      // Get total comment count for all threads in this forum
      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select('id')
        .eq('forum_id', forumId);

      if (threadsError) throw threadsError;

      let totalComments = 0;
      if (threads && threads.length > 0) {
        const threadIds = threads.map(t => t.id);
        const { count: commentCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .in('thread_id', threadIds);

        if (commentError) throw commentError;
        totalComments = commentCount || 0;
      }

      return {
        threads: threadCount || 0,
        posts: totalComments
      };
    } catch (error) {
      console.error('Error fetching forum stats:', error);
      return {
        threads: 0,
        posts: 0
      };
    }
  };

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!forums) return;
      
      const stats: {[key: string]: {threads: number, posts: number}} = {};
      
      for (const forum of forums) {
        stats[forum.id] = await getForumStats(forum.id);
      }
      
      setForumStats(stats);
    };

    fetchAllStats();
  }, [forums]);

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

  const renderForumCard = (forum: Forum) => {
    const stats = forumStats[forum.id] || { threads: 0, posts: 0 };
    const isPublic = forum.is_public;
    
    return (
      <div 
        key={forum.id}
        className="bg-background rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => handleForumSelected(forum)}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 ${isPublic ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'} rounded-full flex items-center justify-center`}>
            {isPublic ? (
              <Globe className="text-green-600 dark:text-green-400 h-6 w-6" />
            ) : (
              <Building className="text-blue-600 dark:text-blue-400 h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{forum.title}</h3>
            <span className={`text-sm px-2 py-1 rounded-full ${
              isPublic 
                ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                : 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
            }`}>
              {isPublic ? 'Public Forum' : 'Barangay Only'}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-4">{forum.description || 'Open discussions about community topics and general interests'}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{stats.threads.toLocaleString()} threads</span>
          <span>{stats.posts.toLocaleString()} posts</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-background min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Community Forums</h1>
          {isAdmin && (
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-background rounded-xl shadow-sm border border-border p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forums?.map(renderForumCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPage;
