import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Event } from "@/pages/CalendarPage";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventFormProps {
  event?: Event;
  selectedDate?: Date;
  onClose: () => void;
  onSubmit: () => void;
}

const EventForm = ({ event, selectedDate, onClose, onSubmit }: EventFormProps) => {
  const defaultDate = selectedDate || new Date();
  const defaultStartTime = new Date(defaultDate);
  defaultStartTime.setHours(9, 0, 0);
  const defaultEndTime = new Date(defaultDate);
  defaultEndTime.setHours(17, 0, 0);
  
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [startDate, setStartDate] = useState<Date>(
    event?.start_time ? new Date(event.start_time) : defaultStartTime
  );
  const [eventEndDate, setEventEndDate] = useState<Date>(
    event?.end_time ? new Date(event.end_time) : defaultEndTime
  );
  const [eventType, setEventType] = useState(event?.event_type || "meeting");
  const [targetAudience, setTargetAudience] = useState(event?.target_audience || "All");
  const [visibility, setVisibility] = useState(event?.visibility || "public");
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(event?.is_recurring || event?.reccuring || false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [interval, setInterval] = useState(1);
  const [endType, setEndType] = useState<'never' | 'after' | 'on'>('never');
  const [occurrences, setOccurrences] = useState(10);
  const [endDate, setRecurrenceEndDate] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [yearMonths, setYearMonths] = useState<number[]>([]);
  const [yearDays, setYearDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // If all-day is detected, set the switch
  useEffect(() => {
    if (event?.start_time && event?.end_time) {
      const startTime = new Date(event.start_time);
      const endTime = new Date(event.end_time);
      
      if (
        startTime.getHours() === 0 && 
        startTime.getMinutes() === 0 && 
        endTime.getHours() === 23 && 
        endTime.getMinutes() === 59
      ) {
        setIsAllDay(true);
      }
    }
  }, [event]);
  
  // Handle all-day checkbox change
  useEffect(() => {
    if (isAllDay) {
      const newStartDate = new Date(startDate);
      newStartDate.setHours(0, 0, 0);
      setStartDate(newStartDate);
      
      const newEndDate = new Date(startDate);
      newEndDate.setHours(23, 59, 0);
      setEventEndDate(newEndDate);
    }
  }, [isAllDay, startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Get the user session to get the user ID
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      // If there's no user ID, use a placeholder value or handle accordingly
      const createdBy = userId || "00000000-0000-0000-0000-000000000000";
      
      // Get the user's barangay ID from their profile
      const brgyid = userProfile?.brgyid || "00000000-0000-0000-0000-000000000000";
      
      let startTime: string;
      let endTime: string;

      if (isAllDay) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        startTime = startOfDay.toISOString();
        endTime = endOfDay.toISOString();
      } else {
        startTime = startDate.toISOString();
        endTime = eventEndDate.toISOString();
      }

      // Generate RRULE for recurring events
      let rrule = null;
      if (isRecurring) {
        const freqMap = {
          daily: 'DAILY',
          weekly: 'WEEKLY', 
          monthly: 'MONTHLY',
          yearly: 'YEARLY'
        };
        
        let rruleString = `FREQ=${freqMap[frequency]}`;
        
        if (interval > 1) {
          rruleString += `;INTERVAL=${interval}`;
        }
        
        // Add BYDAY for weekly events with selected days
        if (frequency === 'weekly' && selectedDays.length > 0) {
          rruleString += `;BYDAY=${selectedDays.join(',')}`;
        }
        
        // Add BYMONTHDAY for monthly events
        if (frequency === 'monthly' && monthDays.length > 0) {
          rruleString += `;BYMONTHDAY=${monthDays.join(',')}`;
        }
        
        // Add BYMONTH and BYMONTHDAY for yearly events
        if (frequency === 'yearly') {
          if (yearMonths.length > 0) {
            rruleString += `;BYMONTH=${yearMonths.join(',')}`;
          }
          if (yearDays.length > 0) {
            rruleString += `;BYMONTHDAY=${yearDays.join(',')}`;
          }
        }
        
        if (endType === 'after') {
          rruleString += `;COUNT=${occurrences}`;
        } else if (endType === 'on') {
          const formattedEndDate = eventEndDate.toISOString().split('T')[0].replace(/-/g, '');
          rruleString += `;UNTIL=${formattedEndDate}T235959Z`;
        }
        
        rrule = rruleString;
      }

      const eventData = {
        title,
        description,
        location,
        start_time: startTime,
        end_time: endTime,
        event_type: eventType,
        target_audience: targetAudience,
        visibility: visibility,
        created_by: createdBy,
        brgyid: brgyid,
        reccuring: isRecurring,
        rrule: rrule
      };
      
      let response;
      
      if (event?.id) {
        // Update existing event
        response = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);
      } else {
        // Create new event
        response = await supabase
          .from('events')
          .insert(eventData);
      }

      const { error } = response;
      
      if (error) throw error;
      
      toast({
        title: event?.id ? "Event updated" : "Event created",
        description: event?.id 
          ? "Your event has been updated successfully."
          : "Your event has been created successfully."
      });
      
      onSubmit();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Failed to save the event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter event location"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="all-day"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
              />
              <Label htmlFor="all-day">All-day event</Label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[130px] justify-start text-left font-normal"
                      >
                        {format(startDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(new Date(date))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {!isAllDay && (
                    <TimePicker
                      value={startDate}
                      onChange={setStartDate}
                      className="w-[110px]"
                    />
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[130px] justify-start text-left font-normal"
                      >
                        {format(eventEndDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                         selected={eventEndDate}
                         onSelect={(date) => date && setEventEndDate(new Date(date))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {!isAllDay && (
                    <TimePicker
                      value={eventEndDate}
                      onChange={setEventEndDate}
                      className="w-[110px]"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="target-audience">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="SK Youth">SK Youth</SelectItem>
                    <SelectItem value="Officials only">Officials only</SelectItem>
                    <SelectItem value="Senior Citizens">Senior Citizens</SelectItem>
                    <SelectItem value="PWD">PWD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="visibility">Event Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  {userProfile?.role === 'admin' && (
                    <SelectItem value="internal">Internal</SelectItem>
                  )}
                  <SelectItem value="users">All Logged-in Users</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="recurring">Recurring event</Label>
            </div>

            {isRecurring && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium text-sm">Recurrence Settings</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="frequency">Repeat</Label>
                    <Select value={frequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setFrequency(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {frequency === 'weekly' && (
                  <div>
                    <Label htmlFor="days">Repeat on</Label>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                      {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day, index) => {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const isSelected = selectedDays.includes(day);
                        return (
                          <Button
                            key={day}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 p-0 text-xs ${
                              isSelected 
                                ? "" 
                                : ""
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDays(selectedDays.filter(d => d !== day));
                              } else {
                                setSelectedDays([...selectedDays, day]);
                              }
                            }}
                            title={dayNames[index]}
                          >
                            {day}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {frequency === 'monthly' && (
                  <div>
                    <Label htmlFor="month-days">Days of month</Label>
                    <div className="grid grid-cols-7 gap-1 mt-2">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const isSelected = monthDays.includes(day);
                        return (
                          <Button
                            key={day}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`h-8 w-8 p-0 text-xs ${
                              isSelected 
                                ? "" 
                                : ""
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setMonthDays(monthDays.filter(d => d !== day));
                              } else {
                                setMonthDays([...monthDays, day]);
                              }
                            }}
                          >
                            {day}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {frequency === 'yearly' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="year-months">Months</Label>
                      <div className="grid grid-cols-3 gap-1 mt-2">
                        {[
                          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ].map((month, index) => {
                          const monthNumber = index + 1;
                          const isSelected = yearMonths.includes(monthNumber);
                          return (
                            <Button
                              key={monthNumber}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`h-8 text-xs ${
                                isSelected 
                                  ? "" 
                                  : ""
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setYearMonths(yearMonths.filter(m => m !== monthNumber));
                                } else {
                                  setYearMonths([...yearMonths, monthNumber]);
                                }
                              }}
                            >
                              {month}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="year-days">Days of month</Label>
                      <div className="grid grid-cols-7 gap-1 mt-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                          const isSelected = yearDays.includes(day);
                          return (
                            <Button
                              key={day}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`h-8 w-8 p-0 text-xs ${
                                isSelected 
                                  ? "" 
                                  : ""
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setYearDays(yearDays.filter(d => d !== day));
                                } else {
                                  setYearDays([...yearDays, day]);
                                }
                              }}
                            >
                              {day}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="end-type">Ends</Label>
                  <Select value={endType} onValueChange={(value: 'never' | 'after' | 'on') => setEndType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="after">After a number of occurrences</SelectItem>
                      <SelectItem value="on">On the end date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {endType === 'after' && (
                  <div>
                    <Label htmlFor="occurrences">Number of occurrences</Label>
                    <Input
                      id="occurrences"
                      type="number"
                      min="1"
                      max="365"
                      value={occurrences}
                      onChange={(e) => setOccurrences(parseInt(e.target.value) || 1)}
                      className=""
                    />
                  </div>
                )}

                {endType === 'on' && (
                  <div>
                    <Label>End date</Label>
                    <div className="text-sm text-muted-foreground p-2 border rounded">
                      Will end on: {format(eventEndDate, "PPP")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className=""
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className=""
            >
              {isLoading ? "Saving..." : event?.id ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;
