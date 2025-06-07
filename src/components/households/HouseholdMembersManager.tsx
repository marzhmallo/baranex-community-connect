
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HouseholdMembersManagerProps {
  householdId: string;
  householdName: string;
}

const HouseholdMembersManager = ({ householdId, householdName }: HouseholdMembersManagerProps) => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current household members
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ['household-members', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          first_name,
          middle_name,
          last_name,
          suffix,
          photo_url,
          status,
          purok,
          gender,
          birthdate
        `)
        .eq('household_id', householdId)
        .order('first_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Search for residents to add
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search directly in the residents table
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          first_name,
          middle_name,
          last_name,
          suffix,
          photo_url,
          status,
          purok,
          gender,
          birthdate
        `)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,middle_name.ilike.%${term}%`)
        .is('household_id', null) // Only show residents not already in a household
        .order('first_name');

      if (error) {
        console.error('Error searching residents:', error);
        toast({
          title: "Search error",
          description: "Failed to search for residents.",
          variant: "destructive",
        });
        return;
      }

      // Format the results to include full_name for display
      const formattedResults = data?.map(resident => ({
        ...resident,
        full_name: `${resident.first_name} ${resident.middle_name ? resident.middle_name + ' ' : ''}${resident.last_name}${resident.suffix ? ' ' + resident.suffix : ''}`
      })) || [];

      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching residents:', error);
      toast({
        title: "Search error",
        description: "An unexpected error occurred while searching.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add resident to household
  const handleAddMember = async (residentId: string) => {
    try {
      const { error } = await supabase
        .from('residents')
        .update({ household_id: householdId })
        .eq('id', residentId);

      if (error) throw error;

      toast({
        title: "Member added successfully",
        description: "The resident has been added to this household.",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['household-members', householdId] });
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
      
      // Clear search and close dialog
      setSearchTerm('');
      setSearchResults([]);
      setIsAddMemberOpen(false);
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Remove resident from household
  const handleRemoveMember = async (residentId: string, residentName: string) => {
    try {
      const { error } = await supabase
        .from('residents')
        .update({ household_id: null })
        .eq('id', residentId);

      if (error) throw error;

      toast({
        title: "Member removed successfully",
        description: `${residentName} has been removed from this household.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['household-members', householdId] });
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-2">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <h2 className="text-xl font-semibold">Household Members</h2>
          </div>
          
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Member to {householdName}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search residents by name..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {isSearching && (
                  <p className="text-sm text-gray-500">Searching...</p>
                )}
                
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {searchResults.map((resident) => (
                      <div
                        key={resident.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={resident.photo_url} />
                            <AvatarFallback>
                              {resident.first_name.charAt(0)}{resident.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{resident.full_name}</p>
                            <p className="text-sm text-gray-500">Purok {resident.purok}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(resident.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                    
                    {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No available residents found matching your search. All residents may already be assigned to households.
                      </p>
                    )}
                    
                    {searchTerm.length < 2 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Type at least 2 characters to search for residents.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isMembersLoading ? (
          <p className="text-center py-10">Loading members...</p>
        ) : members && members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={member.photo_url} />
                    <AvatarFallback>
                      {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
                      {member.suffix ? ' ' + member.suffix : ''}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{member.gender}</span>
                      <span>•</span>
                      <span>{formatAge(member.birthdate)} years old</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/residents/${member.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-10">
            No household members assigned yet. Click "Add Member" to assign residents to this household.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default HouseholdMembersManager;
