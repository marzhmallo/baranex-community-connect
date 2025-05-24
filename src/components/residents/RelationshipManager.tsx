
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Users, Check, ChevronsUpDown } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { 
  getResidentRelationships, 
  addRelationship, 
  deleteRelationship, 
  searchResidentsForRelationship,
  type Relationship 
} from '@/lib/api/relationships';
import { cn } from "@/lib/utils";

interface RelationshipManagerProps {
  residentId: string;
  residentName: string;
}

const RELATIONSHIP_TYPES = [
  'Father', 'Mother', 'Parent', 'Child', 'Son', 'Daughter',
  'Brother', 'Sister', 'Sibling', 'Husband', 'Wife', 'Spouse',
  'Grandfather', 'Grandmother', 'Grandchild', 'Grandson', 'Granddaughter',
  'Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin'
];

const RelationshipManager = ({ residentId, residentName }: RelationshipManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch relationships
  const { data: relationshipsResult, isLoading: relationshipsLoading } = useQuery({
    queryKey: ['relationships', residentId],
    queryFn: () => getResidentRelationships(residentId),
  });

  // Search residents
  const { data: searchResults } = useQuery({
    queryKey: ['search-residents-relationship', searchTerm, residentId],
    queryFn: () => searchResidentsForRelationship(searchTerm, residentId),
    enabled: searchTerm.length >= 2,
  });

  const relationships = relationshipsResult?.data || [];

  const handleAddRelationship = async () => {
    if (!selectedResident || !selectedRelationship) {
      toast.error('Please select both a resident and relationship type');
      return;
    }

    setIsLoading(true);
    try {
      const result = await addRelationship(residentId, selectedResident.id, selectedRelationship);
      
      if (result.success) {
        toast.success('Relationship added successfully');
        queryClient.invalidateQueries({ queryKey: ['relationships', residentId] });
        setIsAddDialogOpen(false);
        setSelectedResident(null);
        setSelectedRelationship('');
        setSearchTerm('');
      } else {
        toast.error(result.error || 'Failed to add relationship');
      }
    } catch (error) {
      toast.error('An error occurred while adding the relationship');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to delete this relationship?')) return;

    try {
      const result = await deleteRelationship(relationshipId);
      
      if (result.success) {
        toast.success('Relationship deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['relationships', residentId] });
      } else {
        toast.error(result.error || 'Failed to delete relationship');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the relationship');
    }
  };

  const getRelationshipColor = (type: string) => {
    const lowercaseType = type.toLowerCase();
    if (['father', 'mother', 'parent'].includes(lowercaseType)) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (['child', 'son', 'daughter'].includes(lowercaseType)) return 'bg-green-100 text-green-800 border-green-200';
    if (['brother', 'sister', 'sibling'].includes(lowercaseType)) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (['husband', 'wife', 'spouse'].includes(lowercaseType)) return 'bg-red-100 text-red-800 border-red-200';
    if (['grandfather', 'grandmother', 'grandchild', 'grandson', 'granddaughter'].includes(lowercaseType)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Family Relationships
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Relationship
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Family Relationship</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Resident</label>
                  <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedResident ? selectedResident.full_name : "Search and select resident..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search residents..." 
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {searchTerm.length < 2 ? "Type at least 2 characters to search" : "No residents found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {searchResults?.data?.map((resident) => (
                              <CommandItem
                                key={resident.id}
                                value={resident.full_name}
                                onSelect={() => {
                                  setSelectedResident(resident);
                                  setIsSearchOpen(false);
                                  setSearchTerm('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedResident?.id === resident.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div className="font-medium">{resident.full_name}</div>
                                  <div className="text-sm text-gray-500">Purok {resident.purok}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Relationship Type</label>
                  <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {selectedResident ? `${residentName} is ${selectedResident.full_name}'s ${type}` : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRelationship} disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Relationship'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {relationshipsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading relationships...</div>
          </div>
        ) : relationships.length > 0 ? (
          <div className="space-y-3">
            {relationships.map((relationship: Relationship) => (
              <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className={getRelationshipColor(relationship.relationship_type)}>
                    {relationship.relationship_type}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {relationship.related_resident?.first_name} {relationship.related_resident?.middle_name && `${relationship.related_resident.middle_name} `}{relationship.related_resident?.last_name} {relationship.related_resident?.suffix || ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {residentName} is {relationship.related_resident?.first_name}'s {relationship.relationship_type}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRelationship(relationship.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No relationships found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add family relationships to connect this resident with others.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RelationshipManager;
