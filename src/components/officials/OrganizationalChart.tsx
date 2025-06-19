
import { Official } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Users, UserPlus, Building } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrganizationalChartProps {
  officials: Official[];
  isLoading: boolean;
  error: Error | null;
}

interface OfficialRank {
  id: string;
  rankno: string;
  ranklabel: string;
  brgyid: string;
  officialid: string | null;
  created_at: string;
  updated_at: string;
}

export const OrganizationalChart = ({
  officials,
  isLoading,
  error
}: OrganizationalChartProps) => {
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRankId, setSelectedRankId] = useState<string>('');
  const [selectedOfficialForAssignment, setSelectedOfficialForAssignment] = useState<string>('');
  const queryClient = useQueryClient();

  // Get current user's brgyid
  const {
    data: currentUser
  } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const {
        data,
        error
      } = await supabase.from('profiles').select('brgyid').eq('id', user.id).single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch all ranks
  const {
    data: allRanks
  } = useQuery({
    queryKey: ['all-official-ranks'],
    queryFn: async () => {
      if (!currentUser?.brgyid) return [];
      const {
        data,
        error
      } = await supabase.from('officialranks').select('*').eq('brgyid', currentUser.brgyid).order('rankno', {
        ascending: true
      });
      if (error) throw error;
      return data as OfficialRank[];
    },
    enabled: !!currentUser?.brgyid
  });

  // Assign official to rank mutation
  const assignMutation = useMutation({
    mutationFn: async ({
      rankId,
      officialId
    }: {
      rankId: string;
      officialId: string;
    }) => {
      const {
        data,
        error
      } = await supabase.from('officialranks').update({
        officialid: officialId,
        updated_at: new Date().toISOString()
      }).eq('id', rankId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['all-official-ranks']
      });
      queryClient.invalidateQueries({
        queryKey: ['officials-with-positions']
      });
      setShowAssignDialog(false);
      setSelectedRankId('');
      setSelectedOfficialForAssignment('');
      toast.success('Official assigned to rank successfully');
    },
    onError: error => {
      console.error('Error assigning official to rank:', error);
      toast.error('Failed to assign official to rank');
    }
  });

  const handleAssignOfficial = (rankId: string) => {
    setSelectedRankId(rankId);
    setShowAssignDialog(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedRankId || !selectedOfficialForAssignment) {
      toast.error('Please select an official');
      return;
    }
    assignMutation.mutate({
      rankId: selectedRankId,
      officialId: selectedOfficialForAssignment
    });
  };

  const getOfficialInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Get officials assigned to specific ranks
  const getOfficialsForRank = (rankId: string) => {
    return officials.filter(official => {
      const rank = allRanks?.find(r => r.id === rankId);
      return rank?.officialid === official.id;
    });
  };

  // Get unassigned officials for the assignment dropdown
  const unassignedOfficials = officials.filter(official => {
    const hasRank = allRanks?.some(rank => rank.officialid === official.id);
    return !hasRank;
  });

  // Calculate totals for summary
  const getTotals = () => {
    const totalOfficials = officials.length;
    const assignedOfficials = allRanks?.filter(rank => rank.officialid).length || 0;
    const unassignedOfficials = totalOfficials - assignedOfficials;
    return {
      totalOfficials,
      assignedOfficials,
      unassignedOfficials,
      totalRanks: allRanks?.length || 0
    };
  };

  if (isLoading) {
    return <div className="space-y-6">
        {[1, 2, 3].map(rank => <Card key={rank} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({
              length: 4
            }).map((_, i) => <div key={i} className="h-32 bg-muted rounded"></div>)}
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }

  if (error) {
    return <div className="p-6 text-destructive bg-card rounded-lg border">
        Error loading officials: {error.message}
      </div>;
  }

  const totals = getTotals();

  return <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Barangay Officials</h2>
        <p className="text-muted-foreground">Official Directory</p>
      </div>

      {/* Display all ranks individually using their actual rank labels */}
      {allRanks?.map(rank => {
        const official = getOfficialsForRank(rank.id)[0];
        const rankNum = parseInt(rank.rankno);
        
        // Determine styling based on rank number
        let cardStyle = '';
        let badgeColor = 'bg-gray-500';
        let statusText = 'Appointed';
        
        if (rankNum === 1) {
          cardStyle = 'border-2 border-purple-200 bg-purple-50';
          badgeColor = 'bg-purple-500';
          statusText = 'Elected';
        } else if (rankNum >= 2 && rankNum <= 11) {
          cardStyle = 'border-2 border-blue-200 bg-blue-50';
          badgeColor = 'bg-blue-500';
          statusText = 'Elected';
        } else if (rankNum >= 12 && rankNum <= 14) {
          cardStyle = 'border-2 border-orange-200 bg-orange-50';
          badgeColor = 'bg-orange-500';
          statusText = 'Elected';
        } else if (rankNum >= 15 && rankNum <= 21) {
          cardStyle = 'border-2 border-red-200 bg-red-50';
          badgeColor = 'bg-red-500';
          statusText = 'Appointed';
        } else if (rankNum >= 22 && rankNum <= 24) {
          cardStyle = 'border-2 border-teal-200 bg-teal-50';
          badgeColor = 'bg-teal-500';
          statusText = 'Appointed';
        } else if (rankNum >= 25 && rankNum <= 28) {
          cardStyle = 'border-2 border-purple-200 bg-purple-50';
          badgeColor = 'bg-purple-600';
          statusText = 'Appointed';
        }

        return (
          <Card key={rank.id} className={`overflow-hidden ${cardStyle}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${badgeColor.replace('bg-', 'bg-').replace('500', '500').replace('600', '600')}`}>
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {rank.ranklabel}
                      <Badge variant="outline" className={`${badgeColor} text-white border-none`}>
                        Rank {rank.rankno}
                      </Badge>
                    </CardTitle>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAssignOfficial(rank.id)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Assign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {official ? (
                <div className="flex items-center gap-4 p-6 rounded-lg">
                  <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-primary">
                    <AvatarImage src={official.photo_url} alt={official.name} />
                    <AvatarFallback className={`${badgeColor} text-white text-lg font-semibold`}>
                      {getOfficialInitials(official.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg truncate">
                      {official.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {rank.ranklabel}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`${badgeColor} text-white`}>
                        {statusText}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedOfficial(official)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No official assigned to this position</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Organization Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Building className="h-5 w-5" />
            Organization Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-1">{totals.totalOfficials}</div>
              <div className="text-sm text-muted-foreground">Total Officials</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-1">{totals.assignedOfficials}</div>
              <div className="text-sm text-muted-foreground">Assigned Officials</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-orange-600 mb-1">{totals.unassignedOfficials}</div>
              <div className="text-sm text-muted-foreground">Unassigned Officials</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-1">{totals.totalRanks}+</div>
              <div className="text-sm text-muted-foreground">Available Ranks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Official to Rank</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedRankId && allRanks && <div className="p-4 bg-muted rounded-lg">
                <p><strong>Rank:</strong> {allRanks.find(r => r.id === selectedRankId)?.ranklabel}</p>
              </div>}
            
            <div>
              <Label htmlFor="official-select">Select Official</Label>
              <Select value={selectedOfficialForAssignment} onValueChange={setSelectedOfficialForAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an official..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedOfficials.map(official => <SelectItem key={official.id} value={official.id}>
                      {official.name} - {official.position}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {unassignedOfficials.length === 0 && <p className="text-sm text-muted-foreground mt-2">
                  No unassigned officials available
                </p>}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAssignment} disabled={assignMutation.isPending || !selectedOfficialForAssignment}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign Official'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Official Details Dialog */}
      <Dialog open={!!selectedOfficial} onOpenChange={() => setSelectedOfficial(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedOfficial?.name}</DialogTitle>
          </DialogHeader>
          {selectedOfficial && <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedOfficial.photo_url} alt={selectedOfficial.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getOfficialInitials(selectedOfficial.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedOfficial.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOfficial.position}</p>
                </div>
              </div>
              
              {selectedOfficial.bio && <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedOfficial.bio}</p>
                </div>}
              
              <div className="space-y-2">
                {selectedOfficial.email && <div className="text-sm">
                    <span className="font-medium">Email:</span> {selectedOfficial.email}
                  </div>}
                {selectedOfficial.phone && <div className="text-sm">
                    <span className="font-medium">Phone:</span> {selectedOfficial.phone}
                  </div>}
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};
