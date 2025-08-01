import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import AnnouncementsList from '@/components/announcements/AnnouncementsList';
import CreateAnnouncementForm from '@/components/announcements/CreateAnnouncementForm';
import { Search, Users, FolderOpen, ArrowUpDown, Plus, Megaphone, CheckCircle, Calendar, AlertTriangle, Clock, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  audience: string;
  is_pinned: boolean;
  is_public: boolean;
  photo_url?: string;
  attachment_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  brgyid: string;
  authorName: string;
}

const AnnouncementsPage = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'alphabetical' | 'category'>('newest');
  const [openDropdown, setOpenDropdown] = useState<'category' | 'audience' | 'sort' | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element)?.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Fetch announcements from Supabase
  const { data: announcements, isLoading, error, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (announcementsError) throw announcementsError;

        // Fetch user profiles to get author names
        const userIds = [...new Set(announcementsData.map(a => a.created_by))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, firstname, lastname')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user IDs to names
        const userMap = profilesData.reduce((acc, user) => {
          acc[user.id] = `${user.firstname} ${user.lastname}`;
          return acc;
        }, {});

        // Add author names to announcements
        const announcementsWithAuthors = announcementsData.map(announcement => ({
          ...announcement,
          authorName: userMap[announcement.created_by] || 'Unknown User'
        }));

        return announcementsWithAuthors;
      } catch (error) {
        console.error('Error fetching announcements:', error);
        throw error;
      }
    }
  });

  const toggleCreateForm = () => setShowCreateForm(!showCreateForm);

  const handleAnnouncementCreated = () => {
    setShowCreateForm(false);
    refetch();
    toast({
      title: "Announcement Created",
      description: "Your announcement has been published successfully."
    });
  };

  // Calculate stats
  const totalAnnouncements = announcements?.length || 0;
  const activeAnnouncements = announcements?.filter(a => a.is_public)?.length || 0;
  const emergencyAnnouncements = announcements?.filter(a => a.category.toLowerCase() === 'emergency')?.length || 0;
  const pinnedAnnouncements = announcements?.filter(a => a.is_pinned)?.length || 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Barangay Announcements</h1>
          <p className="text-muted-foreground">Manage and organize community announcements</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <input 
                  type="text" 
                  placeholder="Search announcements..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-2 border border-border"
                >
                  <FolderOpen className="text-secondary-foreground h-4 w-4" />
                  Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                  <span className="text-muted-foreground">▼</span>
                </button>
                {openDropdown === 'category' && (
                  <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[150px]">
                    <div className="p-2">
                      {['Emergency', 'Event', 'Health', 'Service', 'News'].map(category => (
                        <label key={category} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer border-b border-border/50 last:border-b-0">
                          <input 
                            type="checkbox" 
                            className="rounded" 
                            checked={selectedCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                          />
                          <span className="text-popover-foreground">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Audience Filter */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'audience' ? null : 'audience')}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-2 border border-border"
                >
                  <Users className="text-secondary-foreground h-4 w-4" />
                  Audience {selectedAudiences.length > 0 && `(${selectedAudiences.length})`}
                  <span className="text-muted-foreground">▼</span>
                </button>
                {openDropdown === 'audience' && (
                  <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[150px]">
                    <div className="p-2">
                      {['All Residents', 'Senior Citizens', 'Business Owners', 'Students'].map(audience => (
                        <label key={audience} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer border-b border-border/50 last:border-b-0">
                          <input 
                            type="checkbox" 
                            className="rounded" 
                            checked={selectedAudiences.includes(audience)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAudiences([...selectedAudiences, audience]);
                              } else {
                                setSelectedAudiences(selectedAudiences.filter(a => a !== audience));
                              }
                            }}
                          />
                          <span className="text-popover-foreground">{audience}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort By */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-2 border border-border"
                >
                  <ArrowUpDown className="text-secondary-foreground h-4 w-4" />
                  Sort: {sortBy === 'newest' ? 'Newest First' : 
                         sortBy === 'oldest' ? 'Oldest First' : 
                         sortBy === 'priority' ? 'Priority' : 
                         sortBy === 'alphabetical' ? 'A-Z' : 
                         'Category'}
                  <span className="text-muted-foreground">▼</span>
                </button>
                {openDropdown === 'sort' && (
                  <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[160px]">
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setSortBy('newest');
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left p-3 hover:bg-accent text-popover-foreground rounded border-b border-border/50 flex items-center gap-2 ${sortBy === 'newest' ? 'bg-accent' : ''}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                        Newest First
                      </button>
                      <button 
                        onClick={() => {
                          setSortBy('oldest');
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left p-3 hover:bg-accent text-popover-foreground rounded border-b border-border/50 flex items-center gap-2 ${sortBy === 'oldest' ? 'bg-accent' : ''}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                        Oldest First
                      </button>
                      <button 
                        onClick={() => {
                          setSortBy('priority');
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left p-3 hover:bg-accent text-popover-foreground rounded border-b border-border/50 flex items-center gap-2 ${sortBy === 'priority' ? 'bg-accent' : ''}`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Priority
                      </button>
                      <button 
                        onClick={() => {
                          setSortBy('alphabetical');
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left p-3 hover:bg-accent text-popover-foreground rounded border-b border-border/50 flex items-center gap-2 ${sortBy === 'alphabetical' ? 'bg-accent' : ''}`}
                      >
                        <Filter className="h-4 w-4" />
                        Alphabetical
                      </button>
                      <button 
                        onClick={() => {
                          setSortBy('category');
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left p-3 hover:bg-accent text-popover-foreground rounded ${sortBy === 'category' ? 'bg-accent' : ''} flex items-center gap-2`}
                      >
                        <FolderOpen className="h-4 w-4" />
                        Category
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {userProfile?.role === 'admin' && (
                <button 
                  onClick={toggleCreateForm}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  New Announcement
                </button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border border-destructive/20">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load announcements. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          <AnnouncementsList 
            announcements={announcements || []} 
            isLoading={isLoading} 
            refetch={refetch}
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            selectedAudiences={selectedAudiences}
            sortBy={sortBy}
          />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground">Quick Stats</h2>
            <button className="text-primary hover:text-primary/80 transition-colors duration-200 px-3 py-1 rounded border border-border hover:bg-muted/50">
              View Details
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white border border-blue-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Announcements</p>
                  <p className="text-3xl font-bold">{totalAnnouncements}</p>
                </div>
                <div className="p-2 bg-blue-400/20 rounded-lg border border-blue-300/30">
                  <Megaphone className="text-blue-200 h-10 w-10" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active</p>
                  <p className="text-3xl font-bold">{activeAnnouncements}</p>
                </div>
                <div className="p-2 bg-green-400/20 rounded-lg border border-green-300/30">
                  <CheckCircle className="text-green-200 h-10 w-10" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white border border-yellow-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pinned</p>
                  <p className="text-3xl font-bold">{pinnedAnnouncements}</p>
                </div>
                <div className="p-2 bg-yellow-400/20 rounded-lg border border-yellow-300/30">
                  <Calendar className="text-yellow-200 h-10 w-10" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white border border-red-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Emergency</p>
                  <p className="text-3xl font-bold">{emergencyAnnouncements}</p>
                </div>
                <div className="p-2 bg-red-400/20 rounded-lg border border-red-300/30">
                  <AlertTriangle className="text-red-200 h-10 w-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <CreateAnnouncementForm 
                onAnnouncementCreated={handleAnnouncementCreated} 
                onCancel={() => setShowCreateForm(false)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
