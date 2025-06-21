
import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalendarView from "@/components/calendar/CalendarView";
import EventForm from "@/components/calendar/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CalendarPage = () => {
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (showEventForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold">Calendar Management</h1>
            <p className="text-muted-foreground">Schedule and manage barangay events and activities</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <EventForm 
              onSuccess={() => setShowEventForm(false)}
              initialDate={selectedDate}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold">Calendar Management</h1>
          <p className="text-muted-foreground">Schedule and manage barangay events and activities</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowEventForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <CalendarView 
        onDateSelect={(date) => {
          setSelectedDate(date);
          setShowEventForm(true);
        }}
      />
    </div>
  );
};

export default CalendarPage;
