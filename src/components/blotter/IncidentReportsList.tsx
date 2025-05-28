
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, AlertTriangle } from "lucide-react";
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
}

const IncidentReportsList = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);

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

        fetchIncidents(); // Refresh the list after deletion
        alert("Incident report deleted successfully!");
      } catch (error) {
        console.error('Error deleting incident:', error);
        alert("Failed to delete incident report.");
      }
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
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">{incident.title}</h2>
                  <p className="text-gray-600">{incident.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Type:</span>
                      <p className="text-gray-700">{incident.report_type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <p className="text-gray-700">{incident.status}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <p className="text-gray-700">{incident.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Reporter:</span>
                      <p className="text-gray-700">{incident.reporter_name}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        ID: {incident.id.slice(0, 8)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Filed: {format(new Date(incident.created_at), 'MMM dd, yyyy')}
                      </span>
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
            </Card>
          ))}

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

      {/* Edit Dialog */}
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
