
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const SettingsPage = () => {
  const { userProfile, userSettings, loading, refreshSettings } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    announcements: true,
  });

  const [preferences, setPreferences] = useState({
    showWelcomeMessage: true,
    autoSaveChanges: false,
  });

  const [barangaySettings, setBarangaySettings] = useState({
    phone: '',
    email: '',
    officehours: ''
  });

  const [isLoadingBarangay, setIsLoadingBarangay] = useState(false);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateChatbotEnabled = async (enabled: boolean) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            userid: userProfile.id,
            key: 'chatbot_enabled',
            value: enabled.toString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'userid,key' }
        );

      if (error) throw error;

      await refreshSettings();

      toast({
        title: "Success",
        description: "Chatbot setting updated successfully"
      });
    } catch (error) {
      console.error('Error updating chatbot enabled:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot setting",
        variant: "destructive"
      });
    }
  };

  const updateChatbotMode = async (mode: string) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            userid: userProfile.id,
            key: 'chatbot_mode',
            value: mode,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'userid,key' }
        );

      if (error) throw error;

      await refreshSettings();

      toast({
        title: "Success",
        description: "Chatbot mode updated successfully"
      });
    } catch (error) {
      console.error('Error updating chatbot mode:', error);
      toast({
        title: "Error",
        description: "Failed to update chatbot mode",
        variant: "destructive"
      });
    }
  };

  const updateAddressAutoFill = async (enabled: boolean) => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase
        .from('settings')
        .upsert(
          {
            userid: userProfile.id,
            key: 'auto_fill_address_from_admin_barangay',
            value: enabled.toString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'userid,key' }
        );

      if (error) throw error;

      await refreshSettings();

      toast({
        title: "Setting updated",
        description: `Address auto-fill has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating address auto-fill setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load barangay settings
  useEffect(() => {
    const loadBarangaySettings = async () => {
      if (!userProfile?.brgyid || userProfile?.role !== 'admin') return;

      setIsLoadingBarangay(true);
      try {
        const { data, error } = await supabase
          .from('barangays')
          .select('phone, email, officehours')
          .eq('id', userProfile.brgyid)
          .single();

        if (error) throw error;

        if (data) {
          setBarangaySettings({
            phone: (data as any).phone || '',
            email: (data as any).email || '',
            officehours: (data as any).officehours || ''
          });
        }
      } catch (error) {
        console.error('Error loading barangay settings:', error);
      } finally {
        setIsLoadingBarangay(false);
      }
    };

    loadBarangaySettings();
  }, [userProfile?.brgyid, userProfile?.role]);

  const updateBarangaySettings = async () => {
    if (!userProfile?.brgyid || userProfile?.role !== 'admin') return;

    setIsLoadingBarangay(true);
    try {
      const { error } = await supabase
        .from('barangays')
        .update({
          phone: barangaySettings.phone,
          email: barangaySettings.email,
          officehours: barangaySettings.officehours,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.brgyid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Barangay settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating barangay settings:', error);
      toast({
        title: "Error",
        description: "Failed to update barangay settings",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBarangay(false);
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and system preferences.</p>
      </header>

      {/* Main Card Container */}
      <Card>
        <CardContent className="p-6 divide-y divide-border">
          
          {/* Section 1: General Preferences */}
          <div>
            <h2 className="text-xl font-bold">General Preferences</h2>
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Address Auto-Fill</h3>
                  <p className="text-sm text-muted-foreground">Automatically populate address fields based on your barangay when adding residents.</p>
                </div>
                {loading ? (
                  <div className="w-11 h-6 bg-muted rounded-full animate-pulse" />
                ) : (
                  <Switch 
                    checked={userSettings?.auto_fill_address_from_admin_barangay ?? true}
                    onCheckedChange={updateAddressAutoFill}
                  />
                )}
              </div>
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Auto-Save Changes</h3>
                  <p className="text-sm text-muted-foreground">Automatically save form changes as you work.</p>
                </div>
                <Switch 
                  checked={preferences.autoSaveChanges}
                  onCheckedChange={() => handlePreferenceChange('autoSaveChanges')}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Alexander Cabalan (Chatbot) */}
          <div className="pt-6">
            <h2 className="text-xl font-bold">Alexander Cabalan (Chatbot)</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure your AI assistant preferences.</p>
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Enable Chatbot</h3>
                  <p className="text-sm text-muted-foreground">Show or hide the floating chatbot button across the system.</p>
                </div>
                {loading ? (
                  <div className="w-11 h-6 bg-muted rounded-full animate-pulse" />
                ) : (
                  <Switch 
                    checked={userSettings?.chatbot_enabled ?? true}
                    onCheckedChange={updateChatbotEnabled}
                  />
                )}
              </div>
              {!loading && (userSettings?.chatbot_enabled ?? true) && (
                <div className="py-6 border-b border-border last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Chatbot Mode</h3>
                      <p className="text-sm text-muted-foreground">Select offline mode for basic responses or online mode for AI-powered responses.</p>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg bg-muted p-1">
                      <Button 
                        variant={userSettings?.chatbot_mode === 'offline' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => updateChatbotMode('offline')}
                        className="text-sm font-semibold"
                      >
                        🟠 Offline
                      </Button>
                      <Button 
                        variant={userSettings?.chatbot_mode === 'online' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => updateChatbotMode('online')}
                        className="text-sm font-semibold"
                      >
                        🟢 Online
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: User Interface Preferences */}
          <div className="pt-6">
            <h2 className="text-xl font-bold">User Interface Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">Customize your experience.</p>
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Welcome Message</h3>
                  <p className="text-sm text-muted-foreground">Show the welcome message on the main dashboard.</p>
                </div>
                <Switch 
                  checked={preferences.showWelcomeMessage}
                  onCheckedChange={() => handlePreferenceChange('showWelcomeMessage')}
                />
              </div>
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Theme</h3>
                  <p className="text-sm text-muted-foreground">Select your preferred interface theme.</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Section 4: Notification Preferences */}
          <div className="pt-6">
            <h2 className="text-xl font-bold">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage how you receive notifications.</p>
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">In-App Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications via the bell icon in the app.</p>
                </div>
                <Switch 
                  checked={notifications.inApp}
                  onCheckedChange={() => handleNotificationChange('inApp')}
                />
              </div>
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive important notifications via email.</p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange('email')}
                />
              </div>
              <div className="flex items-center justify-between py-6 border-b border-border last:border-b-0">
                <div>
                  <h3 className="font-semibold">Announcement Notifications</h3>
                  <p className="text-sm text-muted-foreground">Get notified about new barangay-wide announcements.</p>
                </div>
                <Switch 
                  checked={notifications.announcements}
                  onCheckedChange={() => handleNotificationChange('announcements')}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Barangay Settings (Admin Only) */}
          {userProfile?.role === 'admin' && (
            <div className="pt-6">
              <h2 className="text-xl font-bold">Barangay Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage your barangay contact information.</p>
              <div className="mt-4 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={barangaySettings.phone}
                      onChange={(e) => setBarangaySettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      disabled={isLoadingBarangay}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={barangaySettings.email}
                      onChange={(e) => setBarangaySettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      disabled={isLoadingBarangay}
                    />
                  </div>
                  <div>
                    <Label htmlFor="officehours">Office Hours</Label>
                    <Textarea
                      id="officehours"
                      value={barangaySettings.officehours}
                      onChange={(e) => setBarangaySettings(prev => ({ ...prev, officehours: e.target.value }))}
                      placeholder="Enter office hours (e.g., Monday-Friday 8:00 AM - 5:00 PM)"
                      disabled={isLoadingBarangay}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={updateBarangaySettings}
                    disabled={isLoadingBarangay}
                    className="w-full"
                  >
                    {isLoadingBarangay ? 'Saving...' : 'Save Barangay Settings'}
                  </Button>
                </div>
              </div>
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
