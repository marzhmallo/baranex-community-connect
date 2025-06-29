
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchResidents } from "@/lib/api/households";

interface Resident {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  purok: string;
  full_name: string;
}

interface HeadOfFamilyInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onResidentSelect: (residentId: string | null) => void;
  selectedResidentId?: string | null;
  placeholder?: string;
}

const HeadOfFamilyInput: React.FC<HeadOfFamilyInputProps> = ({
  value,
  onValueChange,
  onResidentSelect,
  selectedResidentId,
  placeholder = "Enter head of family name or search residents..."
}) => {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchForResidents = async () => {
      if (value && value.length >= 2) {
        setIsLoading(true);
        const result = await searchResidents(value);
        if (result.success) {
          setSearchResults(result.data);
        }
        setIsLoading(false);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchForResidents, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleResidentSelect = (resident: Resident) => {
    onValueChange(resident.full_name);
    onResidentSelect(resident.id);
    setOpen(false);
    // Keep focus on input after selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleInputChange = (newValue: string) => {
    onValueChange(newValue);
    // If user is typing freely, clear any selected resident
    if (selectedResidentId) {
      onResidentSelect(null);
    }
    if (newValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleClearSelection = () => {
    onValueChange("");
    onResidentSelect(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (value.length >= 2) {
      setOpen(true);
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value.length >= 2) {
      setOpen(true);
    }
  };

  // Ensure input stays focused when popover opens
  const handlePopoverOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Use a longer timeout to ensure the popover is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle focus restoration when popover content is mounted
  useEffect(() => {
    if (open) {
      // Ensure focus is maintained when popover opens
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              onClick={handleInputClick}
              placeholder={placeholder}
              className={cn(
                "w-full pr-20",
                selectedResidentId && "border-green-500 bg-green-50 dark:bg-green-950"
              )}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {selectedResidentId && (
                <User className="h-4 w-4 text-green-600" />
              )}
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0" 
          align="start" 
          side="bottom" 
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            // Prevent the popover from stealing focus
            e.preventDefault();
            // Ensure input keeps focus
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Searching residents...</CommandEmpty>
              ) : searchResults.length === 0 ? (
                <CommandEmpty>
                  {value.length >= 2 ? "No residents found. Text will be saved as entered." : "Type to search residents..."}
                </CommandEmpty>
              ) : (
                <CommandGroup heading="Registered Residents">
                  {searchResults.map((resident) => (
                    <CommandItem
                      key={resident.id}
                      value={resident.full_name}
                      onSelect={() => handleResidentSelect(resident)}
                      className="flex items-center justify-between cursor-pointer"
                      onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                    >
                      <div>
                        <div className="font-medium">{resident.full_name}</div>
                        <div className="text-sm text-muted-foreground">Purok {resident.purok}</div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedResidentId === resident.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default HeadOfFamilyInput;
