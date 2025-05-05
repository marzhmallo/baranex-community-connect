
import React, { useState } from 'react';
import { 
  ChevronDown,
  Search, 
  Filter, 
  Plus, 
  Calendar,
  Bell,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  MoreVertical,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Announcement } from '@/lib/types';
import { announcements } from '@/lib/data';

const AnnouncementsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      searchQuery === '' || 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || announcement.category === selectedCategory;
    const matchesPriority = selectedPriority === null || announcement.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  const handlePriorityFilter = (priority: string | null) => {
    setSelectedPriority(priority);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Announcements & Events</h2>
        
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
              <DropdownMenuItem onClick={() => handleCategoryFilter('Event')}>
                Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryFilter('News')}>
                News
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryFilter('Alert')}>
                Alert
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCategoryFilter('Service')}>
                Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {selectedPriority || "All Priorities"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handlePriorityFilter(null)}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilter('Low')}>
                Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilter('Medium')}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilter('High')}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePriorityFilter('Urgent')}>
                Urgent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
            
            {filteredAnnouncements.length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No announcements found matching your search criteria.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="events" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements
              .filter(a => a.category === 'Event')
              .map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            
            {filteredAnnouncements.filter(a => a.category === 'Event').length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No events found matching your search criteria.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="services" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements
              .filter(a => a.category === 'Service')
              .map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            
            {filteredAnnouncements.filter(a => a.category === 'Service').length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No services found matching your search criteria.
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="alerts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements
              .filter(a => a.category === 'Alert')
              .map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            
            {filteredAnnouncements.filter(a => a.category === 'Alert').length === 0 && (
              <div className="col-span-3 py-8 text-center text-gray-500">
                No alerts found matching your search criteria.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
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
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-amber-100 text-amber-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className={`pb-2 ${announcement.priority === 'Urgent' ? 'bg-red-50' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="flex space-x-2">
            <div className={`p-1.5 rounded-full ${
              announcement.category === 'Event' 
                ? 'bg-purple-100 text-purple-600' 
                : announcement.category === 'Alert'
                ? 'bg-red-100 text-red-600'
                : announcement.category === 'Service'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {getCategoryIcon(announcement.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
              <CardDescription className="flex items-center text-xs mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {announcement.datePosted}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(announcement.priority)}`}>
              {announcement.priority}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-gray-600 line-clamp-3">{announcement.content}</p>
        
        {(announcement.startDate || announcement.location) && (
          <div className="mt-4 space-y-2">
            {announcement.startDate && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                {announcement.startDate}
                {announcement.endDate && announcement.endDate !== announcement.startDate && ` to ${announcement.endDate}`}
              </div>
            )}
            
            {announcement.location && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                {announcement.location}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <div className="w-full flex justify-between items-center">
          <div className="text-xs text-gray-500 flex items-center">
            By: {announcement.authorName}
          </div>
          <Button variant="ghost" size="sm">
            Read More
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AnnouncementsList;
