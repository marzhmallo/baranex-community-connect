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
  locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  viewcount?: number;
  authorName?: string;
  commentCount?: number;
  reactionCount?: number;
  viewCount?: number;
  userReaction?: string | null;
  photo_url?: string | null;
  lastReplyAt?: string | null;
}

interface ThreadsViewProps {
  forum: Forum;
  onBack: () => void;
}

// Add after the interface
const togglePinThread = async (threadId: string, isPinned: boolean) => {
  try {
    const { error } = await supabase
      .from('threads')
      .update({ pinned: !isPinned })
      .eq('id', threadId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error toggling pin status:', error);
    return false;
  }
};

const toggleLockThread = async (threadId: string, isLocked: boolean) => {
  try {
    const { error } = await supabase
      .from('threads')
      .update({ locked: !isLocked })
      .eq('id', threadId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error toggling lock status:', error);
    return false;
  }
};

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

      // Get comment counts and last reply times for each thread
      const commentData = await Promise.all(
        threadsData.map(async (thread) => {
          const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.id);
          
          // Get the most recent comment for last reply time
          const { data: lastComment } = await supabase
            .from('comments')
            .select('created_at')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return { 
            threadId: thread.id, 
            count: count || 0,
            lastReplyAt: lastComment?.created_at || null
          };
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
        const commentInfo = commentData.find(c => c.threadId === thread.id);
        const commentCount = commentInfo?.count || 0;
        const lastReplyAt = commentInfo?.lastReplyAt || null;
        const reactionInfo = reactionData.find(r => r.threadId === thread.id);
        const reactionCount = reactionInfo?.count || 0;
        const userReaction = reactionInfo?.userReaction || null;
        // Use actual viewcount from database
        const viewCount = thread.viewcount || 0;
        
        return {
          ...thread,
          authorName: userMap[thread.created_by] || 'Unknown User',
          commentCount,
          reactionCount,
          viewCount,
          userReaction,
          lastReplyAt
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

  const handlePinToggle = async (threadId: string, isPinned: boolean) => {
    const success = await togglePinThread(threadId, isPinned);
    if (success) {
      refetch();
    }
  };

  const handleLockToggle = async (threadId: string, isLocked: boolean) => {
    const success = await toggleLockThread(threadId, isLocked);
    if (success) {
      refetch();
    }
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
    <div className="w-[1200px] mx-auto p-6 bg-background min-h-screen">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="w-fit flex items-center mb-4"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forums
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{forum.title}</h1>
            <p className="text-muted-foreground">{forum.description}</p>
          </div>
          {isUserFromSameBarangay && (
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="px-6 py-3 font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Start New Thread
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search threads..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all duration-200"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Button 
                variant="outline"
                className="px-4 py-3 flex items-center gap-2"
                onClick={() => {/* TODO: Add sort dropdown */}}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                Sort by
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </Button>
            </div>
            
            <div className="relative">
              <Button 
                variant="outline"
                className="px-4 py-3 flex items-center gap-2"
                onClick={() => {/* TODO: Add filter dropdown */}}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Filter
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted border border-border rounded-lg mb-6">
          <div className="text-sm font-medium text-muted-foreground">Quick Filters:</div>
          <Button 
            variant="outline" 
            size="sm"
            className="px-3 py-1 rounded-full bg-background hover:bg-muted text-sm transition-colors duration-200 flex items-center gap-1"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Pinned
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="px-3 py-1 rounded-full bg-background hover:bg-muted text-sm transition-colors duration-200 flex items-center gap-1"
            onClick={() => setSortOrder('new')}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="px-3 py-1 rounded-full bg-background hover:bg-muted text-sm transition-colors duration-200 flex items-center gap-1"
            onClick={() => setSortOrder('popular')}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Popular
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load threads. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6">
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
            onPinToggle={handlePinToggle}
            onLockToggle={handleLockToggle}
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
