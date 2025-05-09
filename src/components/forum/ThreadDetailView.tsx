
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, PinIcon, Trash2, MessageSquare, ThumbsUp, ThumbsDown, Heart, Send } from 'lucide-react';
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
      <div key={comment.id} className={`relative ${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        <div className="absolute left-0 top-0 w-0.5 h-full bg-border" style={{ left: isReply ? '-1rem' : '-1.5rem' }}></div>
        <Card className={isReply ? 'mb-2' : 'mb-4'}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{comment.authorInitials}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              {isCommentOwner && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => {
                    setCommentToDelete(comment.id);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <p className="text-sm">{comment.content}</p>
          </CardContent>
          <CardFooter className="py-2 px-4 flex justify-between">
            <div className="flex items-center gap-2">
              {AVAILABLE_REACTIONS.map((reaction) => {
                const count = comment.reactionCounts?.[reaction.emoji] || 0;
                const isActive = comment.userReaction === reaction.emoji;
                
                return (
                  <Button 
                    key={reaction.name}
                    variant="ghost" 
                    size="sm"
                    className={`h-8 px-2 py-0 gap-1 text-muted-foreground ${isActive ? 'bg-secondary' : ''}`}
                    onClick={() => handleReactionClick(reaction.emoji, comment.id)}
                  >
                    <span>{reaction.emoji}</span>
                    {count > 0 && <span className="text-xs">{count}</span>}
                  </Button>
                );
              })}
            </div>
            {isUserFromSameBarangay && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {replyingTo === comment.id && (
          <div className="mb-4 pl-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent[comment.id] || ''}
                onChange={(e) => setReplyContent(prev => ({...prev, [comment.id]: e.target.value}))}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end mt-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isSubmitting || !replyContent[comment.id]}
              >
                Reply
              </Button>
            </div>
          </div>
        )}
        
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        className="w-fit flex items-center mb-6"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Threads
      </Button>
      
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {thread.pinned && <PinIcon className="h-5 w-5 text-primary" />}
          <h1 className="text-2xl font-bold">{thread.title}</h1>
        </div>
        
        <div className="flex gap-2 mb-4">
          {thread.tags && thread.tags.length > 0 && thread.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="bg-secondary/50">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{thread.authorName?.substring(0, 2) || 'UN'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{thread.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="whitespace-pre-line">
            {thread.content}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="flex items-center gap-2">
              {AVAILABLE_REACTIONS.map((reaction) => {
                const count = threadReactions[reaction.emoji] || 0;
                const isActive = userThreadReaction === reaction.emoji;
                
                return (
                  <Button 
                    key={reaction.name}
                    variant="ghost" 
                    size="sm"
                    className={`h-8 px-3 py-0 gap-1 text-muted-foreground ${isActive ? 'bg-secondary' : ''}`}
                    onClick={() => handleReactionClick(reaction.emoji)}
                  >
                    <span>{reaction.emoji}</span>
                    {count > 0 && <span className="text-xs">{count}</span>}
                  </Button>
                );
              })}
            </div>
          </CardFooter>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          
          {isUserFromSameBarangay && (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <Textarea
                placeholder="Join the discussion..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="mb-2"
                rows={4}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !commentContent.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </form>
          )}
          
          {isCommentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full mb-2" />
                </div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <ScrollArea className="h-full max-h-[600px] pr-4">
              <div className="relative pl-6">
                {comments.map(comment => renderComment(comment))}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No comments yet. Be the first to join the discussion!
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
            <AlertDialogAction onClick={handleDeleteComment}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ThreadDetailView;
