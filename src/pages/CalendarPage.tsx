import { useState, useEffect } from "react";
import { format, isToday, isEqual, isSameMonth, parse, addDays, subDays, addMonths, subMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload, Edit, Trash2, X, Clock, MapPin, Users, Repeat, Bell, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/AuthProvider";

export type Event = {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  created_by?: string;
  target_audience?: string;
  event_type?: string;
  visibility: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  reminder_enabled?: boolean;
  reminder_time?: number;
};

type EventFormData = {
  title: string;
  description: string;
  location: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  event_type: string;
  target_audience: string;
  visibility: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  reminder_enabled: boolean;
  reminder_time: number;
};

const eventCategories = [
  { value: "meeting", label: "Meetings", color: "bg-blue-500", bgLight: "bg-blue-100", bgDark: "bg-blue-900/30", text: "text-blue-800", textDark: "text-blue-300" },
  { value: "health", label: "Health", color: "bg-green-500", bgLight: "bg-green-100", bgDark: "bg-green-900/30", text: "text-green-800", textDark: "text-green-300" },
  { value: "sports", label: "Sports", color: "bg-purple-500", bgLight: "bg-purple-100", bgDark: "bg-purple-900/30", text: "text-purple-800", textDark: "text-purple-300" },
  { value: "holiday", label: "Holidays", color: "bg-red-500", bgLight: "bg-red-100", bgDark: "bg-red-900/30", text: "text-red-800", textDark: "text-red-300" },
  { value: "education", label: "Education", color: "bg-yellow-500", bgLight: "bg-yellow-100", bgDark: "bg-yellow-900/30", text: "text-yellow-800", textDark: "text-yellow-300" },
  { value: "social", label: "Social", color: "bg-pink-500", bgLight: "bg-pink-100", bgDark: "bg-pink-900/30", text: "text-pink-800", textDark: "text-pink-300" }
];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile, user } = useAuth();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      visibility: 'public',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      reminder_enabled: false,
      reminder_time: 30
    }
  });

  const [isAllDayCreate, setIsAllDayCreate] = useState(false);
  const [isAllDayEdit, setIsAllDayEdit] = useState(false);

  // Auto-set times when all-day is toggled
  useEffect(() => {
    if (isAllDayCreate) {
      setValue("start_time", "00:00");
      setValue("end_time", "23:59");
    }
  }, [isAllDayCreate, setValue]);

  // Auto-set times when all-day edit is toggled
  useEffect(() => {
    if (isAllDayEdit) {
      setValue("start_time", "00:00");
      setValue("end_time", "23:59");
    }
  }, [isAllDayEdit, setValue]);

  // Fetch events from Supabase
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) {
        toast({
          title: "Error fetching events",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      return data || [];
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: EventFormData) => {
      let startDateTime = new Date(`${eventData.start_date}T${eventData.start_time}`);
      let endDateTime = new Date(`${eventData.end_date}T${eventData.end_time}`);

      // If all-day is checked, set times to beginning and end of day
      if (isAllDayCreate) {
        startDateTime = new Date(eventData.start_date);
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime = new Date(eventData.end_date);
        endDateTime.setHours(23, 59, 59, 999);
      }

      const { error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          event_type: eventData.event_type,
          target_audience: eventData.target_audience,
          visibility: eventData.visibility,
          brgyid: userProfile?.brgyid || "",
          created_by: user?.id || ""
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventForm(false);
      setIsAllDayCreate(false);
      reset();
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: EventFormData & { id: string; isAllDay?: boolean }) => {
      let startDateTime = new Date(`${eventData.start_date}T${eventData.start_time}`);
      let endDateTime = new Date(`${eventData.end_date}T${eventData.end_time}`);

      // If all-day is checked, set times to beginning and end of day
      if (eventData.isAllDay) {
        startDateTime = new Date(eventData.start_date);
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime = new Date(eventData.end_date);
        endDateTime.setHours(23, 59, 59, 999);
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          event_type: eventData.event_type,
          target_audience: eventData.target_audience,
          visibility: eventData.visibility,
        })
        .eq('id', eventData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEditForm(false);
      setSelectedEvent(null);
      reset();
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventDetails(false);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    }
  });

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    
    return events.filter((event: any) => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length > 0) {
      setShowEventDetails(true);
    }
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    // Check if event is all-day by comparing times
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
                     endDate.getHours() === 23 && endDate.getMinutes() === 59;
    
    setIsAllDayEdit(isAllDay);
    
    // Populate form with event data
    setValue("title", event.title);
    setValue("description", event.description || "");
    setValue("location", event.location || "");
    setValue("start_date", format(startDate, "yyyy-MM-dd"));
    setValue("start_time", format(startDate, "HH:mm"));
    setValue("end_date", format(endDate, "yyyy-MM-dd"));
    setValue("end_time", format(endDate, "HH:mm"));
    setValue("event_type", event.event_type || "");
    setValue("target_audience", event.target_audience || "");
    setValue("visibility", event.visibility || 'public');
    
    setShowEditForm(true);
    setShowEventDetails(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
    setShowDeleteDialog(false);
  };

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const onEditSubmit = (data: EventFormData) => {
    if (selectedEvent) {
      updateEventMutation.mutate({ ...data, id: selectedEvent.id, isAllDay: isAllDayEdit });
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        events: getEventsForDate(prevMonthDay)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        events: getEventsForDate(currentDay)
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        events: getEventsForDate(nextMonthDay)
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = events?.filter(event => new Date(event.start_time) >= now) || [];
  const pastEvents = events?.filter(event => new Date(event.start_time) < now) || [];

  // Show loading screen similar to feedback page
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Loading events</p>
            <p className="text-xs text-muted-foreground mt-1">Preparing calendar data and upcoming events</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-background min-h-screen">
      <div className="max-w-none mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Barangay Calendar</h1>
                <p className="text-primary-foreground/80 mt-1">Manage community events and activities</p>
              </div>
              <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
                <DialogTrigger asChild>
                  <Button className="bg-background text-foreground hover:bg-muted border border-border">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-card-foreground">Create New Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title" className="text-card-foreground">Event Title</Label>
                        <Input
                          {...register("title", { required: "Title is required" })}
                          placeholder="Enter event title"
                          className="bg-background border-border text-foreground"
                        />
                        {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="event_type" className="text-card-foreground">Category</Label>
                        <Select onValueChange={(value) => setValue("event_type", value)}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {eventCategories.map(category => (
                              <SelectItem key={category.value} value={category.value} className="text-popover-foreground hover:bg-accent">
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-card-foreground">Description</Label>
                      <Textarea
                        {...register("description")}
                        placeholder="Enter event description"
                        rows={3}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location" className="text-card-foreground">Location</Label>
                      <Input
                        {...register("location")}
                        placeholder="Enter event location"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={isAllDayCreate}
                        onCheckedChange={(checked) => setIsAllDayCreate(checked === true)}
                      />
                      <Label className="text-card-foreground">All-day Event</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date" className="text-card-foreground">Start Date</Label>
                        <Input
                          type="date"
                          {...register("start_date", { required: "Start date is required" })}
                          className="bg-background border-border text-foreground"
                        />
                        {errors.start_date && <p className="text-destructive text-sm mt-1">{errors.start_date.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="start_time" className="text-card-foreground">Start Time</Label>
                         <Input
                           type="time"
                           {...register("start_time", { required: !isAllDayCreate && "Start time is required" })}
                           className="bg-background border-border text-foreground"
                           disabled={isAllDayCreate}
                         />
                        {errors.start_time && <p className="text-destructive text-sm mt-1">{errors.start_time.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="end_date" className="text-card-foreground">End Date</Label>
                        <Input
                          type="date"
                          {...register("end_date", { required: "End date is required" })}
                          className="bg-background border-border text-foreground"
                        />
                        {errors.end_date && <p className="text-destructive text-sm mt-1">{errors.end_date.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="end_time" className="text-card-foreground">End Time</Label>
                         <Input
                           type="time"
                           {...register("end_time", { required: !isAllDayCreate && "End time is required" })}
                           className="bg-background border-border text-foreground"
                           disabled={isAllDayCreate}
                         />
                        {errors.end_time && <p className="text-destructive text-sm mt-1">{errors.end_time.message}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="target_audience" className="text-card-foreground">Target Audience</Label>
                      <Input
                        {...register("target_audience")}
                        placeholder="e.g., All residents, Youth, Seniors"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <Label htmlFor="visibility" className="text-card-foreground">Event Visibility</Label>
                      <Select onValueChange={(value) => setValue("visibility", value)}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {userProfile?.role === 'admin' && (
                            <SelectItem value="internal" className="text-popover-foreground hover:bg-accent">Internal</SelectItem>
                          )}
                          <SelectItem value="users" className="text-popover-foreground hover:bg-accent">All Logged-in Users</SelectItem>
                          <SelectItem value="public" className="text-popover-foreground hover:bg-accent">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox {...register("is_recurring")} />
                      <Label className="text-card-foreground">Recurring Event</Label>
                    </div>

                    {watch("is_recurring") && (
                      <div>
                        <Label htmlFor="recurrence_pattern" className="text-card-foreground">Recurrence Pattern</Label>
                        <Select onValueChange={(value) => setValue("recurrence_pattern", value)}>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Select recurrence" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="daily" className="text-popover-foreground hover:bg-accent">Daily</SelectItem>
                            <SelectItem value="weekly" className="text-popover-foreground hover:bg-accent">Weekly</SelectItem>
                            <SelectItem value="monthly" className="text-popover-foreground hover:bg-accent">Monthly</SelectItem>
                            <SelectItem value="yearly" className="text-popover-foreground hover:bg-accent">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox {...register("reminder_enabled")} />
                      <Label className="text-card-foreground">Enable Reminders</Label>
                    </div>

                    {watch("reminder_enabled") && (
                      <div>
                        <Label htmlFor="reminder_time" className="text-card-foreground">Reminder Time (minutes before)</Label>
                        <Input
                          type="number"
                          {...register("reminder_time")}
                          placeholder="30"
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowEventForm(false)} className="border-border">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createEventMutation.isPending}>
                        {createEventMutation.isPending ? "Creating..." : "Create Event"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="p-6 bg-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="hover:bg-muted">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold text-card-foreground">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="hover:bg-muted">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={view === 'month' ? 'default' : 'ghost'} 
                  onClick={() => setView('month')}
                  className={view !== 'month' ? 'hover:bg-muted' : ''}
                >
                  Month
                </Button>
                <Button 
                  variant={view === 'week' ? 'default' : 'ghost'} 
                  onClick={() => setView('week')}
                  className={view !== 'week' ? 'hover:bg-muted' : ''}
                >
                  Week
                </Button>
                <Button 
                  variant={view === 'day' ? 'default' : 'ghost'} 
                  onClick={() => setView('day')}
                  className={view !== 'day' ? 'hover:bg-muted' : ''}
                >
                  Day
                </Button>
              </div>
            </div>

            {/* Calendar Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-sm font-semibold text-muted-foreground text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {view === 'month' && (
              <div className="grid grid-cols-7 gap-1 bg-muted p-1 rounded-lg">
                {calendarDays.map((day, index) => {
                  const isSelected = selectedDate && isEqual(day.date, selectedDate);
                  const hasEvents = day.events.length > 0;
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day.date)}
                      className={`
                        bg-card border border-border p-2 min-h-24 rounded hover:bg-accent cursor-pointer transition-colors duration-200
                        ${!day.isCurrentMonth ? "text-muted-foreground opacity-50" : ""}
                        ${isToday(day.date) ? "bg-primary/10 border-primary/30" : ""}
                        ${isSelected ? "ring-2 ring-primary" : ""}
                      `}
                    >
                      <div className={`text-sm ${isToday(day.date) ? "font-bold text-primary" : "font-semibold text-card-foreground"}`}>
                        {format(day.date, "d")}
                      </div>
                      {hasEvents && (
                        <div className="mt-1 space-y-1">
                          {day.events.slice(0, 2).map((event, i) => {
                            const category = eventCategories.find(cat => cat.value === event.event_type);
                            return (
                              <div
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                className={`text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors duration-200
                                  ${category ? `${category.bgLight} dark:${category.bgDark} ${category.text} dark:${category.textDark}` : 'bg-muted text-muted-foreground'}
                                  hover:opacity-80
                                `}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {day.events.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{day.events.length - 2} more</div>
                          )}
                        </div>
                      )}
                      {isToday(day.date) && (
                        <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded mt-1">
                          Today
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Week View */}
            {view === 'week' && (
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-3 text-sm font-semibold text-muted-foreground text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 bg-muted p-1 rounded-lg">
                  {Array.from({ length: 7 }, (_, i) => {
                    const weekStart = new Date(currentDate);
                    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + i);
                    const dayEvents = getEventsForDate(weekStart);
                    const isSelected = selectedDate && isEqual(weekStart, selectedDate);
                    
                    return (
                      <div
                        key={i}
                        onClick={() => handleDateClick(weekStart)}
                        className={`
                          bg-card border border-border p-4 min-h-32 rounded hover:bg-accent cursor-pointer transition-colors duration-200
                          ${isToday(weekStart) ? "bg-primary/10 border-primary/30" : ""}
                          ${isSelected ? "ring-2 ring-primary" : ""}
                        `}
                      >
                        <div className={`text-lg font-bold mb-2 ${isToday(weekStart) ? "text-primary" : "text-card-foreground"}`}>
                          {format(weekStart, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event, j) => {
                            const category = eventCategories.find(cat => cat.value === event.event_type);
                            return (
                              <div
                                key={j}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors duration-200
                                  ${category ? `${category.bgLight} dark:${category.bgDark} ${category.text} dark:${category.textDark}` : 'bg-muted text-muted-foreground'}
                                  hover:opacity-80
                                `}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Day View */}
            {view === 'day' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                  </h3>
                  {isToday(currentDate) && (
                    <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded mt-2 inline-block">
                      Today
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {getEventsForDate(currentDate).length > 0 ? (
                    getEventsForDate(currentDate).map((event) => {
                      const category = eventCategories.find(cat => cat.value === event.event_type);
                      return (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
                        >
                          <div className={`p-2 rounded-full ${category ? `${category.bgLight} dark:${category.bgDark}` : 'bg-muted'}`}>
                            <CalendarIcon className={`h-5 w-5 ${category ? `${category.text} dark:${category.textDark}` : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-card-foreground">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                            </p>
                            {event.location && (
                              <p className="text-sm text-muted-foreground">{event.location}</p>
                            )}
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No events scheduled for this day.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Events</h3>
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
                  <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="space-y-4 mt-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.slice(0, 5).map((event) => {
                      const category = eventCategories.find(cat => cat.value === event.event_type);
                      return (
                        <div key={event.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow duration-200 bg-card">
                          <div className={`p-2 rounded-full ${category ? `${category.bgLight} dark:${category.bgDark}` : 'bg-muted'}`}>
                            <CalendarIcon className={`h-5 w-5 ${category ? `${category.text} dark:${category.textDark}` : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-card-foreground">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.start_time), "MMMM d, yyyy - h:mm a")}
                            </p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 onClick={() => handleEventClick(event as any)}
                                 className="hover:bg-muted"
                               >
                                 <Eye className="h-3 w-3 mr-1" />
                                 View
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 onClick={() => handleEditEvent(event as any)}
                                 className="hover:bg-muted"
                               >
                                 <Edit className="h-3 w-3 mr-1" />
                                 Edit
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 onClick={() => {
                                   setSelectedEvent(event as any);
                                   handleDeleteEvent(event.id);
                                 }}
                                 className="text-destructive hover:text-destructive hover:bg-destructive/10"
                               >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No upcoming events.</p>
                  )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4 mt-4">
                  {pastEvents.length > 0 ? (
                    pastEvents.slice(0, 5).map((event) => {
                      const category = eventCategories.find(cat => cat.value === event.event_type);
                      return (
                        <div key={event.id} className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow duration-200 bg-card opacity-75">
                          <div className={`p-2 rounded-full ${category ? `${category.bgLight} dark:${category.bgDark}` : 'bg-muted'}`}>
                            <CalendarIcon className={`h-5 w-5 ${category ? `${category.text} dark:${category.textDark}` : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-card-foreground">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.start_time), "MMMM d, yyyy - h:mm a")}
                            </p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 onClick={() => handleEventClick(event as any)}
                                 className="hover:bg-muted"
                               >
                                 <Eye className="h-3 w-3 mr-1" />
                                 View
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 onClick={() => {
                                   setSelectedEvent(event as any);
                                   handleDeleteEvent(event.id);
                                 }}
                                 className="text-destructive hover:text-destructive hover:bg-destructive/10"
                               >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No past events.</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between hover:bg-muted" 
                  onClick={() => setShowEventForm(true)}
                >
                  <div className="flex items-center">
                    <Plus className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Add New Event</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" className="w-full justify-between hover:bg-muted">
                  <div className="flex items-center">
                    <Upload className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Import Events</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" className="w-full justify-between hover:bg-muted">
                  <div className="flex items-center">
                    <Download className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Export Calendar</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Event Categories</h3>
              <div className="space-y-3">
                {eventCategories.map((category) => {
                  const categoryCount = events?.filter(event => event.event_type === category.value).length || 0;
                  return (
                    <div key={category.value} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${category.color} rounded-full mr-3`}></div>
                        <span className="text-sm text-card-foreground">{category.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{categoryCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-card-foreground flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedEvent ? selectedEvent.title : `Events for ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}`}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Category Badge */}
              {selectedEvent.event_type && (
                <div className="flex justify-start">
                  {(() => {
                    const category = eventCategories.find(cat => cat.value === selectedEvent.event_type);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${category ? `${category.bgLight} dark:${category.bgDark} ${category.text} dark:${category.textDark}` : 'bg-muted text-muted-foreground'}
                      `}>
                        {selectedEvent.event_type.charAt(0).toUpperCase() + selectedEvent.event_type.slice(1)}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Event Description */}
              {selectedEvent.description && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-card-foreground leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Date & Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedEvent.start_time), "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedEvent.start_time), "h:mm a")} - {format(new Date(selectedEvent.end_time), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedEvent.target_audience && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">Target Audience</p>
                        <p className="text-sm text-muted-foreground">{selectedEvent.target_audience}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Visibility</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.visibility === 'public' ? "Public Event" : 
                         selectedEvent.visibility === 'users' ? "All Logged-in Users" : 
                         selectedEvent.visibility === 'internal' ? "Internal" : "Private Event"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={() => setShowEventDetails(false)} className="border-border">
                  Close
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleEditEvent(selectedEvent)}
                    className="border-border"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setShowEventDetails(false);
                      handleDeleteEvent(selectedEvent.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            selectedDate && (
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map((event) => (
                  <div key={event.id} className="p-3 border border-border rounded-lg bg-card">
                    <h4 className="font-medium text-card-foreground">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start_time), "h:mm a")}
                    </p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    )}
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-muted-foreground">No events scheduled for this day.</p>
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-card-foreground">Event Title</Label>
                <Input
                  {...register("title", { required: "Title is required" })}
                  placeholder="Enter event title"
                  className="bg-background border-border text-foreground"
                />
                {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="event_type" className="text-card-foreground">Category</Label>
                <Select onValueChange={(value) => setValue("event_type", value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {eventCategories.map(category => (
                      <SelectItem key={category.value} value={category.value} className="text-popover-foreground hover:bg-accent">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-card-foreground">Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Enter event description"
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-card-foreground">Location</Label>
              <Input
                {...register("location")}
                placeholder="Enter event location"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={isAllDayEdit}
                onCheckedChange={(checked) => setIsAllDayEdit(checked === true)}
              />
              <Label className="text-card-foreground">All-day Event</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-card-foreground">Start Date</Label>
                <Input
                  type="date"
                  {...register("start_date", { required: "Start date is required" })}
                  className="bg-background border-border text-foreground"
                />
                {errors.start_date && <p className="text-destructive text-sm mt-1">{errors.start_date.message}</p>}
              </div>
              <div>
                <Label htmlFor="start_time" className="text-card-foreground">Start Time</Label>
                 <Input
                   type="time"
                   {...register("start_time", { required: !isAllDayEdit && "Start time is required" })}
                   className="bg-background border-border text-foreground"
                   disabled={isAllDayEdit}
                 />
                {errors.start_time && <p className="text-destructive text-sm mt-1">{errors.start_time.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="end_date" className="text-card-foreground">End Date</Label>
                <Input
                  type="date"
                  {...register("end_date", { required: "End date is required" })}
                  className="bg-background border-border text-foreground"
                />
                {errors.end_date && <p className="text-destructive text-sm mt-1">{errors.end_date.message}</p>}
              </div>
              <div>
                <Label htmlFor="end_time" className="text-card-foreground">End Time</Label>
                 <Input
                   type="time"
                   {...register("end_time", { required: !isAllDayEdit && "End time is required" })}
                   className="bg-background border-border text-foreground"
                   disabled={isAllDayEdit}
                 />
                {errors.end_time && <p className="text-destructive text-sm mt-1">{errors.end_time.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="target_audience" className="text-card-foreground">Target Audience</Label>
              <Input
                {...register("target_audience")}
                placeholder="e.g., All residents, Youth, Seniors"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="visibility" className="text-card-foreground">Event Visibility</Label>
              <Select onValueChange={(value) => setValue("visibility", value)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {userProfile?.role === 'admin' && (
                    <SelectItem value="internal" className="text-popover-foreground hover:bg-accent">Internal</SelectItem>
                  )}
                  <SelectItem value="users" className="text-popover-foreground hover:bg-accent">All Logged-in Users</SelectItem>
                  <SelectItem value="public" className="text-popover-foreground hover:bg-accent">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)} className="border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the event "{selectedEvent?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarPage;
