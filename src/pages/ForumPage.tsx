
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import CreateForumDialog from '@/components/forum/CreateForumDialog';
import { Button } from '@/components/ui/button';
import { Plus, Megaphone, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ThreadsView from '@/components/forum/ThreadsView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GlobalLoadingScreen from '@/components/ui/GlobalLoadingScreen';

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

// Icon mapping for different forum types
const getForumIcon = (title: string, isPublic: boolean) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('announcement') || titleLower.includes('news')) {
    return {
      icon: Megaphone,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/20"
    };
  } else if (titleLower.includes('concern') || titleLower.includes('issue') || titleLower.includes('problem')) {
    return {
      icon: AlertTriangle,
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-500/20"
    };
  } else if (titleLower.includes('event') || titleLower.includes('activity') || titleLower.includes('calendar')) {
    return {
      icon: Calendar,
      iconColor: "text-green-400",
      bgColor: "bg-green-500/20"
    };
  } else {
    // Default forum appearance
    return {
      icon: isPublic ? Megaphone : AlertTriangle,
      iconColor: isPublic ? "text-purple-400" : "text-orange-400",
      bgColor: isPublic ? "bg-purple-500/20" : "bg-orange-500/20"
    };
  }
};

const ForumPage = () => {
  console.log('ForumPage component loaded - updated version');
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [forumStats, setForumStats] = useState<{[key: string]: {threads: number, posts: number}}>({});
  const [statsLoading, setStatsLoading] = useState(false);
  
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
    queryFn: fetchForums,
    staleTime: 0,
    gcTime: 0,
  });

  console.log('Forum loading state:', { isLoading, forumsCount: forums?.length });

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
      if (!forums || forums.length === 0) return;
      
      setStatsLoading(true);
      const stats: {[key: string]: {threads: number, posts: number}} = {};
      
      for (const forum of forums) {
        stats[forum.id] = await getForumStats(forum.id);
      }
      
      setForumStats(stats);
      setStatsLoading(false);
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

  const isAdmin = userProfile?.role === 'admin';
  
  // Combined loading state - wait for both forums and stats to load
  const isPageLoading = isLoading || statsLoading;

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
    const iconConfig = getForumIcon(forum.title, forum.is_public);
    const IconComponent = iconConfig.icon;
    
    const handleClick = () => {
      handleForumSelected(forum);
    };

    return (
      <div 
        key={forum.id}
        className="bg-card border border-border rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex items-center space-x-6">
          <div className={`flex-shrink-0 w-16 h-16 ${iconConfig.bgColor} rounded-full flex items-center justify-center`}>
            <IconComponent className={`${iconConfig.iconColor} h-8 w-8`} />
          </div>
          <div className="flex-grow">
            <h2 className="font-bold text-xl text-foreground mb-1">{forum.title}</h2>
            <p className="text-muted-foreground text-sm">
              {forum.description || 'Join the discussion in this community forum.'}
            </p>
          </div>
          <div className="text-right text-muted-foreground hidden sm:block">
            <div className="font-semibold">{stats.threads} Threads</div>
            <div className="text-sm">{stats.posts} Posts</div>
          </div>
          <ChevronRight className="text-muted-foreground group-hover:text-foreground transition-colors h-5 w-5" />
        </div>
      </div>
    );
  };


  // Show global loading screen until everything is loaded
  if (isPageLoading) {
    return <GlobalLoadingScreen />;
  }

  return (
    <div className="w-full mx-auto p-6 bg-background min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Community Discussion Board</h1>
          <p className="text-muted-foreground mt-1">Connect with your neighbors and barangay officials.</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold hidden sm:flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        )}
      </header>

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

      <div className="space-y-4">
        {forums && forums.length > 0 ? (
          forums.map((forum) => renderForumCard(forum))
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No Forums Available</h3>
              <p>No community forums have been created yet.</p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Forum
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPage;
