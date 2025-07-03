
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Users, AlertTriangle, Navigation, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  emergencyContacts: number;
  disasterZones: number;
  evacuationCenters: number;
  availableCenters: number;
  totalCapacity: number;
  currentOccupancy: number;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone_number: string;
  type: string;
}

const EmergencyDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    emergencyContacts: 0,
    disasterZones: 0,
    evacuationCenters: 0,
    availableCenters: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
  });
  const [quickContacts, setQuickContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.brgyid) {
      fetchDashboardData();
    }
  }, [userProfile?.brgyid]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch emergency contacts count
      const { count: contactsCount } = await supabase
        .from('emergency_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', userProfile?.brgyid);

      // Fetch disaster zones count
      const { count: zonesCount } = await supabase
        .from('disaster_zones')
        .select('*', { count: 'exact', head: true })
        .eq('brgyid', userProfile?.brgyid);

      // Fetch evacuation centers data
      const { data: centers, count: centersCount } = await supabase
        .from('evacuation_centers')
        .select('*', { count: 'exact' })
        .eq('brgyid', userProfile?.brgyid);

      // Calculate center statistics
      const availableCenters = centers?.filter(c => c.status === 'available').length || 0;
      const totalCapacity = centers?.reduce((sum, c) => sum + (c.capacity || 0), 0) || 0;
      const currentOccupancy = centers?.reduce((sum, c) => sum + (c.current_occupancy || 0), 0) || 0;

      // Fetch quick access contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('id, name, phone_number, type')
        .eq('brgyid', userProfile?.brgyid)
        .limit(4);

      setStats({
        emergencyContacts: contactsCount || 0,
        disasterZones: zonesCount || 0,
        evacuationCenters: centersCount || 0,
        availableCenters,
        totalCapacity,
        currentOccupancy,
      });

      setQuickContacts(contacts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const callEmergency = (phoneNumber: string, contactName: string) => {
    if (window.confirm(`Call ${contactName} at ${phoneNumber}?`)) {
      window.open(`tel:${phoneNumber}`);
    }
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'police': return '👮';
      case 'medical': return '🚑';
      case 'disaster': return '⛑️';
      case 'rescue': return '🚁';
      default: return '📞';
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return 'destructive';
      case 'police': return 'default';
      case 'medical': return 'secondary';
      case 'disaster': return 'outline';
      case 'rescue': return 'default';
      default: return 'outline';
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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emergencyContacts}</div>
            <p className="text-xs text-muted-foreground">Active contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Zones</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disasterZones}</div>
            <p className="text-xs text-muted-foreground">Mapped areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evacuation Centers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableCenters}/{stats.evacuationCenters}</div>
            <p className="text-xs text-muted-foreground">Available centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentOccupancy}/{stats.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Current occupancy</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Quick Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quickContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickContacts.map((contact) => (
                <Card key={contact.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{getContactTypeIcon(contact.type)}</span>
                      <Badge variant={getContactTypeColor(contact.type) as any}>
                        {contact.type}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{contact.name}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => callEmergency(contact.phone_number, contact.name)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {contact.phone_number}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No emergency contacts configured yet. Add contacts in the Emergency Contacts tab.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Emergency Response System</span>
              <Badge variant="default" className="bg-green-500">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Contact Database</span>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Evacuation Centers</span>
              <Badge variant={stats.availableCenters > 0 ? "default" : "destructive"}>
                {stats.availableCenters > 0 ? "Ready" : "Unavailable"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Emergency Alert
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/riskmap'}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View Risk Map
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Navigation className="h-4 w-4 mr-2" />
              Plan Evacuation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
