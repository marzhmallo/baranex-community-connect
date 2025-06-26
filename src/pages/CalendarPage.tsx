
import { useState, useEffect } from "react";
import { format, isToday, isEqual, isSameMonth, parse, addDays, subDays, addMonths, subMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Download, Upload, Edit, Trash2, X, Clock, MapPin, Users, Repeat, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

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
  is_public: boolean;
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
  is_public: boolean;
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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      is_public: true,
      is_recurring: false,
      recurrence_pattern: 'weekly',
      reminder_enabled: false,
      reminder_time: 30
    }
  });

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
      const startDateTime = new Date(`${eventData.start_date}T${eventData.start_time}`);
      const endDateTime = new Date(`${eventData.end_date}T${eventData.end_time}`);

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
          is_public: eventData.is_public,
          brgyid: 'default-brgy-id', // Replace with actual brgy ID
          created_by: 'current-user-id' // Replace with actual user ID
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventForm(false);
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
    
    return events.filter((event: Event) => {
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
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
  const upcomingEvents = events?.slice(0, 3) || [];

  return (
    <div className="w-[1200px] mx-auto p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
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
                          {...register("start_time", { required: "Start time is required" })}
                          className="bg-background border-border text-foreground"
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
                          {...register("end_time", { required: "End time is required" })}
                          className="bg-background border-border text-foreground"
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

                    <div className="flex items-center space-x-2">
                      <Checkbox {...register("is_public")} />
                      <Label className="text-card-foreground">Public Event</Label>
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
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-card-foreground mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
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
                            onClick={() => handleEventClick(event)}
                            className="hover:bg-muted"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteEventMutation.mutate(event.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

      {/* Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">
              {selectedEvent ? selectedEvent.title : `Events for ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}`}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-card-foreground">
                  {format(new Date(selectedEvent.start_time), "h:mm a")} - {format(new Date(selectedEvent.end_time), "h:mm a")}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-card-foreground">{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.target_audience && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-card-foreground">{selectedEvent.target_audience}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEventDetails(false)} className="border-border">
                  Close
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                >
                  Delete Event
                </Button>
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
    </div>
  );
};

export default CalendarPage;
