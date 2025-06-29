import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, X, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { syncAllHouseholdsHeadOfFamily } from '@/lib/api/households';
interface HouseholdMembersManagerProps {
  householdId: string;
  householdName: string;
}
interface NonRegisteredMember {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  gender: string;
  birthdate: string;
  relationship?: string;
}
const HouseholdMembersManager = ({
  householdId,
  householdName
}: HouseholdMembersManagerProps) => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('registered');

  // Non-registered member form state
  const [nonRegisteredForm, setNonRegisteredForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    gender: 'Male',
    birthdate: '',
    relationship: ''
  });
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Sync household head of family on component mount
  useEffect(() => {
    const syncHeadOfFamily = async () => {
      try {
        console.log('Syncing head of family for household:', householdId);
        await syncAllHouseholdsHeadOfFamily();

        // Refresh the members list after sync
        queryClient.invalidateQueries({
          queryKey: ['household-members', householdId]
        });
      } catch (error) {
        console.error('Error syncing head of family:', error);
      }
    };
    syncHeadOfFamily();
  }, [householdId, queryClient]);

  // Fetch current household with members data
  const {
    data: householdData,
    isLoading: isHouseholdLoading
  } = useQuery({
    queryKey: ['household-with-members', householdId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('households').select('members, head_of_family, headname').eq('id', householdId).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch current household registered members
  const {
    data: registeredMembers,
    isLoading: isMembersLoading
  } = useQuery({
    queryKey: ['household-members', householdId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('residents').select(`
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
        `).eq('household_id', householdId).order('first_name');
      if (error) throw error;
      return data || [];
    }
  });

  // Get non-registered members from the household's members JSONB column with proper type conversion
  const nonRegisteredMembers: NonRegisteredMember[] = Array.isArray(householdData?.members) ? householdData.members as unknown as NonRegisteredMember[] : [];

  // Parse unregistered head of family from headname column
  const unregisteredHeadOfFamily = React.useMemo(() => {
    if (!householdData?.headname || householdData?.head_of_family) {
      return null; // If there's a registered head or no headname, don't show unregistered head
    }

    // Parse the headname string to extract name components
    const nameParts = householdData.headname.trim().split(' ');
    if (nameParts.length === 0) return null;
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;
    return {
      id: 'unregistered-head',
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      suffix: undefined,
      gender: 'Unknown',
      birthdate: '1900-01-01',
      // Default birthdate for age calculation
      relationship: 'Head of Family'
    } as NonRegisteredMember;
  }, [householdData?.headname, householdData?.head_of_family]);

  // Helper function to handle database errors with specific toast messages
  const handleDatabaseError = (error: any, defaultMessage: string) => {
    console.error('Database error:', error);

    // Check for specific constraint violations
    if (error.message && error.message.includes('households_head_of_family_key')) {
      toast({
        title: "Head of Family Already Assigned",
        description: "This resident is already the head of another household. A person can only be the head of one household at a time.",
        variant: "destructive"
      });
      return;
    }

    // Default error handling
    toast({
      title: "Error",
      description: error.message || defaultMessage,
      variant: "destructive"
    });
  };

  // Search for residents to add
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const {
        data,
        error
      } = await supabase.from('residents').select(`
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
        `).or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,middle_name.ilike.%${term}%`).is('household_id', null).order('first_name');
      if (error) {
        console.error('Error searching residents:', error);
        toast({
          title: "Search error",
          description: "Failed to search for residents.",
          variant: "destructive"
        });
        return;
      }
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
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add registered resident to household
  const handleAddRegisteredMember = async (residentId: string) => {
    try {
      const {
        error
      } = await supabase.from('residents').update({
        household_id: householdId
      }).eq('id', residentId);
      if (error) throw error;
      toast({
        title: "Member added successfully",
        description: "The resident has been added to this household."
      });
      queryClient.invalidateQueries({
        queryKey: ['household-members', householdId]
      });
      queryClient.invalidateQueries({
        queryKey: ['resident', residentId]
      });
      setSearchTerm('');
      setSearchResults([]);
      setIsAddMemberOpen(false);
    } catch (error: any) {
      handleDatabaseError(error, "Failed to add member to household.");
    }
  };

  // Add non-registered member to household
  const handleAddNonRegisteredMember = async () => {
    try {
      if (!nonRegisteredForm.first_name || !nonRegisteredForm.last_name || !nonRegisteredForm.birthdate) {
        toast({
          title: "Missing required fields",
          description: "Please fill in first name, last name, and birthdate.",
          variant: "destructive"
        });
        return;
      }
      const newMember: NonRegisteredMember = {
        id: crypto.randomUUID(),
        first_name: nonRegisteredForm.first_name,
        middle_name: nonRegisteredForm.middle_name || undefined,
        last_name: nonRegisteredForm.last_name,
        suffix: nonRegisteredForm.suffix || undefined,
        gender: nonRegisteredForm.gender,
        birthdate: nonRegisteredForm.birthdate,
        relationship: nonRegisteredForm.relationship || undefined
      };
      const updatedMembers = [...nonRegisteredMembers, newMember];
      const {
        error
      } = await supabase.from('households').update({
        members: updatedMembers as unknown as any
      }).eq('id', householdId);
      if (error) throw error;
      toast({
        title: "Non-registered member added",
        description: "The member has been added to this household."
      });
      queryClient.invalidateQueries({
        queryKey: ['household-with-members', householdId]
      });

      // Reset form
      setNonRegisteredForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        gender: 'Male',
        birthdate: '',
        relationship: ''
      });
      setIsAddMemberOpen(false);
    } catch (error: any) {
      console.error('Error adding non-registered member:', error);
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Remove registered resident from household
  const handleRemoveRegisteredMember = async (residentId: string, residentName: string) => {
    try {
      // Check if this resident is the head of family
      if (householdData?.head_of_family === residentId) {
        toast({
          title: "Cannot remove household head",
          description: "This person is the head of family. Please change the head of family first before removing them from the household.",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('residents').update({
        household_id: null
      }).eq('id', residentId);
      if (error) throw error;
      toast({
        title: "Member removed successfully",
        description: `${residentName} has been removed from this household.`
      });
      queryClient.invalidateQueries({
        queryKey: ['household-members', householdId]
      });
      queryClient.invalidateQueries({
        queryKey: ['resident', residentId]
      });
    } catch (error: any) {
      handleDatabaseError(error, "Failed to remove member from household.");
    }
  };

  // Remove non-registered member from household
  const handleRemoveNonRegisteredMember = async (memberId: string, memberName: string) => {
    try {
      const updatedMembers = nonRegisteredMembers.filter(member => member.id !== memberId);
      const {
        error
      } = await supabase.from('households').update({
        members: updatedMembers as unknown as any
      }).eq('id', householdId);
      if (error) throw error;
      toast({
        title: "Member removed successfully",
        description: `${memberName} has been removed from this household.`
      });
      queryClient.invalidateQueries({
        queryKey: ['household-with-members', householdId]
      });
    } catch (error: any) {
      console.error('Error removing non-registered member:', error);
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const formatAge = (birthdate: string) => {
    if (birthdate === '1900-01-01') return 'Unknown'; // Handle default birthdate
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || m === 0 && today.getDate() < birth.getDate()) {
      age--;
    }
    return age;
  };
  const isLoading = isMembersLoading || isHouseholdLoading;
  return <Card>
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
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Member to {householdName}</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="registered">Registered Residents</TabsTrigger>
                  <TabsTrigger value="non-registered">Non-Registered Members</TabsTrigger>
                </TabsList>
                
                <TabsContent value="registered" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search residents by name..." value={searchTerm} onChange={e => handleSearch(e.target.value)} className="pl-10" />
                  </div>
                  
                  {isSearching && <p className="text-sm text-gray-500">Searching...</p>}
                  
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {searchResults.map(resident => <div key={resident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
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
                          <Button size="sm" onClick={() => handleAddRegisteredMember(resident.id)}>
                            Add
                          </Button>
                        </div>)}
                      
                      {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && <p className="text-sm text-gray-500 text-center py-4">
                          No available residents found matching your search.
                        </p>}
                      
                      {searchTerm.length < 2 && <p className="text-sm text-gray-500 text-center py-4">
                          Type at least 2 characters to search for residents.
                        </p>}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="non-registered" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name *</label>
                      <Input value={nonRegisteredForm.first_name} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      first_name: e.target.value
                    }))} placeholder="First name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Middle Name</label>
                      <Input value={nonRegisteredForm.middle_name} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      middle_name: e.target.value
                    }))} placeholder="Middle name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name *</label>
                      <Input value={nonRegisteredForm.last_name} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      last_name: e.target.value
                    }))} placeholder="Last name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Suffix</label>
                      <Input value={nonRegisteredForm.suffix} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      suffix: e.target.value
                    }))} placeholder="Jr., Sr., III, etc." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select value={nonRegisteredForm.gender} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      gender: e.target.value
                    }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Birthdate *</label>
                      <Input type="date" value={nonRegisteredForm.birthdate} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      birthdate: e.target.value
                    }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Relationship to Head</label>
                      <Input value={nonRegisteredForm.relationship} onChange={e => setNonRegisteredForm(prev => ({
                      ...prev,
                      relationship: e.target.value
                    }))} placeholder="Son, Daughter, Spouse, etc." />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleAddNonRegisteredMember}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Non-Registered Member
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? <p className="text-center py-10">Loading members...</p> : <div className="space-y-6">
            {/* Registered Members Section */}
            {registeredMembers && registeredMembers.length > 0 && <div>
                <h3 className="text-lg font-medium mb-3 text-blue-700">Registered Members</h3>
                <div className="space-y-3">
                  {registeredMembers.map(member => <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.photo_url} />
                          <AvatarFallback>
                            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
                              {member.suffix ? ' ' + member.suffix : ''}
                            </p>
                            {householdData?.head_of_family === member.id && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                👑 Head of Family
                              </Badge>}
                          </div>
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
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/residents/${member.id}`)}>
                          View Profile
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveRegisteredMember(member.id, `${member.first_name} ${member.last_name}`)} disabled={householdData?.head_of_family === member.id}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>)}
                </div>
              </div>}
            
            {/* Non-Registered Members Section */}
            {(nonRegisteredMembers.length > 0 || unregisteredHeadOfFamily) && <div>
                <h3 className="text-lg font-medium mb-3 text-green-700">Non-Registered Members</h3>
                <div className="space-y-3">
                  {/* Show unregistered head of family first if exists */}
                  {unregisteredHeadOfFamily && <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-yellow-50 border-yellow-200">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {unregisteredHeadOfFamily.first_name.charAt(0)}{unregisteredHeadOfFamily.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              {unregisteredHeadOfFamily.first_name} {unregisteredHeadOfFamily.middle_name ? unregisteredHeadOfFamily.middle_name + ' ' : ''}{unregisteredHeadOfFamily.last_name}
                              {unregisteredHeadOfFamily.suffix ? ' ' + unregisteredHeadOfFamily.suffix : ''}
                            </p>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              👑 Head of Family
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{unregisteredHeadOfFamily.gender}</span>
                            <span>•</span>
                            <span>{formatAge(unregisteredHeadOfFamily.birthdate)} years old</span>
                            {unregisteredHeadOfFamily.relationship && <>
                                <span>•</span>
                                <span>{unregisteredHeadOfFamily.relationship}</span>
                              </>}
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              Non-Registered Head
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        
                      </div>
                    </div>}
                  
                  {/* Show other non-registered members */}
                  {nonRegisteredMembers.map(member => <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-green-50">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
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
                            {member.relationship && <>
                                <span>•</span>
                                <span>{member.relationship}</span>
                              </>}
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              Non-Registered
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveNonRegisteredMember(member.id, `${member.first_name} ${member.last_name}`)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>)}
                </div>
              </div>}
            
            {/* No members message */}
            {(!registeredMembers || registeredMembers.length === 0) && nonRegisteredMembers.length === 0 && !unregisteredHeadOfFamily && <p className="text-muted-foreground text-center py-10">
                No household members assigned yet. Click "Add Member" to assign residents or add non-registered members to this household.
              </p>}
          </div>}
      </CardContent>
    </Card>;
};
export default HouseholdMembersManager;