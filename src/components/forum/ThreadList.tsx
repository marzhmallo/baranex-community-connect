
import { formatDistanceToNow } from 'date-fns';
import { Thread } from './ThreadsView';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Eye, Share2, Flag, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (thread: Thread) => void;
}

const ThreadList = ({ threads, onThreadSelect }: ThreadListProps) => {
  if (threads.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No threads available in this forum.
      </div>
    );
  }

  // Separate pinned and regular threads
  const pinnedThreads = threads.filter(thread => thread.pinned);
  const regularThreads = threads.filter(thread => !thread.pinned);
  const displayThreads = [...pinnedThreads, ...regularThreads];

  return (
    <div className="divide-y divide-border">
      {displayThreads.map((thread) => {
        const initials = thread.authorName
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase() || 'UN';

        return (
          <div 
            key={thread.id} 
            className="p-6 hover:bg-accent/50 transition-colors duration-200 cursor-pointer"
            onClick={() => onThreadSelect(thread)}
          >
            <div className="flex items-start gap-4">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {thread.pinned && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer">
                    {thread.title}
                  </h3>
                  {thread.tags?.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {thread.content}
                </p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span>Posted by <strong>{thread.authorName}</strong></span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{thread.reactionCount || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{thread.viewCount || 0} views</span>
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-1 text-muted-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {thread.commentCount || 0} replies
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-1 text-red-500 hover:text-red-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ThreadList;
