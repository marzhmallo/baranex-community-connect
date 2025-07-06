import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Code, Database, Server, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const EchelonPage = () => {
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
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
                <Lock className="text-white h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ECHELON
                </h1>
                <p className="text-muted-foreground">Developer Dashboard • Glyph Access Only</p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline" 
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
            <Shield className="w-3 h-3 mr-1" />
            Restricted Access Zone
          </Badge>
        </div>

        {/* Developer Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-purple-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Code className="text-purple-600 h-5 w-5" />
                <CardTitle className="text-lg">System Diagnostics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Monitor application performance and health metrics
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>API Status</span>
                  <span className="text-green-600">Operational</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Database</span>
                  <span className="text-green-600">Connected</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Auth System</span>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Database className="text-purple-600 h-5 w-5" />
                <CardTitle className="text-lg">Database Admin</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Direct database access and management tools
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Tables</span>
                  <span className="text-blue-600">Active</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Migrations</span>
                  <span className="text-blue-600">Up-to-date</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Backups</span>
                  <span className="text-blue-600">Daily</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Server className="text-purple-600 h-5 w-5" />
                <CardTitle className="text-lg">Server Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Real-time server metrics and performance data
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>CPU Usage</span>
                  <span className="text-amber-600">24%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Memory</span>
                  <span className="text-amber-600">67%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Storage</span>
                  <span className="text-green-600">43%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Notice */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Shield className="text-red-600 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-400 mb-1">
                  Restricted Access Zone
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This dashboard is exclusively for developers with "glyph" role access. 
                  All activities are logged and monitored for security compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EchelonPage;