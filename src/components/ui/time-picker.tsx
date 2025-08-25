import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleTimeChange = (hour12: number, minute: number, isPM: boolean) => {
    const newDate = new Date(value);
    const hour24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
    newDate.setHours(hour24, minute, 0, 0);
    onChange(newDate);
    setIsOpen(false);
  };

  const currentHour24 = value.getHours();
  const currentMinute = value.getMinutes();
  const currentHour12 = currentHour24 === 0 ? 12 : currentHour24 > 12 ? currentHour24 - 12 : currentHour24;
  const currentPeriod = currentHour24 >= 12 ? 'PM' : 'AM';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {format(value, "h:mm a")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col">
            <div className="p-2 text-sm font-medium text-center border-b">Hours</div>
            <ScrollArea className="h-48 w-16">
              <div className="p-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    variant={currentHour12 === hour ? "default" : "ghost"}
                    size="sm"
                    className="w-full h-8 justify-center text-sm mb-1"
                    onClick={() => handleTimeChange(hour, currentMinute, currentPeriod === 'PM')}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex flex-col border-l">
            <div className="p-2 text-sm font-medium text-center border-b">Minutes</div>
            <ScrollArea className="h-48 w-16">
              <div className="p-1">
                {minutes.filter(m => m % 5 === 0).map((minute) => (
                  <Button
                    key={minute}
                    variant={currentMinute === minute ? "default" : "ghost"}
                    size="sm"
                    className="w-full h-8 justify-center text-sm mb-1"
                    onClick={() => handleTimeChange(currentHour12, minute, currentPeriod === 'PM')}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="flex flex-col border-l">
            <div className="p-2 text-sm font-medium text-center border-b">Period</div>
            <div className="p-1 space-y-1">
              <Button
                variant={currentPeriod === 'AM' ? "default" : "ghost"}
                size="sm"
                className="w-full h-8 justify-center text-sm"
                onClick={() => handleTimeChange(currentHour12, currentMinute, false)}
              >
                AM
              </Button>
              <Button
                variant={currentPeriod === 'PM' ? "default" : "ghost"}
                size="sm"
                className="w-full h-8 justify-center text-sm"
                onClick={() => handleTimeChange(currentHour12, currentMinute, true)}
              >
                PM
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}