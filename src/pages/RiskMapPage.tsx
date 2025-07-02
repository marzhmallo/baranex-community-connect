
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, AlertTriangle } from "lucide-react";
import UnifiedEmergencyMap from "@/components/emergency/UnifiedEmergencyMap";

const RiskMapPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Risk Assessment Map</h1>
          <p className="text-muted-foreground">
            Interactive map showing disaster zones, evacuation centers, and safe routes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Zones</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Areas marked with different risk levels
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Centers</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Evacuation centers and facilities
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escape Routes</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Recommended evacuation paths
            </div>
          </CardContent>
        </Card>
      </div>

      <UnifiedEmergencyMap />
    </div>
  );
};

export default RiskMapPage;
