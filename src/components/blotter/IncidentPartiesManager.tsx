
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, User, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface IncidentParty {
  id: string;
  incident_id: string;
  resident_id?: string;
  name: string;
  contact_info?: string;
  role: 'complainant' | 'respondent';
  created_at: string;
}

interface Resident {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  mobile_number?: string;
}

interface IncidentPartiesManagerProps {
  incidentId: string;
  onUpdate?: () => void;
}

const IncidentPartiesManager = ({ incidentId, onUpdate }: IncidentPartiesManagerProps) => {
  const [parties, setParties] = useState<IncidentParty[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newParty, setNewParty] = useState({
    role: '' as 'complainant' | 'respondent' | '',
    resident_id: '',
    name: '',
    contact_info: ''
  });

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from('incident_parties')
        .select('*')
        .eq('incident_id', incidentId)
        .order('role', { ascending: true });

      if (error) throw error;
      
      // Type assertion to ensure role is properly typed
      const typedData = (data || []).map(party => ({
        ...party,
        role: party.role as 'complainant' | 'respondent'
      }));
      
      setParties(typedData);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch incident parties",
        variant: "destructive",
      });
    }
  };

  const fetchResidents = async () => {
    try {
      const { data, error } = await supabase
        .from('residents')
        .select('id, first_name, last_name, middle_name, mobile_number')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchResidents();
  }, [incidentId]);

  const handleAddParty = async () => {
    if (!newParty.role || (!newParty.resident_id && !newParty.name)) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);

      let partyData: any = {
        incident_id: incidentId,
        role: newParty.role,
        contact_info: newParty.contact_info || null
      };

      if (newParty.resident_id) {
        const resident = residents.find(r => r.id === newParty.resident_id);
        partyData.resident_id = newParty.resident_id;
        partyData.name = `${resident?.first_name} ${resident?.middle_name ? resident.middle_name + ' ' : ''}${resident?.last_name}`;
      } else {
        partyData.name = newParty.name;
      }

      const { error } = await supabase
        .from('incident_parties')
        .insert(partyData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Party added successfully",
      });

      setNewParty({ role: '', resident_id: '', name: '', contact_info: '' });
      fetchParties();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding party:', error);
      toast({
        title: "Error",
        description: "Failed to add party",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveParty = async (partyId: string) => {
    try {
      const { error } = await supabase
        .from('incident_parties')
        .delete()
        .eq('id', partyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Party removed successfully",
      });

      fetchParties();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing party:', error);
      toast({
        title: "Error",
        description: "Failed to remove party",
        variant: "destructive",
      });
    }
  };

  const getSelectedResidentContact = () => {
    if (!newParty.resident_id) return '';
    const resident = residents.find(r => r.id === newParty.resident_id);
    return resident?.mobile_number || '';
  };

  if (loading) {
    return <div className="animate-pulse">Loading parties...</div>;
  }

  const complainants = parties.filter(p => p.role === 'complainant');
  const respondents = parties.filter(p => p.role === 'respondent');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Complainants */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Complainants ({complainants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {complainants.map((party) => (
              <div key={party.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <p className="font-medium text-sm">{party.name}</p>
                  {party.contact_info && (
                    <p className="text-xs text-muted-foreground">{party.contact_info}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParty(party.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {complainants.length === 0 && (
              <p className="text-sm text-muted-foreground">No complainants added</p>
            )}
          </CardContent>
        </Card>

        {/* Respondents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Respondents ({respondents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {respondents.map((party) => (
              <div key={party.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <p className="font-medium text-sm">{party.name}</p>
                  {party.contact_info && (
                    <p className="text-xs text-muted-foreground">{party.contact_info}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParty(party.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {respondents.length === 0 && (
              <p className="text-sm text-muted-foreground">No respondents added</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add New Party Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Add Party
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newParty.role} 
                onValueChange={(value: 'complainant' | 'respondent') => 
                  setNewParty(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complainant">Complainant</SelectItem>
                  <SelectItem value="respondent">Respondent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resident">Resident (Optional)</Label>
              <Select 
                value={newParty.resident_id} 
                onValueChange={(value) => 
                  setNewParty(prev => ({ 
                    ...prev, 
                    resident_id: value,
                    name: value ? '' : prev.name,
                    contact_info: value ? getSelectedResidentContact() : prev.contact_info
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resident or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not a resident</SelectItem>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.first_name} {resident.middle_name ? resident.middle_name + ' ' : ''}{resident.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!newParty.resident_id && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newParty.name}
                onChange={(e) => setNewParty(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="contact">Contact Information (Optional)</Label>
            <Input
              id="contact"
              value={newParty.contact_info}
              onChange={(e) => setNewParty(prev => ({ ...prev, contact_info: e.target.value }))}
              placeholder="Phone number, email, or address"
            />
          </div>

          <Button 
            onClick={handleAddParty} 
            disabled={adding || !newParty.role || (!newParty.resident_id && !newParty.name)}
            className="w-full"
          >
            {adding ? "Adding..." : "Add Party"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentPartiesManager;
