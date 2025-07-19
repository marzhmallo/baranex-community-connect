
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Pin,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/pages/AnnouncementsPage';

const editFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  category: z.string().min(1, { message: 'Please select a category' }),
  audience: z.string().min(1, { message: 'Please select an audience' }),
  is_pinned: z.boolean().default(false),
  is_public: z.boolean().default(true),
});

interface EditAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  onSuccess: () => void;
}

const EditAnnouncementDialog: React.FC<EditAnnouncementDialogProps> = ({
  open,
  onOpenChange,
  announcement,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: announcement?.title || '',
      content: announcement?.content || '',
      category: announcement?.category || '',
      audience: announcement?.audience || 'Public',
      is_pinned: announcement?.is_pinned || false,
      is_public: announcement?.is_public || true,
    },
  });

  // Reset form when announcement changes
  React.useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        audience: announcement.audience,
        is_pinned: announcement.is_pinned,
        is_public: announcement.is_public,
      });
    }
  }, [announcement, form]);

  const onSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!announcement) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: values.title,
          content: values.content,
          category: values.category,
          audience: values.audience,
          is_pinned: values.is_pinned,
          is_public: values.is_public,
          updated_at: new Date().toISOString(),
        })
        .eq('id', announcement.id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to update the announcement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
          <DialogDescription>
            Update the announcement details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter announcement content"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="News">News</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="All Residents">All Residents</SelectItem>
                        <SelectItem value="Senior Citizens">Senior Citizens</SelectItem>
                        <SelectItem value="Business Owners">Business Owners</SelectItem>
                        <SelectItem value="Students">Students</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-6">
              <FormField
                control={form.control}
                name="is_pinned"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Pin this announcement</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Make public</FormLabel>
                  </FormItem>
                )}
              />
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
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Announcement
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

interface AnnouncementListProps {
  announcements: Announcement[];
  isLoading: boolean;
  refetch: () => void;
  searchQuery?: string;
  selectedCategories?: string[];
  selectedAudiences?: string[];
  sortBy?: 'newest' | 'oldest' | 'priority' | 'alphabetical' | 'category';
}

const AnnouncementsList: React.FC<AnnouncementListProps> = ({ 
  announcements, 
  isLoading,
  refetch,
  searchQuery = '',
  selectedCategories = [],
  selectedAudiences = [],
  sortBy = 'newest'
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  if (isLoading) {
    return <AnnouncementSkeleton />;
  }
  
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      searchQuery === '' || 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(announcement.category);
    const matchesAudience = selectedAudiences.length === 0 || selectedAudiences.includes(announcement.audience);
    
    return matchesSearch && matchesCategory && matchesAudience;
  });

  // Sort announcements based on the selected sort option
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        // Newest first: Pinned announcements always come first, then sort by created date descending
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      
      case 'oldest':
        // Oldest first: Pinned announcements always come first, then sort by created date ascending
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      
      case 'priority':
        // Priority: Emergency > Pinned > Public > Draft, then by recency
        const getPriorityScore = (ann: Announcement) => {
          if (ann.category.toLowerCase() === 'emergency') return 4;
          if (ann.is_pinned) return 3;
          if (ann.is_public) return 2;
          return 1;
        };
        const priorityDiff = getPriorityScore(b) - getPriorityScore(a);
        return priorityDiff !== 0 ? priorityDiff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      
      case 'alphabetical':
        // Alphabetical by title: Pinned announcements first, then alphabetical
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return a.title.localeCompare(b.title);
      
      case 'category':
        // Group by category: Emergency first, then alphabetical by category, then by date
        if (a.category !== b.category) {
          if (a.category.toLowerCase() === 'emergency') return -1;
          if (b.category.toLowerCase() === 'emergency') return 1;
          return a.category.localeCompare(b.category);
        }
        // Within same category, pinned first, then by date
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnnouncements = sortedAnnouncements.slice(startIndex, startIndex + itemsPerPage);

  const openDeleteDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditDialogOpen(true);
  };

  const openViewDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', selectedAnnouncement.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Announcement deleted",
        description: "The announcement has been successfully deleted.",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete the announcement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const getStatusBadge = (announcement: Announcement) => {
    if (announcement.is_pinned) {
      return <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">Pinned</span>;
    }
    if (announcement.is_public) {
      return <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">Active</span>;
    }
    return <span className="bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">Draft</span>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Emergency': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      'Event': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Health': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'Service': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      'News': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      'Education': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
    };
    
    const colorClass = categoryColors[category] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
    return <span className={`${colorClass} px-3 py-1 rounded-full text-sm font-medium`}>{category}</span>;
  };

  const getCategoryBorderColor = (category: string) => {
    const borderColors: Record<string, string> = {
      'Emergency': 'border-l-red-500',
      'Event': 'border-l-blue-500',
      'Health': 'border-l-green-500',
      'Service': 'border-l-purple-500',
      'News': 'border-l-indigo-500',
      'Education': 'border-l-indigo-500'
    };
    
    return borderColors[category] || 'border-l-gray-500';
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffHours < 48) return 'Yesterday';
      if (diffHours < 168) return `${Math.floor(diffHours / 24)} days ago`;
      return `${Math.floor(diffHours / 168)} week${Math.floor(diffHours / 168) > 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedAnnouncements.map((announcement) => (
          <div key={announcement.id} className={`bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 ${getCategoryBorderColor(announcement.category)}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getCategoryBadge(announcement.category)}
                {getStatusBadge(announcement)}
              </div>
              
              {userProfile?.role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="p-2 hover:bg-muted rounded-full transition-colors duration-200">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem onClick={() => openEditDialog(announcement)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openViewDialog(announcement)} className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-600" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => openDeleteDialog(announcement)} 
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-card-foreground mb-2">{announcement.title}</h3>
            <p className="text-muted-foreground mb-4 line-clamp-3">{announcement.content}</p>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {announcement.audience}
              </div>
              <span>{formatTimeAgo(announcement.created_at)}</span>
            </div>
          </div>
        ))}
        
            {sortedAnnouncements.length === 0 && (
              <div className="col-span-3 py-8 text-center text-muted-foreground">
                No announcements found matching your search criteria.
              </div>
            )}
          </div>

          {sortedAnnouncements.length > 0 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAnnouncements.length)} of {sortedAnnouncements.length} announcements
              </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors duration-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    currentPage === page 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors duration-200 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAnnouncement}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Announcement Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedAnnouncement && getCategoryBadge(selectedAnnouncement.category)}
              {selectedAnnouncement && getStatusBadge(selectedAnnouncement)}
            </div>
            <DialogTitle className="text-2xl">{selectedAnnouncement?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-4">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedAnnouncement.authorName}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedAnnouncement.created_at), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedAnnouncement.audience}
                </div>
                {selectedAnnouncement.is_pinned && (
                  <div className="flex items-center gap-1">
                    <Pin className="h-4 w-4" />
                    Pinned
                  </div>
                )}
              </div>
              
              <div className="prose max-w-none">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>
              
              {selectedAnnouncement.photo_url && (
                <div>
                  <h4 className="font-semibold mb-2">Photo</h4>
                  <img 
                    src={selectedAnnouncement.photo_url} 
                    alt="Announcement photo" 
                    className="max-w-full h-auto rounded-lg border"
                  />
                </div>
              )}
              
              {selectedAnnouncement.attachment_url && (
                <div>
                  <h4 className="font-semibold mb-2">Attachment</h4>
                  <a 
                    href={selectedAnnouncement.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Modal */}
      <EditAnnouncementDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        announcement={selectedAnnouncement}
        onSuccess={() => {
          setEditDialogOpen(false);
          refetch();
          toast({
            title: "Announcement updated",
            description: "The announcement has been successfully updated.",
          });
        }}
      />
    </div>
  );
};

const AnnouncementSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-gray-300">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementsList;
