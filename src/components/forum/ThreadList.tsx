
import { formatDistanceToNow } from 'date-fns';
import { Thread } from './ThreadsView';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Eye, Share2, Flag, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (thread: Thread) => void;
  onPinToggle: (threadId: string, isPinned: boolean) => void;
  onLockToggle: (threadId: string, isLocked: boolean) => void;
  canModerate?: boolean;
}

const ThreadList = ({ threads, onThreadSelect, onPinToggle, onLockToggle, canModerate = false }: ThreadListProps) => {
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
    <div className="space-y-4">
      {displayThreads.map((thread) => {
        const initials = thread.authorName
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase() || 'UN';

        return (
          <div 
            key={thread.id} 
            className={`bg-card border border-border rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer ${
              thread.pinned ? 'bg-primary/5 border-primary/20' : ''
            }`}
            onClick={() => onThreadSelect(thread)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    {thread.authorAvatarUrl && (
                      <AvatarImage src={thread.authorAvatarUrl} alt={thread.authorName || 'User'} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{thread.authorName}</h3>
                      {thread.pinned && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {thread.tags?.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-2 py-1 rounded-full">
                      {tag}
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </Button>
                </div>
              </div>

              {canModerate && (
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      thread.pinned 
                        ? 'bg-primary/20 text-primary border-primary/20' 
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinToggle(thread.id, thread.pinned);
                    }}
                  >
                    <Pin className="h-3 w-3" />
                    {thread.pinned ? 'Unpin' : 'Pin'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                      thread.locked 
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLockToggle(thread.id, thread.locked);
                    }}
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        thread.locked 
                          ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      } />
                    </svg>
                    {thread.locked ? 'Unlock' : 'Lock'}
                  </Button>
                </div>
              )}
              
              <h2 className="text-xl font-semibold text-foreground mb-3 hover:text-primary cursor-pointer transition-colors duration-200">
                {thread.title}
              </h2>
              
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {thread.content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">{thread.reactionCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm">{thread.commentCount || 0} replies</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">{thread.viewCount || 0} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {thread.locked ? (
                    <>
                      <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-yellow-600">Thread locked</span>
                    </>
                  ) : (thread.commentCount || 0) > 0 && thread.lastReplyAt ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">Last reply {formatDistanceToNow(new Date(thread.lastReplyAt), { addSuffix: true })}</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm">No replies</span>
                    </>
                  )}
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
