import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Dot } from "lucide-react";
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
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-baranex-danger text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id);
                  }
                }}
                asChild
              >
                <div className={`${notification.linkurl ? 'cursor-pointer' : 'cursor-default'}`}>
                  {notification.linkurl ? (
                    <Link to={notification.linkurl} className="w-full">
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
    <div className="flex-shrink-0">
      {!notification.read ? (
        <Dot className="h-6 w-6 text-baranex-primary" />
      ) : (
        <div className="h-6 w-6" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-muted-foreground'}`}>
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
        className="h-auto p-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Check className="h-3 w-3" />
      </Button>
    )}
  </>
);