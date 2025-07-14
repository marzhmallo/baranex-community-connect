
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ThumbsUp, MessageSquare, Share, Send, Heart, Smile } from 'lucide-react';
import { Thread } from './ThreadsView';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  thread_id: string;
  parent_id: string | null;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  authorName?: string;
  authorInitials?: string;
  replies?: Comment[];
  reactionCounts?: {
    [key: string]: number;
  };
  userReaction?: string | null;
}

interface Reaction {
  id: string;
  comment_id?: string;
  thread_id?: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ThreadDetailViewProps {
  thread: Thread;
  onBack: () => void;
  isUserFromSameBarangay: boolean;
}

const AVAILABLE_REACTIONS = [
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '👎', name: 'thumbs_down' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😊', name: 'smile' },
  { emoji: '🔥', name: 'fire' },
];

const ThreadDetailView = ({ thread, onBack, isUserFromSameBarangay }: ThreadDetailViewProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState<{[key: string]: string}>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [threadReactions, setThreadReactions] = useState<{[key: string]: number}>({});
  const [userThreadReaction, setUserThreadReaction] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Fetch comments and reactions
  const fetchCommentsAndReactions = async () => {
    try {
      // Fetch all comments for this thread
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true });
      
      if (commentsError) throw commentsError;

      // Fetch user profiles to get author names
      const userIds = [...new Set(commentsData.map((comment: Comment) => comment.created_by))];
      
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

      // Get initials for avatar fallback
      const initialsMap = profilesData.reduce((acc: Record<string, string>, user: any) => {
        acc[user.id] = `${user.firstname[0]}${user.lastname[0]}`;
        return acc;
      }, {});

      // Fetch all reactions (for both thread and comments)
      let reactionsQuery = supabase
        .from('reactions')
        .select('*');
      
      if (commentsData.length > 0) {
        reactionsQuery = reactionsQuery.or(`thread_id.eq.${thread.id},comment_id.in.(${commentsData.map((c: Comment) => c.id).join(',')})`);
      } else {
        reactionsQuery = reactionsQuery.eq('thread_id', thread.id);
      }
      
      const { data: reactionsData, error: reactionsError } = await reactionsQuery;
      
      if (reactionsError) throw reactionsError;

      // Process thread reactions
      const threadReactions = reactionsData.filter((r: Reaction) => r.thread_id === thread.id);
      const threadReactionCounts: {[key: string]: number} = {};
      let userReaction = null;
      
      threadReactions.forEach((reaction: Reaction) => {
        threadReactionCounts[reaction.emoji] = (threadReactionCounts[reaction.emoji] || 0) + 1;
        if (userProfile && reaction.user_id === userProfile.id) {
          userReaction = reaction.emoji;
        }
      });
      
      setThreadReactions(threadReactionCounts);
      setUserThreadReaction(userReaction);

      // Process comment reactions
      const commentReactions = reactionsData.filter((r: Reaction) => r.comment_id);
      const commentReactionMap: {[key: string]: {[key: string]: number}} = {};
      const userCommentReactions: {[key: string]: string | null} = {};
      
      commentReactions.forEach((reaction: Reaction) => {
        if (reaction.comment_id) {
          if (!commentReactionMap[reaction.comment_id]) {
            commentReactionMap[reaction.comment_id] = {};
          }
          commentReactionMap[reaction.comment_id][reaction.emoji] = 
            (commentReactionMap[reaction.comment_id][reaction.emoji] || 0) + 1;
          
          if (userProfile && reaction.user_id === userProfile.id) {
            userCommentReactions[reaction.comment_id] = reaction.emoji;
          }
        }
      });

      // Add author names, reactions, and organize into thread structure
      const commentsWithAuthors = commentsData.map((comment: Comment) => ({
        ...comment,
        authorName: userMap[comment.created_by] || 'Unknown User',
        authorInitials: initialsMap[comment.created_by] || 'UN',
        reactionCounts: commentReactionMap[comment.id] || {},
        userReaction: userCommentReactions[comment.id] || null,
        replies: [] // Will be filled with child comments
      }));

      // Organize into parent-child structure
      const rootComments: Comment[] = [];
      const commentMap: {[key: string]: Comment} = {};
      
      commentsWithAuthors.forEach(comment => {
        commentMap[comment.id] = comment;
        if (!comment.parent_id) {
          rootComments.push(comment);
        }
      });
      
      commentsWithAuthors.forEach(comment => {
        if (comment.parent_id && commentMap[comment.parent_id]) {
          if (!commentMap[comment.parent_id].replies) {
            commentMap[comment.parent_id].replies = [];
          }
          commentMap[comment.parent_id].replies!.push(comment);
        }
      });

      return rootComments;
    } catch (error) {
      console.error('Error fetching comments and reactions:', error);
      throw error;
    }
  };

  const { data: comments, isLoading: isCommentsLoading, error: commentsError, refetch: refetchComments } = useQuery({
    queryKey: ['comments', thread.id],
    queryFn: fetchCommentsAndReactions,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Set up real-time subscriptions
  useEffect(() => {
    let commentChannel: any;
    let reactionChannel: any;

    const setupRealtimeSubscriptions = () => {
      // Subscribe to comment changes
      commentChannel = supabase
        .channel(`comments-${thread.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: `thread_id=eq.${thread.id}`
          },
          () => {
            refetchComments();
          }
        )
        .subscribe();

      // Subscribe to reaction changes
      reactionChannel = supabase
        .channel(`reactions-${thread.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reactions'
          },
          (payload: any) => {
            // Only refetch if this reaction is related to our thread or its comments
            const payloadNew = payload.new || {};
            const payloadOld = payload.old || {};
            if (payloadNew.thread_id === thread.id || payloadOld.thread_id === thread.id ||
                payloadNew.comment_id || payloadOld.comment_id) {
              refetchComments();
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscriptions();

    return () => {
      if (commentChannel) {
        supabase.removeChannel(commentChannel);
      }
      if (reactionChannel) {
        supabase.removeChannel(reactionChannel);
      }
    };
  }, [thread.id, refetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !userProfile) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          thread_id: thread.id,
          content: commentContent.trim(),
          created_by: userProfile.id,
          parent_id: null
        })
        .select();

      if (error) throw error;
      
      setCommentContent('');
      refetchComments();
      toast({
        title: "Comment Posted",
        description: "Your comment has been added successfully."
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent[parentId]?.trim() || !userProfile) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          thread_id: thread.id,
          content: replyContent[parentId].trim(),
          created_by: userProfile.id,
          parent_id: parentId
        })
        .select();

      if (error) throw error;
      
      setReplyContent(prev => ({...prev, [parentId]: ''}));
      setReplyingTo(null);
      refetchComments();
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactionClick = async (emoji: string, commentId?: string) => {
    if (!userProfile) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to react to comments"
      });
      return;
    }

    try {
      // Check if the user already reacted with this emoji
      const target = commentId ? { comment_id: commentId } : { thread_id: thread.id };
      const currentReaction = commentId ? 
        comments?.find(c => c.id === commentId)?.userReaction : 
        userThreadReaction;
      
      if (currentReaction === emoji) {
        // User clicked the same reaction, so remove it
        const { error } = await supabase
          .from('reactions')
          .delete()
          .match({
            user_id: userProfile.id,
            ...(commentId ? { comment_id: commentId } : { thread_id: thread.id })
          });
          
        if (error) throw error;
      } else {
        // Remove any existing reaction from this user on this item
        await supabase
          .from('reactions')
          .delete()
          .match({
            user_id: userProfile.id,
            ...(commentId ? { comment_id: commentId } : { thread_id: thread.id })
          });
          
        // Add the new reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            ...target,
            user_id: userProfile.id,
            emoji
          });
          
        if (error) throw error;
      }
      
      refetchComments();
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to process reaction"
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !userProfile) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentToDelete)
        .eq('created_by', userProfile.id);

      if (error) throw error;
      
      toast({
        title: "Comment Deleted",
        description: "Your comment has been removed."
      });
      
      refetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment: " + error.message,
        variant: "destructive",
      });
    } finally {
      setCommentToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isCommentOwner = userProfile && comment.created_by === userProfile.id;
    const userHasLiked = comment.userReaction === '👍';
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-13 mt-3 bg-card rounded-lg p-3 border-l-2 border-primary/20' : 'bg-accent/30 rounded-lg p-4 hover:bg-accent/50 transition-colors'}`}>
        <div className="flex items-start space-x-3">
          <Avatar className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} flex-shrink-0`}>
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
              {comment.authorInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium text-foreground ${isReply ? 'text-xs' : 'text-sm'}`}>
                {comment.authorName}
              </h4>
              <span className={`text-muted-foreground ${isReply ? 'text-xs' : 'text-xs'}`}>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className={`text-foreground mb-2 ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.content}
            </p>
            
            <div className={`flex items-center ${isReply ? 'space-x-3' : 'space-x-4'}`}>
              <button 
                className={`flex items-center space-x-1 ${isReply ? 'text-xs' : 'text-xs'} transition-colors group ${
                  userHasLiked 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={() => handleReactionClick('👍', comment.id)}
              >
                <ThumbsUp 
                  className={`${isReply ? 'text-xs' : 'text-sm'} group-hover:scale-110 transition-transform ${
                    userHasLiked ? 'fill-current' : ''
                  }`} 
                />
                <span>{comment.reactionCounts?.['👍'] || 0}</span>
              </button>
              
              <button 
                className={`flex items-center space-x-1 ${isReply ? 'text-xs' : 'text-xs'} text-muted-foreground hover:text-yellow-600 transition-colors group`}
                onClick={() => handleReactionClick('😊', comment.id)}
              >
                <Smile className={`${isReply ? 'text-xs' : 'text-sm'} group-hover:scale-110 transition-transform`} />
                <span>{comment.reactionCounts?.['😊'] || 0}</span>
              </button>
              
              {isUserFromSameBarangay && (
                <button 
                  className={`${isReply ? 'text-xs' : 'text-xs'} text-muted-foreground hover:text-primary transition-colors`}
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  Reply
                </button>
              )}
            </div>
            
            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm">
                      {userProfile?.firstname?.[0]}{userProfile?.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-accent/30 rounded-full px-4 py-2 hover:bg-accent/50 transition-colors">
                    <input 
                      type="text" 
                      placeholder="Write a reply..." 
                      value={replyContent[comment.id] || ''}
                      onChange={(e) => setReplyContent(prev => ({...prev, [comment.id]: e.target.value}))}
                      className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmitReply(comment.id);
                        }
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmitting || !replyContent[comment.id]}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors hover:scale-105 transform disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
            
            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const userHasLikedThread = userThreadReaction === '👍';

  return (
    <div className="w-full py-6 px-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>
        
        {/* Thread Card */}
        <div className="w-full mx-auto bg-card rounded-xl shadow-lg overflow-hidden border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-medium">
                  {thread.authorName?.substring(0, 2) || 'UN'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{thread.authorName}</h3>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <p className="text-foreground leading-relaxed mb-4 mt-4">
              {thread.content}
            </p>
            
            <div className="flex items-center space-x-6 text-muted-foreground text-sm">
              <button 
                className={`flex items-center space-x-1 transition-colors ${
                  userHasLikedThread 
                    ? 'text-primary' 
                    : 'hover:text-primary'
                }`}
                onClick={() => handleReactionClick('👍')}
              >
                <ThumbsUp 
                  className={`text-lg ${userHasLikedThread ? 'fill-current' : ''}`} 
                />
                <span>{threadReactions['👍'] || 0}</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                <MessageSquare className="text-lg" />
                {isCommentsLoading ? (
                  <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                ) : (
                  <span>{comments ? comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0) : 0}</span>
                )}
              </button>
              <button className="flex items-center space-x-1 hover:text-primary transition-colors">
                <Share className="text-lg" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="max-h-[400px] overflow-y-auto px-6 py-4 space-y-4">
            {isCommentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-accent/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-12 w-full mb-2" />
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map(comment => renderComment(comment))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No comments yet</p>
                <p className="text-sm">Be the first to join the discussion!</p>
              </div>
            )}
          </div>

          {/* Comment Input */}
          {isUserFromSameBarangay && (
            <div className="border-t border-border p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm">
                    {userProfile?.firstname?.[0]}{userProfile?.lastname?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-accent/30 rounded-full px-4 py-2 hover:bg-accent/50 transition-colors">
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitComment(e);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-all duration-200 hover:scale-105">
                    <Smile className="text-lg" />
                  </button>
                  <button 
                    onClick={handleSubmitComment}
                    disabled={isSubmitting || !commentContent.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors hover:scale-105 transform disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ThreadDetailView;
