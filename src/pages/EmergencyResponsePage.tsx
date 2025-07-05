import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Phone, AlertTriangle } from "lucide-react";
import EmergencyContactsManager from "@/components/emergency/EmergencyContactsManager";
import EmergencyDashboard from "@/components/emergency/EmergencyDashboard";
import RiskMapPage from "@/pages/RiskMapPage";

const EmergencyResponsePage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Emergency Preparedness & Response</h1>
          <p className="text-muted-foreground">Stay informed during emergencies. Connect with help, view danger zones, and find safe places.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="riskmap" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Risk Map
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Emergency Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <EmergencyDashboard />
        </TabsContent>

        <TabsContent value="riskmap" className="mt-6">
          <RiskMapPage />
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
      </Tabs>
    </div>
  );
};

export default EmergencyResponsePage;
