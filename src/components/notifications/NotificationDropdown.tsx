import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Dot, AlertCircle, Clock, Zap, Star, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent': return <AlertCircle className="h-3 w-3 text-red-500" />;
    case 'high': return <Zap className="h-3 w-3 text-orange-500" />;
    case 'normal': return <Star className="h-3 w-3 text-blue-500" />;
    case 'low': return <Clock className="h-3 w-3 text-gray-500" />;
    default: return <Bell className="h-3 w-3 text-gray-500" />;
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const NotificationDropdown = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 rounded-xl bg-popover/95 supports-[backdrop-filter]:bg-popover/80 backdrop-blur shadow-xl ring-1 ring-border z-50 overflow-hidden">
        <DropdownMenuLabel className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-popover border-b">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">Notifications</span>
            <Link to="/notifications">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                View all
              </Button>
            </Link>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="hidden" />
        
        {notifications.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p className="text-sm">You’re all caught up</p>
          </div>
        ) : (
          <ScrollArea className="h-[420px] max-h-[60vh]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`group flex items-start gap-3 p-4 cursor-pointer rounded-none border-b last:border-b-0 border-border/60 hover:bg-accent/40 focus:bg-accent/50 ${!notification.read ? 'bg-accent/25' : ''}`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
                asChild
              >
                <div className={`${(notification.type === 'dnexus' || notification.type === 'dnexus_status' || notification.linkurl) ? 'cursor-pointer' : 'cursor-default'} w-full`}>
                  {(notification.type === 'dnexus' || notification.type === 'dnexus_status') ? (
                    <Link to="/nexus" className="w-full">
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : notification.linkurl ? (
                    <Link to={String(notification.linkurl)} className="w-full">
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : (
                    <NotificationContent notification={notification} />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NotificationContent = ({ notification }: { notification: any }) => (
  <>
    <div className="flex-shrink-0 flex flex-col items-center gap-1">
      {getPriorityIcon(notification.priority)}
      {!notification.read && (
        <Dot className="h-4 w-4 text-primary" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1 mb-1">
        <Badge 
          variant="outline" 
          className={cn("text-xs px-1.5 py-0.5", getPriorityBadgeColor(notification.priority))}
        >
          {notification.priority}
        </Badge>
        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
          {notification.category}
        </Badge>
      </div>
      <p className={cn(
        "text-sm leading-snug",
        !notification.read ? 'font-medium' : 'text-muted-foreground',
        'group-hover:text-foreground'
      )}>
        {notification.message || 'No message'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {notification.created_at ? 
          formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : 
          'Just now'
        }
      </p>
    </div>
    {!notification.read && (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Mark notification as read"
      >
        <Check className="h-3 w-3" />
      </Button>
    )}
  </>
);