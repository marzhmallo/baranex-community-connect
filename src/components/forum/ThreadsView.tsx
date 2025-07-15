import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus, Search, Loader2 } from 'lucide-react';
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular' | 'most_replies' | 'recent_activity'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserFromSameBarangay, setIsUserFromSameBarangay] = useState(false);
  
  // Dropdown states
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pinned' | 'locked' | 'open'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    if (userProfile && forum) {
      setIsUserFromSameBarangay(userProfile.brgyid === forum.brgyid);
    }
  }, [userProfile, forum]);

  const fetchThreads = async () => {
    try {
      let query = supabase
        .from('threads')
        .select('*')
        .eq('forum_id', forum.id);
      
      // Apply sorting
      if (sortOrder === 'newest') {
        query = query.order('pinned', { ascending: false }).order('created_at', { ascending: false });
      } else if (sortOrder === 'oldest') {
        query = query.order('pinned', { ascending: false }).order('created_at', { ascending: true });
      } else if (sortOrder === 'recent_activity') {
        query = query.order('pinned', { ascending: false }).order('updated_at', { ascending: false });
      }
      // For popular and most_replies, we'll sort after getting the data
      else {
        query = query.order('pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data: threadsData, error: threadsError } = await query;

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
      let threadsWithAuthors = threadsData.map((thread: Thread) => {
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

      // Apply sorting for popular and most_replies
      if (sortOrder === 'popular') {
        threadsWithAuthors.sort((a, b) => {
          // First sort by pinned status
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          
          // Calculate popularity score: likes + replies + views
          const scoreA = (a.reactionCount || 0) + (a.commentCount || 0) + (a.viewCount || 0);
          const scoreB = (b.reactionCount || 0) + (b.commentCount || 0) + (b.viewCount || 0);
          
          // Sort by highest score first
          return scoreB - scoreA;
        });
      } else if (sortOrder === 'most_replies') {
        threadsWithAuthors.sort((a, b) => {
          // First sort by pinned status
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          // Then by comment count
          return (b.commentCount || 0) - (a.commentCount || 0);
        });
      }

      return threadsWithAuthors;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  };

  const { data: threads, isLoading, error, refetch } = useQuery({
    queryKey: ['threads', forum.id, sortOrder, statusFilter, dateFilter],
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

  // Filter threads based on search query and filters
  const filteredThreads = threads?.filter(thread => {
    // Search filter
    const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      thread.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'pinned') {
      matchesStatus = thread.pinned;
    } else if (statusFilter === 'locked') {
      matchesStatus = thread.locked;
    } else if (statusFilter === 'open') {
      matchesStatus = !thread.locked;
    }
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const threadDate = new Date(thread.created_at);
      const now = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = threadDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = threadDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = threadDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  return (
    <div className="w-full mx-auto p-6 bg-background min-h-screen relative">
      {/* Localized loading screen that only covers this div */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-primary/20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Loading threads</p>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      
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
              className="w-full pl-10 pr-4 py-3 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all duration-200 placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Button 
                variant="outline"
                className="px-4 py-3 flex items-center gap-2"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                Sort by
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </Button>
              
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-lg shadow-lg z-50 w-48">
                  <div className="py-2">
                    <button 
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-200 flex items-center gap-2"
                      onClick={() => {
                        setSortOrder('newest');
                        setShowSortDropdown(false);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Newest First
                    </button>
                    <button 
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-200 flex items-center gap-2"
                      onClick={() => {
                        setSortOrder('oldest');
                        setShowSortDropdown(false);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Oldest First
                    </button>
                    <button 
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-200 flex items-center gap-2"
                      onClick={() => {
                        setSortOrder('popular');
                        setShowSortDropdown(false);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Most Popular
                    </button>
                    <button 
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-200 flex items-center gap-2"
                      onClick={() => {
                        setSortOrder('most_replies');
                        setShowSortDropdown(false);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Most Replies
                    </button>
                    <button 
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors duration-200 flex items-center gap-2"
                      onClick={() => {
                        setSortOrder('recent_activity');
                        setShowSortDropdown(false);
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Recent Activity
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <Button 
                variant="outline"
                className="px-4 py-3 flex items-center gap-2"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Filter
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </Button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-lg shadow-lg z-50 w-64 p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          className={`px-2 py-1 text-xs border rounded-full transition-colors ${
                            statusFilter === 'all' 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => setStatusFilter('all')}
                        >
                          All
                        </button>
                        <button 
                          className={`px-2 py-1 text-xs border rounded-full transition-colors ${
                            statusFilter === 'pinned' 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => setStatusFilter('pinned')}
                        >
                          Pinned
                        </button>
                        <button 
                          className={`px-2 py-1 text-xs border rounded-full transition-colors ${
                            statusFilter === 'locked' 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => setStatusFilter('locked')}
                        >
                          Locked
                        </button>
                        <button 
                          className={`px-2 py-1 text-xs border rounded-full transition-colors ${
                            statusFilter === 'open' 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => setStatusFilter('open')}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Date</h4>
                      <div className="flex flex-col gap-1">
                        <button 
                          className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                            dateFilter === 'today' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setDateFilter('today')}
                        >
                          Today
                        </button>
                        <button 
                          className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                            dateFilter === 'week' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setDateFilter('week')}
                        >
                          This week
                        </button>
                        <button 
                          className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                            dateFilter === 'month' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setDateFilter('month')}
                        >
                          This month
                        </button>
                        <button 
                          className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                            dateFilter === 'all' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setDateFilter('all')}
                        >
                          All time
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted border border-border rounded-lg mb-6">
          <div className="text-sm font-medium text-muted-foreground">Quick Filters:</div>
          <Button 
            variant="outline" 
            size="sm"
            className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 flex items-center gap-1 ${
              statusFilter === 'pinned' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background hover:bg-muted'
            }`}
            onClick={() => setStatusFilter(statusFilter === 'pinned' ? 'all' : 'pinned')}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Pinned
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 flex items-center gap-1 ${
              sortOrder === 'recent_activity' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background hover:bg-muted'
            }`}
            onClick={() => setSortOrder(sortOrder === 'recent_activity' ? 'newest' : 'recent_activity')}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 flex items-center gap-1 ${
              sortOrder === 'popular' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background hover:bg-muted'
            }`}
            onClick={() => setSortOrder(sortOrder === 'popular' ? 'newest' : 'popular')}
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

        <ThreadList 
          threads={filteredThreads} 
          onThreadSelect={handleThreadSelected}
          onPinToggle={handlePinToggle}
          onLockToggle={handleLockToggle}
        />
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
