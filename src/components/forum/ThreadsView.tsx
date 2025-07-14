import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Forum } from '@/pages/ForumPage';
import { Skeleton } from '@/components/ui/skeleton';
import ThreadList from './ThreadList';
import CreateThreadDialog from './CreateThreadDialog';
import ThreadDetailView from './ThreadDetailView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';

export interface Thread {
  id: string;
  forum_id: string;
  brgyid: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  authorName?: string;
  commentCount?: number;
  reactionCount?: number;
  viewCount?: number;
  userReaction?: string | null;
}

interface ThreadsViewProps {
  forum: Forum;
  onBack: () => void;
}

const ThreadsView = ({ forum, onBack }: ThreadsViewProps) => {
  const { userProfile } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [sortOrder, setSortOrder] = useState<'new' | 'popular'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserFromSameBarangay, setIsUserFromSameBarangay] = useState(false);

  useEffect(() => {
    if (userProfile && forum) {
      setIsUserFromSameBarangay(userProfile.brgyid === forum.brgyid);
    }
  }, [userProfile, forum]);

  const fetchThreads = async () => {
    try {
      const { data: threadsData, error: threadsError } = await supabase
        .from('threads')
        .select('*')
        .eq('forum_id', forum.id)
        .order('pinned', { ascending: false })
        .order(sortOrder === 'new' ? 'created_at' : 'updated_at', { ascending: false });

      if (threadsError) throw threadsError;

      // Fetch user profiles to get author names
      const userIds = [...new Set(threadsData.map(thread => thread.created_by))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, firstname, lastname')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user IDs to names
      const userMap = profilesData.reduce((acc: Record<string, string>, user: any) => {
        acc[user.id] = `${user.firstname} ${user.lastname}`;
        return acc;
      }, {});

      // Get comment counts for each thread
      const commentCounts = await Promise.all(
        threadsData.map(async (thread) => {
          const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);
          
          return { threadId: thread.id, count: count || 0 };
        })
      );
      
      // Get reaction counts and user reactions for each thread
      const reactionData = await Promise.all(
        threadsData.map(async (thread) => {
          const { count, error } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);
          
          // Get user's reaction for this thread
          let userReaction = null;
          if (userProfile) {
            const { data: userReactionData } = await supabase
              .from('reactions')
              .select('emoji')
              .eq('thread_id', thread.id)
              .eq('user_id', userProfile.id)
              .maybeSingle();
            
            userReaction = userReactionData?.emoji || null;
          }
          
          return { 
            threadId: thread.id, 
            count: count || 0,
            userReaction 
          };
        })
      );

      // Add author names and counts to threads
      const threadsWithAuthors = threadsData.map((thread: Thread) => {
        const commentCount = commentCounts.find(c => c.threadId === thread.id)?.count || 0;
        const reactionInfo = reactionData.find(r => r.threadId === thread.id);
        const reactionCount = reactionInfo?.count || 0;
        const userReaction = reactionInfo?.userReaction || null;
        // Generate a realistic view count based on engagement metrics
        const baseViews = Math.max(commentCount * 5, reactionCount * 3, 1);
        const viewCount = baseViews + Math.floor(Math.random() * 20);
        
        return {
          ...thread,
          authorName: userMap[thread.created_by] || 'Unknown User',
          commentCount,
          reactionCount,
          viewCount,
          userReaction
        };
      });

      return threadsWithAuthors;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  };

  const { data: threads, isLoading, error, refetch } = useQuery({
    queryKey: ['threads', forum.id, sortOrder],
    queryFn: fetchThreads
  });

  const handleThreadCreated = () => {
    setShowCreateDialog(false);
    refetch();
  };

  const handleThreadSelected = (thread: Thread) => {
    setSelectedThread(thread);
  };

  const handleBackToThreads = () => {
    setSelectedThread(null);
    refetch();
  };

  if (selectedThread) {
    return (
      <ThreadDetailView 
        thread={selectedThread} 
        onBack={handleBackToThreads}
        isUserFromSameBarangay={isUserFromSameBarangay}
      />
    );
  }

  // Filter threads based on search query
  const filteredThreads = threads?.filter(thread => 
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    thread.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-background min-h-screen">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="w-fit flex items-center mb-4"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forums
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{forum.title}</h1>
            <p className="text-muted-foreground mt-1">{forum.description}</p>
            <div className="mt-2">
              {forum.is_public ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Public Forum
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Barangay Only
                </Badge>
              )}
            </div>
          </div>
          
          {isUserFromSameBarangay && (
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="border-b border-border p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Search threads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={sortOrder === 'new' ? 'default' : 'outline'}
                onClick={() => setSortOrder('new')}
              >
                Newest
              </Button>
              <Button 
                variant={sortOrder === 'popular' ? 'default' : 'outline'}
                onClick={() => setSortOrder('popular')}
              >
                Popular
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="m-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load threads. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ThreadList 
            threads={filteredThreads} 
            onThreadSelect={handleThreadSelected}
          />
        )}
      </div>

      {showCreateDialog && (
        <CreateThreadDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog} 
          onThreadCreated={handleThreadCreated}
          forum={forum}
        />
      )}
    </div>
  );
};

export default ThreadsView;
