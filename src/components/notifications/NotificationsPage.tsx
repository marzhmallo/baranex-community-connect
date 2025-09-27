import { useState, useEffect } from 'react';
import { formatDistanceToNow } from "date-fns";
import { Bell, Archive, Filter, Loader2, ChevronDown, AlertCircle, Clock, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'high': return <Zap className="h-4 w-4 text-orange-500" />;
    case 'normal': return <Star className="h-4 w-4 text-blue-500" />;
    case 'low': return <Clock className="h-4 w-4 text-gray-500" />;
    default: return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'border-red-200 bg-red-50 hover:bg-red-100';
    case 'high': return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
    case 'normal': return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
    case 'low': return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    default: return 'border-gray-200 bg-white hover:bg-gray-50';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'announcement': return 'Announcement';
    case 'event': return 'Event';
    case 'document': return 'Document';
    case 'emergency': return 'Emergency';
    case 'profile': return 'Profile';
    default: return category.charAt(0).toUpperCase() + category.slice(1);
  }
};

export const NotificationsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    hasMore, 
    markAsRead, 
    markAllAsRead, 
    loadMore,
    archiveNotification 
  } = useNotifications(20, selectedCategory === 'all' ? undefined : selectedCategory, selectedPriority === 'all' ? undefined : selectedPriority);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const renderNotificationLink = (notification: Notification) => {
    const content = (
      <div className={cn(
        "p-4 border rounded-lg transition-all duration-200 cursor-pointer",
        !notification.read ? getPriorityColor(notification.priority) : "border-gray-200 bg-white hover:bg-gray-50"
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getPriorityIcon(notification.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {getCategoryLabel(notification.category)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {notification.priority}
                </Badge>
                {!notification.read && (
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
              <p className={cn(
                "text-sm leading-snug",
                !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
              )}>
                {notification.message || 'No message'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {notification.created_at ? 
                  formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 
                  'Just now'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                archiveNotification(notification.id);
              }}
              className="h-8 w-8 p-0"
              title="Archive notification"
            >
              <Archive className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );

    // Handle different notification types and their links
    if (notification.type === 'dnexus' || notification.type === 'dnexus_status') {
      return (
        <Link to="/nexus" onClick={() => handleNotificationClick(notification)}>
          {content}
        </Link>
      );
    } else if (notification.linkurl) {
      return (
        <Link to={String(notification.linkurl)} onClick={() => handleNotificationClick(notification)}>
          {content}
        </Link>
      );
    } else {
      return (
        <div onClick={() => handleNotificationClick(notification)}>
          {content}
        </div>
      );
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading notifications...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              {unreadCount} unread of {notifications.length} notifications
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
                <SelectItem value="event">Events</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="whitespace-nowrap">
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id}>
              {renderNotificationLink(notification)}
            </div>
          ))}
          
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up! Check back later for updates.</p>
            </div>
          )}

          {hasMore && notifications.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={loadMore} 
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load more notifications
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};