
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus, PinIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Forum } from '@/pages/ForumPage';
import { Skeleton } from '@/components/ui/skeleton';
import ThreadList from './ThreadList';
import CreateThreadDialog from './CreateThreadDialog';
import ThreadDetailView from './ThreadDetailView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      
      // Get reaction counts for each thread
      const reactionCounts = await Promise.all(
        threadsData.map(async (thread) => {
          const { count, error } = await supabase
            .from('reactions')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);
          
          return { threadId: thread.id, count: count || 0 };
        })
      );

      // Add author names and counts to threads
      const threadsWithAuthors = threadsData.map((thread: Thread) => ({
        ...thread,
        authorName: userMap[thread.created_by] || 'Unknown User',
        commentCount: commentCounts.find(c => c.threadId === thread.id)?.count || 0,
        reactionCount: reactionCounts.find(r => r.threadId === thread.id)?.count || 0
      }));

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-4">
        <Button 
          variant="ghost" 
          className="w-fit flex items-center mb-2"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forums
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{forum.title}</h1>
            <p className="text-muted-foreground mt-1">{forum.description}</p>
            <div className="mt-2">
              {forum.is_public ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Public Forum
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Private Forum
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

        <div className="flex justify-between items-center mt-6">
          <Tabs value={sortOrder} onValueChange={(value) => setSortOrder(value as 'new' | 'popular')} className="w-full max-w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Newest</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load threads. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-md">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
              </div>
            ))}
          </div>
        ) : (
          <ThreadList 
            threads={threads || []} 
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
