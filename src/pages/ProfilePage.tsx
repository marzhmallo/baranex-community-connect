import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Edit, Save, X, Camera, Search, Eye, Lock, User, Key, Activity, Settings, Shield } from "lucide-react";

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
        try {
          const { data } = await supabase.storage
            .from('profilepictures')
            .createSignedUrl(userProfile.profile_picture, 3600);
          
          if (data?.signedUrl) {
            setProfilePhotoUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error fetching profile photo:', error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        {/* Main Profile Header Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 cursor-pointer group">
              <img 
                src={profilePhotoUrl || `https://placehold.co/96x96/3B82F6/FFFFFF?text=${getInitials()}`}
                alt="User Avatar" 
                className="w-24 h-24 rounded-full ring-4 ring-gray-700 object-cover"
                onClick={() => editing ? document.getElementById('avatar-upload')?.click() : setShowPhotoModal(true)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {editing ? (
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
              <h1 className="text-3xl font-bold text-white">
                {userProfile?.firstname} {userProfile?.lastname}
              </h1>
              <p className="text-gray-400 mt-1">
                {userProfile?.username} &middot; <span className="font-semibold text-yellow-400">{userProfile?.role}</span>
              </p>
            </div>

            {/* Action Buttons */}
            {!editing ? (
              <div className="flex-shrink-0 flex gap-3">
                <button 
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
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
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex -mb-px space-x-6">
            <button 
              onClick={() => setActiveTab('personal')}
              className={`py-3 px-6 cursor-pointer border-b-2 font-semibold transition-all ${
                activeTab === 'personal' 
                  ? 'text-blue-500 border-blue-500' 
                  : 'text-gray-400 border-transparent hover:text-gray-100'
              }`}
            >
              Personal Information
            </button>
            <button 
              onClick={() => setActiveTab('barangay')}
              className={`py-3 px-6 cursor-pointer border-b-2 font-semibold transition-all ${
                activeTab === 'barangay' 
                  ? 'text-blue-500 border-blue-500' 
                  : 'text-gray-400 border-transparent hover:text-gray-100'
              }`}
            >
              Barangay Information
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`py-3 px-6 cursor-pointer border-b-2 font-semibold transition-all ${
                activeTab === 'security' 
                  ? 'text-blue-500 border-blue-500' 
                  : 'text-gray-400 border-transparent hover:text-gray-100'
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
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Your Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">Username</span>
                  <span className="font-semibold text-white">{userProfile?.username || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">Email</span>
                  <span className="font-semibold text-white">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">First Name</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="firstname"
                      value={editData.firstname}
                      onChange={handleInputChange}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-white">{userProfile?.firstname || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">Last Name</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="lastname"
                      value={editData.lastname}
                      onChange={handleInputChange}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-white">{userProfile?.lastname || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">Middle Name</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="middlename"
                      value={editData.middlename}
                      onChange={handleInputChange}
                      placeholder="Not set"
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-gray-500 italic">{userProfile?.middlename || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">Phone</span>
                  {editing ? (
                    <input 
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleInputChange}
                      placeholder="Not set"
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white w-60%"
                    />
                  ) : (
                    <span className="font-semibold text-gray-500 italic">{userProfile?.phone || "Not set"}</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <span className="text-gray-400">Status</span>
                  <span className="font-semibold text-green-400">{userProfile?.status}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-gray-400">Role</span>
                  <span className="font-semibold text-yellow-400">{userProfile?.role}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-gray-400">Account Created</span>
                  <span className="font-semibold text-white">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "Not available"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Barangay Information Panel */}
          {activeTab === 'barangay' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Your Assigned Barangay Details</h2>
              {barangay ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="flex justify-between items-center py-4 border-b border-gray-700">
                    <span className="text-gray-400">Barangay Name</span>
                    <span className="font-semibold text-white">{barangay.barangayname}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-700">
                    <span className="text-gray-400">Municipality</span>
                    <span className="font-semibold text-white">{barangay.municipality}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-700">
                    <span className="text-gray-400">Province</span>
                    <span className="font-semibold text-white">{barangay.province}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-700">
                    <span className="text-gray-400">Region</span>
                    <span className="font-semibold text-white">{barangay.region}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-gray-700">
                    <span className="text-gray-400">Country</span>
                    <span className="font-semibold text-white">{barangay.country}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-gray-400">Barangay Onboarded</span>
                    <span className="font-semibold text-white">{new Date(barangay.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 italic">No barangay information available</div>
              )}
            </div>
          )}

          {/* Security Panel */}
          {activeTab === 'security' && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Security Settings</h2>
              <div className="space-y-1">
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <p className="font-semibold text-white">Multi-Factor Authentication</p>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors">
                    Manage
                  </button>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-700">
                  <p className="font-semibold text-white">Active Sessions</p>
                  <a href="#" className="text-blue-400 hover:underline font-semibold">View Sessions</a>
                </div>
                <div className="flex justify-between items-center py-4">
                  <p className="font-semibold text-white">Activity Log</p>
                  <a href="#" className="text-blue-400 hover:underline font-semibold">View Log</a>
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
    </div>
  );
};

export default ProfilePage;