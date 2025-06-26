
import React, { useState } from 'react';
import { 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/pages/AnnouncementsPage';

interface AnnouncementListProps {
  announcements: Announcement[];
  isLoading: boolean;
  refetch: () => void;
  searchQuery?: string;
  selectedCategories?: string[];
  selectedAudiences?: string[];
}

const AnnouncementsList: React.FC<AnnouncementListProps> = ({ 
  announcements, 
  isLoading,
  refetch,
  searchQuery = '',
  selectedCategories = [],
  selectedAudiences = []
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnnouncements = filteredAnnouncements.slice(startIndex, startIndex + itemsPerPage);

  const openDeleteDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
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
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-blue-600" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
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
        
        {filteredAnnouncements.length === 0 && (
          <div className="col-span-3 py-8 text-center text-muted-foreground">
            No announcements found matching your search criteria.
          </div>
        )}
      </div>

      {filteredAnnouncements.length > 0 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAnnouncements.length)} of {filteredAnnouncements.length} announcements
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
