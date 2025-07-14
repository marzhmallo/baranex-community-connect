
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

// Pre-defined forum categories with their styling
const forumCategories = [
  {
    title: "General Announcements",
    description: "Official updates and announcements from the barangay council.",
    icon: Megaphone,
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/20",
    key: "announcements"
  },
  {
    title: "Community Concerns",
    description: "Report issues and discuss local concerns like waste management, safety, and infrastructure.",
    icon: AlertTriangle,
    iconColor: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    key: "concerns"
  },
  {
    title: "Events & Activities",
    description: "Plan and discuss upcoming fiestas, sports leagues, and community events.",
    icon: Calendar,
    iconColor: "text-green-400",
    bgColor: "bg-green-500/20",
    key: "events"
  }
];

const ForumPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
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

  const isAdmin = userProfile?.role === 'admin';

  if (selectedForum) {
    return (
      <ThreadsView 
        forum={selectedForum} 
        onBack={handleBackToForums} 
      />
    );
  }

  // Match existing forums to categories, or show all forums if none match
  const getForumForCategory = (categoryKey: string) => {
    return forums?.find(forum => 
      forum.title.toLowerCase().includes(categoryKey) ||
      forum.description?.toLowerCase().includes(categoryKey)
    );
  };

  const renderForumCard = (category: typeof forumCategories[0], index: number) => {
    const forum = getForumForCategory(category.key);
    const stats = forum ? forumStats[forum.id] || { threads: 0, posts: 0 } : { threads: 0, posts: 0 };
    const IconComponent = category.icon;
    
    const handleClick = () => {
      if (forum) {
        handleForumSelected(forum);
      }
    };

    return (
      <div 
        key={index}
        className="bg-card border border-border rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex items-center space-x-6">
          <div className={`flex-shrink-0 w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center`}>
            <IconComponent className={`${category.iconColor} h-8 w-8`} />
          </div>
          <div className="flex-grow">
            <h2 className="font-bold text-xl text-foreground mb-1">{category.title}</h2>
            <p className="text-muted-foreground text-sm">{category.description}</p>
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

  const renderLoadingCard = (index: number) => {
    const category = forumCategories[index];
    const IconComponent = category.icon;
    
    return (
      <div 
        key={index}
        className="bg-card border border-border rounded-xl p-6 animate-pulse"
      >
        <div className="flex items-center space-x-6">
          <div className={`flex-shrink-0 w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center`}>
            <IconComponent className={`${category.iconColor} h-8 w-8`} />
          </div>
          <div className="flex-grow">
            <h2 className="font-bold text-xl text-foreground mb-1">{category.title}</h2>
            <p className="text-muted-foreground text-sm">{category.description}</p>
          </div>
          <div className="text-right text-muted-foreground hidden sm:block">
            <div className="font-semibold bg-muted h-4 w-16 rounded mb-1"></div>
            <div className="text-sm bg-muted h-3 w-12 rounded"></div>
          </div>
          <ChevronRight className="text-muted-foreground h-5 w-5" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-background min-h-screen">
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
        {isLoading ? (
          forumCategories.map((_, index) => renderLoadingCard(index))
        ) : (
          forumCategories.map((category, index) => renderForumCard(category, index))
        )}
      </div>
    </div>
  );
};

export default ForumPage;
