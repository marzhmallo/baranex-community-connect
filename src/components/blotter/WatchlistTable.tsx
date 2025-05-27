
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Search, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EditFlaggedDialog from "./EditFlaggedDialog";

interface FlaggedIndividual {
  id: string;
  full_name: string;
  alias?: string;
  reason: string;
  risk_level: string;
  created_at: string;
  incident_reports: {
    id: string;
    title: string;
    date_reported: string;
  };
}

const WatchlistTable = () => {
  const [flaggedIndividuals, setFlaggedIndividuals] = useState<FlaggedIndividual[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [editingFlagged, setEditingFlagged] = useState<FlaggedIndividual | null>(null);
  const { userProfile } = useAuth();

  const fetchFlaggedIndividuals = async () => {
    if (!userProfile?.brgyid) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('flagged_individuals')
        .select(`
          *,
          incident_reports (
            id,
            title,
            date_reported
          )
        `)
        .eq('brgyid', userProfile.brgyid)
        .order('risk_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterRisk !== "all") {
        query = query.eq('risk_level', filterRisk);
      }

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,alias.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching flagged individuals:', error);
        toast({
          title: "Error",
          description: "Failed to fetch watchlist data",
          variant: "destructive",
        });
        return;
      }

      setFlaggedIndividuals(data || []);
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
    fetchFlaggedIndividuals();
  }, [userProfile?.brgyid, filterRisk, searchTerm]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    if (level === 'high') {
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
    return null;
  };

  const deleteFlaggedIndividual = async (id: string) => {
    if (!confirm('Are you sure you want to remove this individual from the watchlist?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('flagged_individuals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting flagged individual:', error);
        toast({
          title: "Error",
          description: "Failed to remove individual from watchlist",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Individual removed from watchlist",
      });

      fetchFlaggedIndividuals();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, alias, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
            <SelectItem value="moderate">Moderate Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Watchlist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Flagged</p>
                <p className="text-2xl font-bold">{flaggedIndividuals.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {flaggedIndividuals.filter(f => f.risk_level === 'high').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Moderate Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {flaggedIndividuals.filter(f => f.risk_level === 'moderate').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Risk</p>
                <p className="text-2xl font-bold text-green-600">
                  {flaggedIndividuals.filter(f => f.risk_level === 'low').length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flagged Individuals</CardTitle>
          <CardDescription>
            Individuals flagged in incident reports, sorted by risk level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flaggedIndividuals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No flagged individuals found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Related Report</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedIndividuals.map((individual) => (
                  <TableRow key={individual.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{individual.full_name}</p>
                        {individual.alias && (
                          <p className="text-sm text-muted-foreground">
                            Alias: {individual.alias}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskColor(individual.risk_level)}>
                        {getRiskIcon(individual.risk_level)}
                        {individual.risk_level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate" title={individual.reason}>
                        {individual.reason}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{individual.incident_reports.title}</p>
                        <p className="text-muted-foreground">
                          {new Date(individual.incident_reports.date_reported).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(individual.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFlagged(individual)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteFlaggedIndividual(individual.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditFlaggedDialog
        flaggedIndividual={editingFlagged}
        open={!!editingFlagged}
        onOpenChange={(open) => !open && setEditingFlagged(null)}
        onSuccess={fetchFlaggedIndividuals}
      />
    </div>
  );
};

export default WatchlistTable;
