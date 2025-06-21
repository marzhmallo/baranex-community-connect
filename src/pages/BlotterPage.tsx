
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shield, AlertTriangle } from "lucide-react";
import IncidentReportsList from "@/components/blotter/IncidentReportsList";
import WatchlistTable from "@/components/blotter/WatchlistTable";
import CreateIncidentDialog from "@/components/blotter/CreateIncidentDialog";
import CreateFlaggedDialog from "@/components/blotter/CreateFlaggedDialog";

const BlotterPage = () => {
  const [activeTab, setActiveTab] = useState("incidents");
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [showCreateFlagged, setShowCreateFlagged] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crime Incident Reporting (Blotter)</h1>
          <p className="text-muted-foreground">
            Manage incident reports and maintain watchlist for community safety
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Incident Reports
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Watchlist
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button onClick={() => setShowCreateIncident(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              File Report
            </Button>
            {activeTab === "watchlist" && (
              <Button 
                variant="outline" 
                onClick={() => setShowCreateFlagged(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Watchlist
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
              <CardDescription>
                View and manage all crime incident reports in your barangay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentReportsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Individuals Watchlist</CardTitle>
              <CardDescription>
                Monitor individuals flagged in incident reports, sorted by risk level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WatchlistTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateIncidentDialog 
        open={showCreateIncident} 
        onOpenChange={setShowCreateIncident}
      />

      <CreateFlaggedDialog 
        open={showCreateFlagged} 
        onOpenChange={setShowCreateFlagged}
      />
    </div>
  );
};

export default BlotterPage;
