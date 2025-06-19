import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/AuthProvider";
import AddressAutoFillSetting from "@/components/settings/AddressAutoFillSetting";
import { useChatbotSettings } from "@/hooks/useChatbotSettings";

const SettingsPage = () => {
  const { userProfile } = useAuth();
  const { chatbotSettings, updateChatbotEnabled, updateChatbotMode } = useChatbotSettings();
  
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    announcements: true,
  });

  const [preferences, setPreferences] = useState({
    showWelcomeMessage: true,
    autoSaveChanges: false,
  });

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

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          {/* Address Auto-Fill Settings */}
          <div className="mb-6">
            <AddressAutoFillSetting />
          </div>

          {/* Chatbot Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Alexander Cabalan (Chatbot)</CardTitle>
              <CardDescription>Configure your AI assistant preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="chatbot-enabled">Enable Chatbot</Label>
                  <p className="text-sm text-muted-foreground">Show or hide the floating chatbot button</p>
                </div>
                <Switch 
                  id="chatbot-enabled" 
                  checked={chatbotSettings.enabled}
                  onCheckedChange={updateChatbotEnabled}
                />
              </div>
              
              {chatbotSettings.enabled && (
                <div className="space-y-3 pt-2 border-t">
                  <Label>Chatbot Mode</Label>
                  <RadioGroup 
                    value={chatbotSettings.mode} 
                    onValueChange={updateChatbotMode}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="offline" id="offline-mode" />
                      <Label htmlFor="offline-mode" className="cursor-pointer">
                        <div>
                          <div className="font-medium">🟠 Offline Mode</div>
                          <div className="text-xs text-muted-foreground">Local responses only</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online-mode" />
                      <Label htmlFor="online-mode" className="cursor-pointer">
                        <div>
                          <div className="font-medium">🟢 Online Mode</div>
                          <div className="text-xs text-muted-foreground">AI-powered responses</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={notifications.email}
                  onCheckedChange={() => handleNotificationChange('email')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
                </div>
                <Switch 
                  id="in-app-notifications" 
                  checked={notifications.inApp}
                  onCheckedChange={() => handleNotificationChange('inApp')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="announcement-notifications">Announcement Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified about new announcements</p>
                </div>
                <Switch 
                  id="announcement-notifications" 
                  checked={notifications.announcements}
                  onCheckedChange={() => handleNotificationChange('announcements')}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Interface Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <p className="text-sm text-muted-foreground">Show welcome message on dashboard</p>
                </div>
                <Switch 
                  id="welcome-message" 
                  checked={preferences.showWelcomeMessage}
                  onCheckedChange={() => handlePreferenceChange('showWelcomeMessage')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-save">Auto-Save Changes</Label>
                  <p className="text-sm text-muted-foreground">Automatically save form changes</p>
                </div>
                <Switch 
                  id="auto-save" 
                  checked={preferences.autoSaveChanges}
                  onCheckedChange={() => handlePreferenceChange('autoSaveChanges')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Information about your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <div className="font-medium">{userProfile?.username || "Not set"}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="font-medium">{userProfile?.role || "Not set"}</div>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" className="w-full">Change Password</Button>
              </div>
              
              <div>
                <Button variant="destructive" className="w-full">Deactivate Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
