import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, TrendingUp, FileCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PlazaPage = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out"
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-full">
                <Building2 className="text-white h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  PLAZA
                </h1>
                <p className="text-muted-foreground">Municipality Dashboard • Overseer Access Only</p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline" 
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
            <Building2 className="w-3 h-3 mr-1" />
            Municipality Operations Center
          </Badge>
        </div>

        {/* Municipality Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-emerald-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-600 h-5 w-5" />
                <CardTitle className="text-lg">Barangay Oversight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Monitor and manage all barangays within the municipality
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Active Barangays</span>
                  <span className="text-emerald-600">12</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Total Residents</span>
                  <span className="text-emerald-600">45,230</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Households</span>
                  <span className="text-emerald-600">8,746</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-600 h-5 w-5" />
                <CardTitle className="text-lg">Analytics Hub</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Municipal-wide statistics and performance metrics
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Revenue Growth</span>
                  <span className="text-blue-600">+12.5%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Service Requests</span>
                  <span className="text-blue-600">234</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Completion Rate</span>
                  <span className="text-green-600">89%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="text-emerald-600 h-5 w-5" />
                <CardTitle className="text-lg">Document Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Municipal document verification and approval system
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Pending Review</span>
                  <span className="text-amber-600">47</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Approved Today</span>
                  <span className="text-green-600">156</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Processing Time</span>
                  <span className="text-green-600">2.1 hrs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Municipal Authority Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Building2 className="text-blue-600 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-1">
                  Municipal Authority Dashboard
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This dashboard provides municipal-level oversight and administrative capabilities. 
                  Access is restricted to authorized municipal overseers only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlazaPage;