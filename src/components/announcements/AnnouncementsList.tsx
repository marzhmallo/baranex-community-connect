
import React, { useState } from 'react';
import { 
  ChevronDown,
  Search, 
  Filter, 
  Calendar,
  Bell,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Share,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

const AnnouncementsList: React.FC<AnnouncementListProps> = ({ 
  announcements, 
  isLoading,
  refetch 
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // If loading, show skeleton
  if (isLoading) {
    return <AnnouncementSkeleton />;
  }
  
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      searchQuery === '' || 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || announcement.category === selectedCategory;
    const matchesAudience = selectedAudience === null || announcement.audience === selectedAudience;
    
    return matchesSearch && matchesCategory && matchesAudience;
  });
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  const handleAudienceFilter = (audience: string | null) => {
    setSelectedAudience(audience);
  };

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

  // All unique categories
  const categories = Array.from(new Set(announcements.map(a => a.category)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Recent Announcements</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search announcements..."
              className="pl-9 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                {selectedCategory || "All Categories"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleCategoryFilter(null)}>
                All Categories
              </DropdownMenuItem>
              {categories.map(category => (
                <DropdownMenuItem 
                  key={category} 
                  onClick={() => handleCategoryFilter(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {selectedAudience || "All Audiences"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Audience</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAudienceFilter(null)}>
                All Audiences
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAudienceFilter('Public')}>
                Public
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAudienceFilter('Officials')}>
                Officials Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAudienceFilter('SK')}>
                SK Members
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAudienceFilter('Internal')}>
                Internal Staff
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement}
                isAdmin={userProfile?.role === 'admin'} 
                onDelete={() => openDeleteDialog(announcement)}
                canEdit={userProfile?.id === announcement.created_by}
              />
            ))}
            
            {filteredAnnouncements.length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No announcements found matching your search criteria.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pinned" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements
              .filter(a => a.is_pinned)
              .map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement}
                  isAdmin={userProfile?.role === 'admin'} 
                  onDelete={() => openDeleteDialog(announcement)}
                  canEdit={userProfile?.id === announcement.created_by}
                />
              ))}
            
            {filteredAnnouncements.filter(a => a.is_pinned).length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No pinned announcements found.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements
              .filter(a => a.category === 'Event')
              .map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement}
                  isAdmin={userProfile?.role === 'admin'} 
                  onDelete={() => openDeleteDialog(announcement)}
                  canEdit={userProfile?.id === announcement.created_by}
                />
              ))}
            
            {filteredAnnouncements.filter(a => a.category === 'Event').length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No events found.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements
              .filter(a => a.category === 'Alert')
              .map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement}
                  isAdmin={userProfile?.role === 'admin'} 
                  onDelete={() => openDeleteDialog(announcement)}
                  canEdit={userProfile?.id === announcement.created_by}
                />
              ))}
            
            {filteredAnnouncements.filter(a => a.category === 'Alert').length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No alerts found.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdmin: boolean;
  canEdit: boolean;
  onDelete: () => void;
}

const AnnouncementCard = ({ 
  announcement, 
  isAdmin,
  canEdit,
  onDelete 
}: AnnouncementCardProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Event':
        return <Calendar className="h-5 w-5" />;
      case 'Alert':
        return <AlertTriangle className="h-5 w-5" />;
      case 'Service':
        return <Bell className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };
  
  const getPriorityClass = (category: string) => {
    switch (category) {
      case 'Alert':
        return 'bg-red-100 text-red-800';
      case 'Event':
        return 'bg-purple-100 text-purple-800';
      case 'Health':
        return 'bg-blue-100 text-blue-800';
      case 'Service':
        return 'bg-cyan-100 text-cyan-800';
      case 'News':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${announcement.is_pinned ? 'border-orange-300 bg-orange-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex space-x-2">
            <div className={`p-1.5 rounded-full ${
              announcement.category === 'Event' 
                ? 'bg-purple-100 text-purple-600' 
                : announcement.category === 'Alert'
                ? 'bg-red-100 text-red-600'
                : announcement.category === 'Service'
                ? 'bg-blue-100 text-blue-600'
                : announcement.category === 'Health'
                ? 'bg-green-100 text-green-600'
                : announcement.category === 'News'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {getCategoryIcon(announcement.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
              <CardDescription className="flex items-center text-xs mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(announcement.created_at)}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityClass(announcement.category)}`}>
              {announcement.category}
            </span>
            {(isAdmin && canEdit) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="h-4 w-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-gray-600 line-clamp-3">{announcement.content}</p>
        
        {announcement.photo_url && (
          <div className="mt-4">
            <img 
              src={announcement.photo_url} 
              alt={announcement.title}
              className="w-full h-40 object-cover rounded-md" 
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <div className="w-full flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            By: {announcement.authorName}
          </div>
          <div className="flex gap-2">
            {announcement.attachment_url && (
              <Button variant="outline" size="sm" className="text-sm">
                <FileDown className="h-4 w-4 mr-1" /> Attachment
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-sm">
              Read More
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const AnnouncementSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-40 w-full mt-4 rounded-md" />
          </CardContent>
          <CardFooter className="border-t pt-2">
            <div className="w-full flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AnnouncementsList;
