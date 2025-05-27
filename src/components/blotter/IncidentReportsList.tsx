
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MapPin, Calendar, User, Phone, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EditIncidentDialog from "./EditIncidentDialog";
import FlagIndividualDialog from "./FlagIndividualDialog";

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  report_type: string;
  status: string;
  date_reported: string;
  location: string;
  reporter_name: string;
  reporter_contact?: string;
  created_at: string;
  flagged_individuals?: Array<{
    id: string;
    full_name: string;
    risk_level: string;
    reason: string;
  }>;
}

const IncidentReportsList = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [flaggingIncident, setFlaggingIncident] = useState<IncidentReport | null>(null);
  const { userProfile } = useAuth();

  const fetchIncidents = async () => {
    if (!userProfile?.brgyid) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('incident_reports')
        .select(`
          *,
          flagged_individuals (
            id,
            full_name,
            risk_level,
            reason
          )
        `)
        .eq('brgyid', userProfile.brgyid)
        .order('date_reported', { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq('status', filterStatus);
      }

      if (filterType !== "all") {
        query = query.eq('report_type', filterType);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,reporter_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching incidents:', error);
        toast({
          title: "Error",
          description: "Failed to fetch incident reports",
          variant: "destructive",
        });
        return;
      }

      setIncidents(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [userProfile?.brgyid, filterStatus, filterType, searchTerm]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'theft': return 'bg-purple-100 text-purple-800';
      case 'dispute': return 'bg-orange-100 text-orange-800';
      case 'vandalism': return 'bg-red-100 text-red-800';
      case 'curfew': return 'bg-blue-100 text-blue-800';
      case 'others': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by title, location, or reporter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_investigation">Under Investigation</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="theft">Theft</SelectItem>
            <SelectItem value="dispute">Dispute</SelectItem>
            <SelectItem value="vandalism">Vandalism</SelectItem>
            <SelectItem value="curfew">Curfew</SelectItem>
            <SelectItem value="others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incident Cards */}
      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No incident reports found
          </div>
        ) : (
          incidents.map((incident) => (
            <Collapsible key={incident.id}>
              <Card className="w-full">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {expandedCards.has(incident.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <CardTitle className="text-lg">{incident.title}</CardTitle>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getTypeColor(incident.report_type)}>
                            {incident.report_type}
                          </Badge>
                          {incident.flagged_individuals && incident.flagged_individuals.length > 0 && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {incident.flagged_individuals.length} Flagged
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(incident.date_reported).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {incident.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Reporter Information</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {incident.reporter_name}
                            </div>
                            {incident.reporter_contact && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {incident.reporter_contact}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {incident.flagged_individuals && incident.flagged_individuals.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Flagged Individuals</h4>
                            <div className="space-y-2">
                              {incident.flagged_individuals.map((individual) => (
                                <div key={individual.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div>
                                    <p className="font-medium text-sm">{individual.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{individual.reason}</p>
                                  </div>
                                  <Badge className={getRiskColor(individual.risk_level)}>
                                    {individual.risk_level}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFlaggingIncident(incident);
                          }}
                        >
                          Flag Individual
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingIncident(incident);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

      <EditIncidentDialog
        incident={editingIncident}
        open={!!editingIncident}
        onOpenChange={(open) => !open && setEditingIncident(null)}
        onSuccess={fetchIncidents}
      />

      <FlagIndividualDialog
        incident={flaggingIncident}
        open={!!flaggingIncident}
        onOpenChange={(open) => !open && setFlaggingIncident(null)}
        onSuccess={fetchIncidents}
      />
    </div>
  );
};

export default IncidentReportsList;
