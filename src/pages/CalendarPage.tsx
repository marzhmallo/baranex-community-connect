
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
  { value: "meeting", label: "Meetings", color: "bg-blue-500" },
  { value: "health", label: "Health", color: "bg-green-500" },
  { value: "sports", label: "Sports", color: "bg-purple-500" },
  { value: "holiday", label: "Holidays", color: "bg-red-500" },
  { value: "education", label: "Education", color: "bg-yellow-500" },
  { value: "social", label: "Social", color: "bg-pink-500" }
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
    <div className="w-[1200px] mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-primary text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Barangay Calendar</h1>
                <p className="text-primary-foreground/80 mt-1">Manage community events and activities</p>
              </div>
              <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-primary hover:bg-gray-50">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                          {...register("title", { required: "Title is required" })}
                          placeholder="Enter event title"
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="event_type">Category</Label>
                        <Select onValueChange={(value) => setValue("event_type", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventCategories.map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        {...register("description")}
                        placeholder="Enter event description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        {...register("location")}
                        placeholder="Enter event location"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          type="date"
                          {...register("start_date", { required: "Start date is required" })}
                        />
                        {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          type="time"
                          {...register("start_time", { required: "Start time is required" })}
                        />
                        {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          type="date"
                          {...register("end_date", { required: "End date is required" })}
                        />
                        {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          type="time"
                          {...register("end_time", { required: "End time is required" })}
                        />
                        {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="target_audience">Target Audience</Label>
                      <Input
                        {...register("target_audience")}
                        placeholder="e.g., All residents, Youth, Seniors"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox {...register("is_public")} />
                      <Label>Public Event</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox {...register("is_recurring")} />
                      <Label>Recurring Event</Label>
                    </div>

                    {watch("is_recurring") && (
                      <div>
                        <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                        <Select onValueChange={(value) => setValue("recurrence_pattern", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select recurrence" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox {...register("reminder_enabled")} />
                      <Label>Enable Reminders</Label>
                    </div>

                    {watch("reminder_enabled") && (
                      <div>
                        <Label htmlFor="reminder_time">Reminder Time (minutes before)</Label>
                        <Input
                          type="number"
                          {...register("reminder_time")}
                          placeholder="30"
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowEventForm(false)}>
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

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-800">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={view === 'month' ? 'default' : 'ghost'} 
                  onClick={() => setView('month')}
                >
                  Month
                </Button>
                <Button 
                  variant={view === 'week' ? 'default' : 'ghost'} 
                  onClick={() => setView('week')}
                >
                  Week
                </Button>
                <Button 
                  variant={view === 'day' ? 'default' : 'ghost'} 
                  onClick={() => setView('day')}
                >
                  Day
                </Button>
              </div>
            </div>

            {/* Calendar Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-sm font-semibold text-gray-500 text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 bg-gray-100 p-1 rounded-lg">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDate && isEqual(day.date, selectedDate);
                const hasEvents = day.events.length > 0;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day.date)}
                    className={`
                      bg-white p-2 min-h-24 rounded hover:bg-gray-50 cursor-pointer transition-colors duration-200
                      ${!day.isCurrentMonth ? "text-gray-400" : ""}
                      ${isToday(day.date) ? "bg-primary/10" : ""}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                    `}
                  >
                    <div className={`text-sm ${isToday(day.date) ? "font-bold text-primary" : "font-semibold"}`}>
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
                              className={`text-xs px-2 py-1 rounded truncate cursor-pointer
                                ${category?.value === 'meeting' ? 'bg-blue-100 text-blue-800' : ''}
                                ${category?.value === 'health' ? 'bg-green-100 text-green-800' : ''}
                                ${category?.value === 'sports' ? 'bg-purple-100 text-purple-800' : ''}
                                ${category?.value === 'holiday' ? 'bg-red-100 text-red-800' : ''}
                                ${!category ? 'bg-gray-100 text-gray-800' : ''}
                              `}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500">+{day.events.length - 2} more</div>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const category = eventCategories.find(cat => cat.value === event.event_type);
                  return (
                    <div key={event.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                      <div className={`p-2 rounded-full ${category?.value === 'meeting' ? 'bg-blue-100' : category?.value === 'health' ? 'bg-green-100' : category?.value === 'sports' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                        <CalendarIcon className={`h-5 w-5 ${category?.value === 'meeting' ? 'text-blue-600' : category?.value === 'health' ? 'text-green-600' : category?.value === 'sports' ? 'text-purple-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(event.start_time), "MMMM d, yyyy - h:mm a")}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEventClick(event)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteEventMutation.mutate(event.id)}
                            className="text-red-600 hover:text-red-800"
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between" 
                  onClick={() => setShowEventForm(true)}
                >
                  <div className="flex items-center">
                    <Plus className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Add New Event</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Upload className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Import Events</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Download className="mr-3 h-4 w-4 text-primary" />
                    <span className="font-medium">Export Calendar</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Event Categories</h3>
              <div className="space-y-3">
                {eventCategories.map((category) => {
                  const categoryCount = events?.filter(event => event.event_type === category.value).length || 0;
                  return (
                    <div key={category.value} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${category.color} rounded-full mr-3`}></div>
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <span className="text-sm text-gray-500">{categoryCount}</span>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? selectedEvent.title : `Events for ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}`}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(new Date(selectedEvent.start_time), "h:mm a")} - {format(new Date(selectedEvent.end_time), "h:mm a")}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.target_audience && (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedEvent.target_audience}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEventDetails(false)}>
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
                  <div key={event.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(event.start_time), "h:mm a")}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-500">{event.location}</p>
                    )}
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500">No events scheduled for this day.</p>
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
