
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const [originalBarangaySettings, setOriginalBarangaySettings] = useState({
    phone: '',
    email: '',
    officehours: ''
  });

  const [officeHoursStructured, setOfficeHoursStructured] = useState({
    startDay: 'Monday',
    endDay: 'Friday',
    startTime: '08:00',
    endTime: '17:00'
  });

  const [isLoadingBarangay, setIsLoadingBarangay] = useState(false);
  const [isEditingBarangay, setIsEditingBarangay] = useState(false);

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

  const parseOfficeHours = (officehours: string) => {
    // Try to parse existing office hours format
    // Example: "Monday-Friday 8:00 AM - 5:00 PM"
    const dayTimeMatch = officehours.match(/(\w+)-(\w+)\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    
    if (dayTimeMatch) {
      const [, startDay, endDay, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = dayTimeMatch;
      
      // Convert to 24-hour format
      let start24 = parseInt(startHour);
      let end24 = parseInt(endHour);
      
      if (startPeriod?.toLowerCase() === 'pm' && start24 !== 12) start24 += 12;
      if (startPeriod?.toLowerCase() === 'am' && start24 === 12) start24 = 0;
      if (endPeriod?.toLowerCase() === 'pm' && end24 !== 12) end24 += 12;
      if (endPeriod?.toLowerCase() === 'am' && end24 === 12) end24 = 0;
      
      return {
        startDay: startDay.charAt(0).toUpperCase() + startDay.slice(1).toLowerCase(),
        endDay: endDay.charAt(0).toUpperCase() + endDay.slice(1).toLowerCase(),
        startTime: `${start24.toString().padStart(2, '0')}:${startMin}`,
        endTime: `${end24.toString().padStart(2, '0')}:${endMin}`
      };
    }
    
    // Default values
    return {
      startDay: 'Monday',
      endDay: 'Friday',
      startTime: '08:00',
      endTime: '17:00'
    };
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
          const settings = {
            phone: (data as any).phone || '',
            email: (data as any).email || '',
            officehours: (data as any).officehours || ''
          };
          setBarangaySettings(settings);
          setOriginalBarangaySettings(settings);
          
          // Parse office hours for structured input
          const parsed = parseOfficeHours(settings.officehours);
          setOfficeHoursStructured(parsed);
        }
      } catch (error) {
        console.error('Error loading barangay settings:', error);
      } finally {
        setIsLoadingBarangay(false);
      }
    };

    loadBarangaySettings();
  }, [userProfile?.brgyid, userProfile?.role]);

  const formatOfficeHours = (structured: typeof officeHoursStructured) => {
    const { startDay, endDay, startTime, endTime } = structured;
    
    // Convert 24-hour to 12-hour format
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${period}`;
    };
    
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    if (startDay === endDay) {
      return `${startDay} ${formattedStartTime} - ${formattedEndTime}`;
    } else {
      return `${startDay}-${endDay} ${formattedStartTime} - ${formattedEndTime}`;
    }
  };

  const handleEditBarangay = () => {
    setIsEditingBarangay(true);
  };

  const handleCancelEdit = () => {
    setBarangaySettings(originalBarangaySettings);
    // Reset structured office hours too
    const parsed = parseOfficeHours(originalBarangaySettings.officehours);
    setOfficeHoursStructured(parsed);
    setIsEditingBarangay(false);
  };

  const updateBarangaySettings = async () => {
    if (!userProfile?.brgyid || userProfile?.role !== 'admin') return;

    // Format the structured office hours into a readable string
    const formattedOfficeHours = formatOfficeHours(officeHoursStructured);

    setIsLoadingBarangay(true);
    try {
      const { error } = await supabase
        .from('barangays')
        .update({
          phone: barangaySettings.phone,
          email: barangaySettings.email,
          officehours: formattedOfficeHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.brgyid);

      if (error) throw error;

      // Update the local state with the formatted office hours
      const updatedSettings = {
        ...barangaySettings,
        officehours: formattedOfficeHours
      };
      setBarangaySettings(updatedSettings);
      setOriginalBarangaySettings(updatedSettings);
      setIsEditingBarangay(false);

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
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Barangay Settings</h2>
                {!isEditingBarangay && (
                  <Button variant="outline" size="sm" onClick={handleEditBarangay}>
                    Edit
                  </Button>
                )}
              </div>
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
                      disabled={!isEditingBarangay || isLoadingBarangay}
                      className={!isEditingBarangay ? "bg-muted" : ""}
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
                      disabled={!isEditingBarangay || isLoadingBarangay}
                      className={!isEditingBarangay ? "bg-muted" : ""}
                    />
                  </div>
                  <div>
                    <Label>Office Hours</Label>
                    <div className="space-y-3">
                      {!isEditingBarangay ? (
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {barangaySettings.officehours || 'No office hours set'}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">From Day</Label>
                              <Select
                                value={officeHoursStructured.startDay}
                                onValueChange={(value) => setOfficeHoursStructured(prev => ({ ...prev, startDay: value }))}
                                disabled={isLoadingBarangay}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Monday">Monday</SelectItem>
                                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                                  <SelectItem value="Thursday">Thursday</SelectItem>
                                  <SelectItem value="Friday">Friday</SelectItem>
                                  <SelectItem value="Saturday">Saturday</SelectItem>
                                  <SelectItem value="Sunday">Sunday</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">To Day</Label>
                              <Select
                                value={officeHoursStructured.endDay}
                                onValueChange={(value) => setOfficeHoursStructured(prev => ({ ...prev, endDay: value }))}
                                disabled={isLoadingBarangay}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Monday">Monday</SelectItem>
                                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                                  <SelectItem value="Thursday">Thursday</SelectItem>
                                  <SelectItem value="Friday">Friday</SelectItem>
                                  <SelectItem value="Saturday">Saturday</SelectItem>
                                  <SelectItem value="Sunday">Sunday</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Start Time</Label>
                              <Input
                                type="time"
                                value={officeHoursStructured.startTime}
                                onChange={(e) => setOfficeHoursStructured(prev => ({ ...prev, startTime: e.target.value }))}
                                disabled={isLoadingBarangay}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">End Time</Label>
                              <Input
                                type="time"
                                value={officeHoursStructured.endTime}
                                onChange={(e) => setOfficeHoursStructured(prev => ({ ...prev, endTime: e.target.value }))}
                                disabled={isLoadingBarangay}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            Preview: {formatOfficeHours(officeHoursStructured)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isEditingBarangay && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={updateBarangaySettings}
                        disabled={isLoadingBarangay}
                        className="flex-1"
                      >
                        {isLoadingBarangay ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isLoadingBarangay}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
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
