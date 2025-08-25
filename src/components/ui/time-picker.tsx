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

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleTimeChange = (hour: number, minute: number) => {
    const newDate = new Date(value);
    newDate.setHours(hour, minute, 0, 0);
    onChange(newDate);
    setIsOpen(false);
  };

  const currentHour = value.getHours();
  const currentMinute = value.getMinutes();

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
          {format(value, "HH:mm")}
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
                    variant={currentHour === hour ? "default" : "ghost"}
                    size="sm"
                    className="w-full h-8 justify-center text-sm mb-1"
                    onClick={() => handleTimeChange(hour, currentMinute)}
                  >
                    {hour.toString().padStart(2, '0')}
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
                    onClick={() => handleTimeChange(currentHour, minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}