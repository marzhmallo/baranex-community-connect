
import { formatDistanceToNow } from 'date-fns';
import { Thread } from './ThreadsView';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, PinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (thread: Thread) => void;
}

const ThreadList = ({ threads, onThreadSelect }: ThreadListProps) => {
  const [filter, setFilter] = useState<'popular' | 'latest' | 'trending'>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => 
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    thread.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort threads based on filter
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (filter === 'popular') {
      return (b.reactionCount || 0) - (a.reactionCount || 0);
    } else if (filter === 'trending') {
      return ((b.commentCount || 0) + (b.reactionCount || 0)) - 
             ((a.commentCount || 0) + (a.reactionCount || 0));
    } else {
      // Latest (default)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Special threads (pinned or announcements) always come first
  const pinnedThreads = sortedThreads.filter(thread => thread.pinned);
  const regularThreads = sortedThreads.filter(thread => !thread.pinned);
  const displayThreads = [...pinnedThreads, ...regularThreads];

  if (threads.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No threads available in this forum.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex space-x-1 rounded-md border p-1 bg-background">
          <Button
            variant={filter === 'popular' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-sm text-xs px-3"
            onClick={() => setFilter('popular')}
          >
            Popular
          </Button>
          <Button
            variant={filter === 'latest' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-sm text-xs px-3"
            onClick={() => setFilter('latest')}
          >
            Latest
          </Button>
          <Button
            variant={filter === 'trending' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-sm text-xs px-3"
            onClick={() => setFilter('trending')}
          >
            Trending
          </Button>
        </div>
        
        <div className="w-full sm:w-auto flex-1 sm:flex-none sm:max-w-xs">
          <Input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="space-y-4 mt-2">
        {displayThreads.map((thread) => {
          // Get initials from author name for avatar fallback
          const initials = thread.authorName
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase() || 'UN';
            
          return (
            <div 
              key={thread.id} 
              className="border rounded-lg bg-card cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => onThreadSelect(thread)}
            >
              <div className="flex p-4 gap-3 w-full">
                <Avatar className="h-10 w-10 hidden sm:flex">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    {thread.pinned && (
                      <div className="flex items-center text-xs text-muted-foreground mr-2">
                        <PinIcon className="h-3 w-3 mr-1 text-primary" />
                        <span className="text-primary font-medium">Pinned</span>
                      </div>
                    )}
                    
                    <h3 className="font-medium text-lg leading-none">
                      {thread.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1">
                      {thread.tags?.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {thread.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>{thread.reactionCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{thread.commentCount || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{thread.authorName}</span>
                      <span className="text-muted-foreground">
                        • {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreadList;
