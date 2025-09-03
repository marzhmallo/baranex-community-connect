
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useBarangaySelection } from '@/hooks/useBarangaySelection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, MapPin, Users, Phone, AlertTriangle, Clock } from "lucide-react";

const UserEmergencyPage = () => {
  const { userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const { selectedBarangay } = useBarangaySelection();
  
  // Get barangay ID from URL params (for public access) or user profile (for authenticated users) or selected barangay (from localStorage)
  const barangayId = searchParams.get('barangay') || userProfile?.brgyid || selectedBarangay?.id;

  // Fetch emergency contacts using correct field names
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['user-emergency-contacts', barangayId],
    queryFn: async () => {
      if (!barangayId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('brgyid', barangayId)
        .order('type', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!barangayId
  });

  // Fetch disaster zones
  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ['user-disaster-zones', barangayId],
    queryFn: async () => {
      if (!barangayId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('disaster_zones')
        .select('*')
        .eq('brgyid', barangayId)
        .order('risk_level', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!barangayId
  });

  // Fetch evacuation centers
  const { data: centers, isLoading: centersLoading } = useQuery({
    queryKey: ['user-evacuation-centers', barangayId],
    queryFn: async () => {
      if (!barangayId) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('evacuation_centers')
        .select('*')
        .eq('brgyid', barangayId)
        .order('capacity', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!barangayId
  });

  if (contactsLoading || zonesLoading || centersLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <PublicPageHeader title="Emergency Information" />
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <p className="text-muted-foreground">Important safety information and emergency contacts</p>
        </div>
      </div>

      <Alert className="mb-6 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Emergency:</strong> In case of immediate danger, call 911 or your local emergency services first.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Emergency Contacts
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Risk Areas
          </TabsTrigger>
          <TabsTrigger value="centers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Evacuation Centers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts?.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    {contact.name}
                  </CardTitle>
                  <Badge variant="outline">{contact.type}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-lg text-primary">{contact.phone_number}</p>
                    {contact.email && (
                      <p className="text-sm text-muted-foreground">
                        Email: {contact.email}
                      </p>
                    )}
                  </div>
                  
                  {contact.description && (
                    <p className="text-sm text-muted-foreground">{contact.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {contacts?.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No emergency contacts available.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="zones">
          <div className="space-y-4">
            {zones?.map((zone) => (
              <Card key={zone.id} className={`border-l-4 ${
                zone.risk_level === 'high' ? 'border-l-red-500' :
                zone.risk_level === 'medium' ? 'border-l-yellow-500' :
                'border-l-green-500'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {zone.zone_name}
                      </CardTitle>
                      <CardDescription>{zone.notes}</CardDescription>
                    </div>
                    <Badge variant={
                      zone.risk_level === 'high' ? 'destructive' :
                      zone.risk_level === 'medium' ? 'default' :
                      'secondary'
                    }>
                      {zone.risk_level} Risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Hazard Type:</strong> {zone.zone_type}</p>
                    {zone.polygon_coords && (
                      <p><strong>Coordinates:</strong> {JSON.stringify(zone.polygon_coords)}</p>
                    )}
                    {zone.notes && (
                      <div>
                        <p><strong>Safety Instructions:</strong></p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {zone.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {zones?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No disaster zones identified.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="centers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {centers?.map((center) => (
              <Card key={center.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {center.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={center.status === 'available' ? "default" : "secondary"}>
                      {center.status === 'available' ? "Available" : center.status}
                    </Badge>
                    <Badge variant="outline">Capacity: {center.capacity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm">{center.address}</p>
                  </div>
                  
                  {center.contact_person && (
                    <p className="text-sm">
                      <strong>Contact:</strong> {center.contact_person}
                      {center.contact_phone && ` - ${center.contact_phone}`}
                    </p>
                  )}
                  
                  {center.facilities && (
                    <div>
                      <p className="text-sm font-medium">Facilities:</p>
                      <p className="text-sm text-muted-foreground">{center.facilities.join(', ')}</p>
                    </div>
                  )}
                  
                  {(center.latitude && center.longitude) && (
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {center.latitude}, {center.longitude}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {centers?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No evacuation centers available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserEmergencyPage;
