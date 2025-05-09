
import { useState, useEffect } from "react";
import { format, isToday, isEqual, isSameMonth, parse } from "date-fns";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import EventCard from "@/components/calendar/EventCard";
import EventForm from "@/components/calendar/EventForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
};

const eventCategories = [
  { value: "all", label: "All Categories" },
  { value: "meeting", label: "Meeting" },
  { value: "health", label: "Health" },
  { value: "environment", label: "Environment" },
  { value: "education", label: "Education" },
  { value: "social", label: "Social" }
];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  // Fetch events from Supabase
  const { data: events, isLoading, refetch } = useQuery({
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

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    
    return events.filter((event: Event) => {
      const eventDate = new Date(event.start_time);
      const sameDay = eventDate.getDate() === date.getDate() &&
                      eventDate.getMonth() === date.getMonth() &&
                      eventDate.getFullYear() === date.getFullYear();
      
      return sameDay && (selectedCategory === "all" || event.event_type === selectedCategory);
    });
  };

  // Get events for selected date
  const selectedDateEvents = getEventsForDate(selectedDate);

  // Calendar grid generation
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    
    const days = [];
    
    // Add previous month's days
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        events: getEventsForDate(prevMonthDay)
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDay = new Date(year, month, i);
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        events: getEventsForDate(currentDay)
      });
    }
    
    // Add next month's days to complete the grid (42 days total for 6 rows)
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
  
  const handleEventFormSubmit = async () => {
    await refetch();
    setShowEventForm(false);
  };

  return (
    <div className="bg-[#0a0e17] text-white min-h-screen p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="ml-2">
            <h1 className="text-2xl font-bold">Events Calendar</h1>
            <p className="text-gray-400">View and manage barangay events and activities</p>
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="flex justify-between">
          <div className="w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
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
          
          <Button onClick={() => setShowEventForm(true)} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar */}
          <Card className="col-span-1 lg:col-span-5 bg-[#0f1623] border-gray-800">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">Calendar</h2>
              <p className="text-gray-400 text-sm mb-4">Select a date to view events</p>

              {/* Month Navigation */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {format(currentDate, "MMMM yyyy")}
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday Headers */}
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center p-2 text-sm font-medium text-gray-400">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {isLoading ? (
                  // Loading skeleton
                  Array(35).fill(0).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-md bg-gray-800" />
                  ))
                ) : (
                  // Calendar days
                  calendarDays.map((day, index) => {
                    const isSelected = isEqual(day.date, selectedDate);
                    const hasEvents = day.events.length > 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(day.date)}
                        className={`
                          p-1 h-12 relative rounded-md transition-colors
                          ${!day.isCurrentMonth ? "text-gray-600" : ""}
                          ${isToday(day.date) ? "bg-blue-900/30 font-bold text-blue-400" : ""}
                          ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-800"}
                        `}
                      >
                        <div className="text-xs">{format(day.date, "d")}</div>
                        {hasEvents && (
                          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                            {day.events.slice(0, 3).map((event, i) => (
                              <span 
                                key={i} 
                                className={`
                                  w-1.5 h-1.5 rounded-full
                                  ${event.event_type === "meeting" ? "bg-blue-500" : ""}
                                  ${event.event_type === "health" ? "bg-red-500" : ""}
                                  ${event.event_type === "environment" ? "bg-green-500" : ""}
                                  ${event.event_type === "education" ? "bg-yellow-500" : ""}
                                  ${event.event_type === "social" ? "bg-purple-500" : ""}
                                  ${!event.event_type ? "bg-gray-500" : ""}
                                `}
                              />
                            ))}
                            {day.events.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{day.events.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <div className="col-span-1 lg:col-span-7">
            <h2 className="text-xl font-bold mb-4">
              Events for {format(selectedDate, "MMMM d, yyyy")}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? "event" : "events"} scheduled
            </p>

            {isLoading ? (
              // Loading skeleton for events
              Array(3).fill(0).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full mb-4 rounded-md bg-gray-800" />
              ))
            ) : selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEventUpdated={refetch} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No events scheduled for this day.</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm 
          selectedDate={selectedDate}
          onClose={() => setShowEventForm(false)} 
          onSubmit={handleEventFormSubmit}
        />
      )}
    </div>
  );
};

export default CalendarPage;
