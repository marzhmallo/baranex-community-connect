
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

const AddressAutoFillSetting = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSetting = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('userid', user.id)
          .eq('key', 'auto_fill_address_from_admin_barangay')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // If no setting exists, default to true (enabled)
        setIsEnabled(data?.value === 'true' || !data);
      } catch (error) {
        console.error('Error fetching setting:', error);
        // Default to enabled on error
        setIsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, [user?.id]);

  const handleToggle = async (enabled: boolean) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          userid: user.id,
          key: 'auto_fill_address_from_admin_barangay',
          value: enabled.toString(),
          description: 'Automatically fill address fields based on admin\'s barangay when adding/editing residents and households'
        }, {
          onConflict: 'userid,key'
        });

      if (error) throw error;

      setIsEnabled(enabled);
      toast({
        title: "Setting updated",
        description: `Address auto-fill has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Auto-Fill</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-fill-address">Auto-fill address fields</Label>
            <p className="text-sm text-muted-foreground">
              Automatically populate address fields based on admin's barangay when adding residents and households. When enabled, address fields become read-only for security.
            </p>
          </div>
          <Switch 
            id="auto-fill-address" 
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressAutoFillSetting;
