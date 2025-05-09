
import { formatDistanceToNow } from 'date-fns';
import { Thread } from './ThreadsView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PinIcon, MessageSquare, ThumbsUp } from 'lucide-react';

interface ThreadListProps {
  threads: Thread[];
  onThreadSelect: (thread: Thread) => void;
}

const ThreadList = ({ threads, onThreadSelect }: ThreadListProps) => {
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
    <div className="space-y-4 mt-4">
      {threads.map((thread) => (
        <Card 
          key={thread.id} 
          className={`cursor-pointer hover:bg-accent/50 transition-colors ${thread.pinned ? 'border-primary/50' : ''}`}
          onClick={() => onThreadSelect(thread)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  {thread.pinned && (
                    <PinIcon className="h-4 w-4 mr-2 text-primary" />
                  )}
                  <CardTitle>{thread.title}</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  Posted by {thread.authorName} {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {thread.tags && thread.tags.length > 0 && thread.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-secondary/50">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="line-clamp-2 text-sm mb-2">
              {thread.content}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                {thread.commentCount} comments
              </div>
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1" />
                {thread.reactionCount} reactions
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ThreadList;
