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
import { Event } from "@/pages/CalendarPage";
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
  const [endDate, setEndDate] = useState<Date>(
    event?.end_time ? new Date(event.end_time) : defaultEndTime
  );
  const [eventType, setEventType] = useState(event?.event_type || "meeting");
  const [targetAudience, setTargetAudience] = useState(event?.target_audience || "All");
  const [isPublic, setIsPublic] = useState(event?.is_public !== false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      setEndDate(newEndDate);
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
      
      const eventData = {
        title,
        description,
        location,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        event_type: eventType,
        target_audience: targetAudience,
        is_public: isPublic,
        created_by: createdBy  // Add the created_by field
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
      <DialogContent className="sm:max-w-[600px] bg-[#0f1623] text-white border-gray-800">
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
                className="bg-[#171f2e] border-gray-700"
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
                className="bg-[#171f2e] border-gray-700"
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
                className="bg-[#171f2e] border-gray-700"
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
                        className="w-full justify-start text-left font-normal bg-[#171f2e] border-gray-700"
                      >
                        {format(startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#171f2e] border-gray-700">
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
                    <Input
                      type="time"
                      value={format(startDate, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = new Date(startDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setStartDate(newDate);
                      }}
                      className="w-24 bg-[#171f2e] border-gray-700"
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
                        className="w-full justify-start text-left font-normal bg-[#171f2e] border-gray-700"
                      >
                        {format(endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#171f2e] border-gray-700">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(new Date(date))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {!isAllDay && (
                    <Input
                      type="time"
                      value={format(endDate, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = new Date(endDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setEndDate(newDate);
                      }}
                      className="w-24 bg-[#171f2e] border-gray-700"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="bg-[#171f2e] border-gray-700">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171f2e] border-gray-700">
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
                  <SelectTrigger className="bg-[#171f2e] border-gray-700">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171f2e] border-gray-700">
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="SK Youth">SK Youth</SelectItem>
                    <SelectItem value="Officials only">Officials only</SelectItem>
                    <SelectItem value="Senior Citizens">Senior Citizens</SelectItem>
                    <SelectItem value="PWD">PWD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="is-public">Make this event public</Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
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
