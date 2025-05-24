
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, User } from "lucide-react";
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
  };

  const handleInputChange = (newValue: string) => {
    onValueChange(newValue);
    // If user is typing freely, clear any selected resident
    if (selectedResidentId) {
      onResidentSelect(null);
    }
    if (newValue.length >= 2) {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full",
              selectedResidentId && "border-green-500 bg-green-50"
            )}
          />
          {selectedResidentId && (
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
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
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{resident.full_name}</div>
                      <div className="text-sm text-gray-500">Purok {resident.purok}</div>
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
  );
};

export default HeadOfFamilyInput;
