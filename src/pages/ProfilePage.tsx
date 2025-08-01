import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Edit, Save, X, Camera, Search, Eye, Lock, User, Key, Activity, Settings, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Barangay {
  id: string;
  barangayname: string;
  municipality: string;
  province: string;
  region: string;
  country: string;
  created_at: string;
}

const ProfilePage = () => {
  const { user, userProfile } = useAuth();
  const [barangay, setBarangay] = useState<Barangay | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'barangay' | 'security'>('personal');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [editData, setEditData] = useState({
    firstname: userProfile?.firstname || "",
    middlename: userProfile?.middlename || "",
    lastname: userProfile?.lastname || "",
    phone: userProfile?.phone || "",
  });

  // Generate initials from name
  const getInitials = () => {
    const first = userProfile?.firstname || "";
    const last = userProfile?.lastname || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "AD";
  };

  // Fetch profile photo from storage
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (userProfile?.profile_picture) {
        setPhotoLoading(true);
        try {
          const { data } = await supabase.storage
            .from('profilepictures')
            .createSignedUrl(userProfile.profile_picture, 3600);
          
          if (data?.signedUrl) {
            setProfilePhotoUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error fetching profile photo:', error);
        } finally {
          setPhotoLoading(false);
        }
      }
    };

    if (userProfile) {
      fetchProfilePhoto();
    }
  }, [userProfile]);

  // Fetch barangay data when component mounts
  useEffect(() => {
    const fetchBarangayData = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from("barangays")
            .select("*")
            .eq("id", userProfile.brgyid)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            setBarangay(data);
          }
        } catch (error) {
          console.error("Error fetching barangay data:", error);
          toast({
            title: "Error",
            description: "Failed to load barangay information",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    if (userProfile) {
      setEditData({
        firstname: userProfile.firstname || "",
        middlename: userProfile.middlename || "",
        lastname: userProfile.lastname || "",
        phone: userProfile.phone || "",
      });
      
      fetchBarangayData();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `admins/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profilepictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update profile with new photo path
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: filePath })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Get new signed URL
      const { data } = await supabase.storage
        .from('profilepictures')
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        setProfilePhotoUrl(data.signedUrl);
      }

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          firstname: editData.firstname,
          middlename: editData.middlename,
          lastname: editData.lastname,
          phone: editData.phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      firstname: userProfile?.firstname || "",
      middlename: userProfile?.middlename || "",
      lastname: userProfile.lastname || "",
      phone: userProfile?.phone || "",
    });
    setEditing(false);
  };

  // Password change functionality
  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      // If current password is provided, reauthenticate first
      if (passwordData.currentPassword) {
        const { error: reauthError } = await supabase.auth.reauthenticate();
        
        if (reauthError) {
          toast({
            title: "Error",
            description: "Current password is incorrect",
            variant: "destructive",
          });
          return;
        }
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        {/* Main Profile Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 cursor-pointer group">
              {photoLoading ? (
                <div className="w-24 h-24 rounded-full ring-4 ring-border bg-muted flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <img 
                  src={profilePhotoUrl || `https://placehold.co/96x96/3B82F6/FFFFFF?text=${getInitials()}`}
                  alt="User Avatar" 
                  className="w-24 h-24 rounded-full ring-4 ring-border object-cover"
                  onClick={() => editing ? document.getElementById('avatar-upload')?.click() : setShowPhotoModal(true)}
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : editing ? (
                  <>
                    <Camera className="w-5 h-5 text-white mb-1" />
                    <span className="text-xs font-semibold text-white">Change</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 text-white mb-1" />
                    <span className="text-xs font-semibold text-white">View</span>
                  </>
                )}
              </div>
              <input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-3xl font-bold text-foreground">
                {userProfile?.firstname} {userProfile?.lastname}
              </h1>
              <p className="text-muted-foreground mt-1">
                {userProfile?.username} &middot; <span className="font-semibold text-primary">{userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || ""}</span>
              </p>
            </div>

            {/* Action Buttons */}
            {!editing ? (
              <div className="flex-shrink-0 flex gap-3">
                <button 
                  onClick={() => setEditing(true)}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0 flex gap-3">
                <button 
                  onClick={handleSave}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                <button 
                  onClick={handleCancel}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border mb-8">
          <nav className="flex -mb-px space-x-6">
            <button 
              onClick={() => setActiveTab('personal')}
              className={`py-3 px-6 cursor-pointer border-b-2 font-semibold transition-all ${
                activeTab === 'personal' 
                  ? 'text-primary border-primary' 
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              Personal Information
            </button>
            <button 
              onClick={() => setActiveTab('barangay')}
              className={`py-3 px-6 cursor-pointer border-b-2 font-semibold transition-all ${
                activeTab === 'barangay' 
                  ? 'text-primary border-primary' 
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              Barangay Information
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`py-3 px-6 cursor-pointer border-b-2 font-semibold transition-all ${
                activeTab === 'security' 
                  ? 'text-primary border-primary' 
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              Security
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {/* Personal Information Panel */}
          {activeTab === 'personal' && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Your Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-semibold text-foreground">{userProfile?.username || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold text-foreground">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">First Name</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="firstname"
                      value={editData.firstname}
                      onChange={handleInputChange}
                      className="bg-input border border-border rounded px-2 py-1 text-foreground w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">{userProfile?.firstname || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Last Name</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="lastname"
                      value={editData.lastname}
                      onChange={handleInputChange}
                      className="bg-input border border-border rounded px-2 py-1 text-foreground w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">{userProfile?.lastname || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Middle Name</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="middlename"
                      value={editData.middlename}
                      onChange={handleInputChange}
                      placeholder="Not set"
                      className="bg-input border border-border rounded px-2 py-1 text-foreground w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-muted-foreground italic">{userProfile?.middlename || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Phone</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleInputChange}
                      placeholder="Not set"
                      className="bg-input border border-border rounded px-2 py-1 text-foreground w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-muted-foreground italic">{userProfile?.phone || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold text-green-500">{userProfile?.status?.charAt(0).toUpperCase() + userProfile?.status?.slice(1) || ""}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-semibold text-primary">{userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || ""}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="font-semibold text-foreground">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "Not available"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Barangay Information Panel */}
          {activeTab === 'barangay' && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Your Assigned Barangay Details</h2>
              {barangay ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Barangay Name</span>
                    <span className="font-semibold text-foreground">{barangay.barangayname}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Municipality</span>
                    <span className="font-semibold text-foreground">{barangay.municipality}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Province</span>
                    <span className="font-semibold text-foreground">{barangay.province}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Region</span>
                    <span className="font-semibold text-foreground">{barangay.region}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-border">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-semibold text-foreground">{barangay.country}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-muted-foreground">Barangay Onboarded</span>
                    <span className="font-semibold text-foreground">{new Date(barangay.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic">No barangay information available</div>
              )}
            </div>
          )}

          {/* Security Panel */}
          {activeTab === 'security' && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Security Settings</h2>
              <div className="space-y-1">
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <p className="font-semibold text-foreground">Multi-Factor Authentication</p>
                  <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded text-sm font-semibold transition-colors">
                    Manage
                  </button>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <p className="font-semibold text-foreground">Active Sessions</p>
                  <a href="#" className="text-primary hover:underline font-semibold">View Sessions</a>
                </div>
                <div className="flex justify-between items-center py-4">
                  <p className="font-semibold text-foreground">Activity Log</p>
                  <a href="#" className="text-primary hover:underline font-semibold">View Log</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {showPhotoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative">
            <button 
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 text-white text-2xl cursor-pointer hover:text-gray-300"
            >
              ×
            </button>
            <img 
              src={profilePhotoUrl || `https://placehold.co/400x400/3B82F6/FFFFFF?text=${getInitials()}`}
              alt="Full size profile picture"
              className="max-w-90vw max-h-80vh rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password (Optional)</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  currentPassword: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  newPassword: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="flex-1"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                }}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;