import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, PinIcon, Trash2, MessageSquare, ThumbsUp, ThumbsDown, Heart, Send, Eye, Share, Flag } from 'lucide-react';
import { Thread } from './ThreadsView';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  { emoji: '🔥', name: 'fire' },
  { emoji: '👏', name: 'clap' },
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
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('reactions')
        .select('*')
        .or(`thread_id.eq.${thread.id},comment_id.in.(${commentsData.map((c: Comment) => c.id).join(',')})`);
      
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
    queryFn: fetchCommentsAndReactions
  });

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
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mt-6'}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
              {comment.authorInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-4 py-3 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                {isCommentOwner && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600" 
                    onClick={() => {
                      setCommentToDelete(comment.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {comment.content}
              </p>
            </div>
            
            {/* Reaction and Reply Actions */}
            <div className="flex items-center gap-1 mt-2 ml-2">
              {AVAILABLE_REACTIONS.slice(0, 3).map((reaction) => {
                const count = comment.reactionCounts?.[reaction.emoji] || 0;
                const isActive = comment.userReaction === reaction.emoji;
                
                return (
                  <Button 
                    key={reaction.name}
                    variant="ghost" 
                    size="sm"
                    className={`h-7 px-2 py-0 gap-1 text-xs ${
                      isActive 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => handleReactionClick(reaction.emoji, comment.id)}
                  >
                    <span className="text-sm">{reaction.emoji}</span>
                    {count > 0 && <span>{count}</span>}
                  </Button>
                );
              })}
              
              {isUserFromSameBarangay && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  Reply
                </Button>
              )}
            </div>
            
            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-2">
                <div className="flex gap-2">
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm">
                      {userProfile?.firstname?.[0]}{userProfile?.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent[comment.id] || ''}
                      onChange={(e) => setReplyContent(prev => ({...prev, [comment.id]: e.target.value}))}
                      className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                    <div className="flex justify-end mt-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        className="h-8 px-3 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={isSubmitting || !replyContent[comment.id]}
                        className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4 text-gray-600 hover:text-gray-900"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>
        
        {/* Thread Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {thread.pinned && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  <PinIcon className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {thread.tags && thread.tags.length > 0 && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Infrastructure
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>156 views</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            {thread.title}
          </h1>
          
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-medium">
                {thread.authorName?.substring(0, 2) || 'UN'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{thread.authorName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="prose max-w-none text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            {thread.content}
          </div>
          
          {/* Thread Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {AVAILABLE_REACTIONS.slice(0, 3).map((reaction) => {
                const count = threadReactions[reaction.emoji] || 0;
                const isActive = userThreadReaction === reaction.emoji;
                
                return (
                  <Button 
                    key={reaction.name}
                    variant="ghost" 
                    size="sm"
                    className={`h-9 px-3 gap-2 ${
                      isActive 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    onClick={() => handleReactionClick(reaction.emoji)}
                  >
                    <span>{reaction.emoji}</span>
                    {count > 0 && <span className="text-sm">{count}</span>}
                  </Button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comments ({comments?.length || 0})
          </h2>
        </div>
        
        {/* Add Comment Form */}
        {isUserFromSameBarangay && (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm">
                  {userProfile?.firstname?.[0]}{userProfile?.lastname?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="min-h-[100px] resize-none border-gray-200 focus:border-blue-500 rounded-xl"
                  rows={3}
                />
                <div className="flex justify-end mt-3">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !commentContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}
        
        {/* Comments List */}
        {isCommentsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-2">
            {comments.map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No comments yet</p>
            <p className="text-sm">Be the first to join the discussion!</p>
          </div>
        )}
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
