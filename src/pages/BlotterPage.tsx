
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, FileText, Users, AlertTriangle } from "lucide-react";
import IncidentReportsList from "@/components/blotter/IncidentReportsList";
import WatchlistTable from "@/components/blotter/WatchlistTable";
import CreateIncidentDialog from "@/components/blotter/CreateIncidentDialog";
import FlagIndividualDialog from "@/components/blotter/FlagIndividualDialog";

const BlotterPage = () => {
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Blotter Management</h1>
          <p className="text-muted-foreground">Record and manage incident reports and community safety records</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setShowIncidentDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
        <Button variant="outline" onClick={() => setShowFlagDialog(true)} className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Flag Individual
        </Button>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Incident Reports
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Watchlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentReportsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <WatchlistTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateIncidentDialog 
        open={showIncidentDialog} 
        onOpenChange={setShowIncidentDialog}
      />
      
      <FlagIndividualDialog 
        open={showFlagDialog} 
        onOpenChange={setShowFlagDialog}
      />
    </div>
  );
};

export default BlotterPage;
