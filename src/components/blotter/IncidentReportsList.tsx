
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertTriangle, ChevronDown, ChevronUp, Clock, MapPin, User } from "lucide-react";
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import EditIncidentDialog from "@/components/blotter/EditIncidentDialog";

interface IncidentReport {
  id: string;
  title: string;
  description: string;
  report_type: string;
  status: string;
  location: string;
  reporter_name: string;
  reporter_contact?: string;
  created_at: string;
  complainant?: string;
  respondent?: string;
}

const IncidentReportsList = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as "Open" | "Under_Investigation" | "Resolved" | "Dismissed");
      }

      if (typeFilter !== 'all') {
        query = query.eq('report_type', typeFilter as "Theft" | "Dispute" | "Vandalism" | "Curfew" | "Others");
      }

      const { data, error } = await query;

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [searchTerm, statusFilter, typeFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this incident report?")) {
      try {
        const { error } = await supabase
          .from('incident_reports')
          .delete()
          .eq('id', id);

        if (error) throw error;

        fetchIncidents();
        alert("Incident report deleted successfully!");
      } catch (error) {
        console.error('Error deleting incident:', error);
        alert("Failed to delete incident report.");
      }
    }
  };

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
      case 'Open': return 'bg-red-100 text-red-800 border-red-200';
      case 'Under_Investigation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Dismissed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Theft': return 'bg-purple-100 text-purple-800';
      case 'Dispute': return 'bg-orange-100 text-orange-800';
      case 'Vandalism': return 'bg-red-100 text-red-800';
      case 'Curfew': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Under_Investigation">Under Investigation</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Theft">Theft</SelectItem>
            <SelectItem value="Dispute">Dispute</SelectItem>
            <SelectItem value="Vandalism">Vandalism</SelectItem>
            <SelectItem value="Curfew">Curfew Violation</SelectItem>
            <SelectItem value="Others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading incident reports...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const isExpanded = expandedCards.has(incident.id);
            return (
              <Card key={incident.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(incident.report_type)}>
                          {incident.report_type}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {incident.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(incident.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {incident.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {incident.reporter_name}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(incident.id)}
                      className="ml-2"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 border-t border-gray-100">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700">{incident.description}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Reporter Information</h4>
                        <p className="text-gray-700">{incident.reporter_name}</p>
                        {incident.reporter_contact && (
                          <p className="text-gray-600 text-sm">{incident.reporter_contact}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Parties Involved</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-gray-700">Complainant: </span>
                            <span className="text-gray-700">{incident.complainant || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Respondent: </span>
                            <span className="text-gray-700">{incident.respondent || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            ID: {incident.id.slice(0, 8)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingIncident(incident)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(incident.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {incidents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Incident Reports Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No reports match your current filters.'
                    : 'No incident reports have been filed yet.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {editingIncident && (
        <EditIncidentDialog
          incident={editingIncident}
          open={!!editingIncident}
          onOpenChange={(open) => !open && setEditingIncident(null)}
          onSuccess={() => {
            fetchIncidents();
            setEditingIncident(null);
          }}
        />
      )}
    </div>
  );
};

export default IncidentReportsList;
