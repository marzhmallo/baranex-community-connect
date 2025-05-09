
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Forum } from '@/pages/ForumPage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThreadCreated: () => void;
  forum: Forum;
}

const SUGGESTED_TAGS = [
  'Announcement', 'Question', 'Emergency', 'Health', 'Event', 
  'Infrastructure', 'Security', 'Education', 'Environment'
];

const CreateThreadDialog = ({ open, onOpenChange, onThreadCreated, forum }: CreateThreadDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = userProfile?.role === 'admin';

  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSuggestedTagClick = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to create a thread",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('threads')
        .insert({
          forum_id: forum.id,
          brgyid: forum.brgyid,
          title: title.trim(),
          content: content.trim(),
          tags,
          pinned: isAdmin ? isPinned : false,
          created_by: userProfile.id
        })
        .select();

      if (error) throw error;
      
      toast({
        title: "Thread Created",
        description: "Your thread has been posted successfully."
      });
      
      onThreadCreated();
      setTitle('');
      setContent('');
      setTags([]);
      setIsPinned(false);
    } catch (error: any) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to create thread: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
            <DialogDescription>
              Create a new discussion thread in {forum.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Thread Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear, specific title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share details, ask questions, or start a discussion..."
                rows={6}
                className="resize-y"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (Max 5)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleTagRemove(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagAdd();
                    }
                  }}
                  disabled={tags.length >= 5}
                />
                <Button 
                  type="button" 
                  onClick={handleTagAdd}
                  disabled={!tagInput.trim() || tags.length >= 5}
                >
                  Add
                </Button>
              </div>
              {tags.length < 5 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).slice(0, 5).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => handleSuggestedTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {isAdmin && (
              <div className="flex items-center justify-between">
                <Label htmlFor="pinned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Pin Thread (Admin Only)
                </Label>
                <Switch
                  id="pinned"
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThreadDialog;
