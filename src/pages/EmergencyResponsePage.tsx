import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Users, Phone, AlertTriangle, Navigation } from "lucide-react";
import EmergencyContactsManager from "@/components/emergency/EmergencyContactsManager";
import DisasterZonesManager from "@/components/emergency/DisasterZonesManager";
import EvacuationCentersManager from "@/components/emergency/EvacuationCentersManager";
import EvacuationRoutesManager from "@/components/emergency/EvacuationRoutesManager";
import EmergencyDashboard from "@/components/emergency/EmergencyDashboard";
const EmergencyResponsePage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  return <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Emergency Preparedness & Response</h1>
          <p className="text-muted-foreground">Stay informed during emergencies. Connect with help, view danger zones, and find safe places.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Emergency Contacts
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Disaster Zones
          </TabsTrigger>
          <TabsTrigger value="centers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Evacuation Centers
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Routes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <EmergencyDashboard />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts Management</CardTitle>
              <CardDescription>
                Manage emergency service contacts for your barangay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmergencyContactsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Disaster Zones</CardTitle>
              <CardDescription>
                Map and manage hazard-prone areas in your barangay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DisasterZonesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evacuation Centers</CardTitle>
              <CardDescription>
                Manage evacuation facilities and their capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvacuationCentersManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evacuation Routes</CardTitle>
              <CardDescription>
                Define and manage evacuation routes and paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvacuationRoutesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default EmergencyResponsePage;