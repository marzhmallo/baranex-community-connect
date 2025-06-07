import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";

interface Barangay {
  id: string;
  barangayname: string;
  municipality: string;
  province: string;
  region: string;
  country: string;
  created_at: string;
}

interface ProfileData {
  id: string;
  firstname: string;
  lastname: string;
  middlename: string;
  phone: string;
  bio: string;
  gender: string;
  bday: string;
  profile_picture: string;
  created_at: string;
  role: string;
}

const UserProfilePage = () => {
  const { user, userProfile } = useAuth();
  const [barangay, setBarangay] = useState<Barangay | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [editData, setEditData] = useState({
    firstname: "",
    lastname: "",
    middlename: "",
    phone: "",
    bio: "",
  });

  // Fetch profile and barangay data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          // Fetch profile data
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError) throw profileError;
          
          if (profile) {
            setProfileData(profile);
            setEditData({
              firstname: profile.firstname || "",
              lastname: profile.lastname || "",
              middlename: profile.middlename || "",
              phone: profile.phone || "",
              bio: profile.bio || "",
            });

            // Fetch barangay data if brgyid exists
            if (profile.brgyid) {
              const { data: barangayData, error: barangayError } = await supabase
                .from("barangays")
                .select("*")
                .eq("id", profile.brgyid)
                .single();

              if (barangayError) throw barangayError;
              if (barangayData) {
                setBarangay(barangayData);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({
            title: "Error",
            description: "Failed to load profile information",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          firstname: editData.firstname,
          lastname: editData.lastname,
          middlename: editData.middlename,
          phone: editData.phone,
          bio: editData.bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        firstname: editData.firstname,
        lastname: editData.lastname,
        middlename: editData.middlename,
        phone: editData.phone,
        bio: editData.bio,
      } : null);

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
      setLoading(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setProfileData(prev => prev ? { ...prev, profile_picture: url } : null);
  };

  const getUserInitials = () => {
    if (profileData?.firstname && profileData?.lastname) {
      return `${profileData.firstname.charAt(0)}${profileData.lastname.charAt(0)}`.toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFullAddress = () => {
    if (!barangay) return "Address not available";
    return `${barangay.barangayname}, ${barangay.municipality}, ${barangay.province}, ${barangay.region}, ${barangay.country}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl bg-background min-h-screen">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <ProfilePictureUpload
              userId={user?.id || ""}
              currentPhotoUrl={profileData?.profile_picture}
              onPhotoUploaded={handlePhotoUploaded}
              userInitials={getUserInitials()}
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstname" className="text-sm font-medium text-muted-foreground">
                First Name
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="firstname"
                    name="firstname"
                    value={editData.firstname}
                    onChange={handleInputChange}
                    className="pr-10 bg-background border-input text-foreground"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                    <span className="text-foreground">{profileData?.firstname || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastname" className="text-sm font-medium text-muted-foreground">
                Last Name
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="lastname"
                    name="lastname"
                    value={editData.lastname}
                    onChange={handleInputChange}
                    className="pr-10 bg-background border-input text-foreground"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                    <span className="text-foreground">{profileData?.lastname || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Middle Name */}
            <div className="space-y-2">
              <Label htmlFor="middlename" className="text-sm font-medium text-muted-foreground">
                Middle Name
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="middlename"
                    name="middlename"
                    value={editData.middlename}
                    onChange={handleInputChange}
                    className="pr-10 bg-background border-input text-foreground"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                    <span className="text-foreground">{profileData?.middlename || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email
              </Label>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                <span className="text-foreground">{user?.email}</span>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    ✓ Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">
                Phone Number
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="phone"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="pr-10 bg-background border-input text-foreground"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                    <span className="text-foreground">{profileData?.phone || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-sm font-medium text-muted-foreground">
                Gender
              </Label>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                <span className="text-foreground">{profileData?.gender || "Not set"}</span>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="text-sm font-medium text-muted-foreground">
                Date of Birth
              </Label>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                <span className="text-foreground">
                  {profileData?.bday ? formatDate(profileData.bday) : "Not set"}
                </span>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium text-muted-foreground">
                Role
              </Label>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                <span className="text-foreground capitalize">{profileData?.role || "User"}</span>
              </div>
            </div>

            {/* Account Created (shortened) */}
            <div className="space-y-2">
              <Label htmlFor="created_at" className="text-sm font-medium text-muted-foreground">
                Account Created
              </Label>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                <span className="text-foreground">
                  {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "Not available"}
                </span>
              </div>
            </div>

            {/* Address (full width, before bio) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium text-muted-foreground">
                Address
              </Label>
              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/50">
                <span className="text-foreground">{getFullAddress()}</span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium text-muted-foreground">
              Bio
            </Label>
            <div className="relative">
              {editing ? (
                <Textarea
                  id="bio"
                  name="bio"
                  value={editData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="resize-none bg-background border-input text-foreground"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="p-3 border border-border rounded-md bg-muted/50 min-h-[100px]">
                  <span className="text-foreground">
                    {profileData?.bio || <span className="text-muted-foreground">No bio added yet</span>}
                  </span>
                </div>
              )}
              {!editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 text-primary hover:text-primary/80"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {editing && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setEditData({
                    firstname: profileData?.firstname || "",
                    lastname: profileData?.lastname || "",
                    middlename: profileData?.middlename || "",
                    phone: profileData?.phone || "",
                    bio: profileData?.bio || "",
                  });
                }}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
