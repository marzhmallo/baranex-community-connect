import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Forum } from '@/pages/ForumPage';

interface EditForumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forum: Forum;
  onForumUpdated: () => void;
}

const EditForumDialog = ({ open, onOpenChange, forum, onForumUpdated }: EditForumDialogProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(forum.title);
  const [description, setDescription] = useState(forum.description || '');
  const [isPublic, setIsPublic] = useState(forum.is_public || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Forum title is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('forums')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', forum.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forum updated successfully"
      });

      onForumUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update forum: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Forum</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter forum title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter forum description (optional)"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_public">Make this forum public</Label>
            <Switch
              id="is_public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Forum'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditForumDialog;