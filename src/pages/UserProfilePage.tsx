
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Camera, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Barangay {
  id: string;
  barangayname: string;
  municipality: string;
  province: string;
  region: string;
  country: string;
  created_at: string;
}

const UserProfilePage = () => {
  const { user, userProfile } = useAuth();
  const [barangay, setBarangay] = useState<Barangay | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  const [editData, setEditData] = useState({
    firstname: userProfile?.firstname || "",
    lastname: userProfile?.lastname || "",
    phone: userProfile?.phone || "",
    bio: "",
  });

  // Fetch barangay data when component mounts
  useEffect(() => {
    const fetchBarangayData = async () => {
      if (userProfile?.brgyid) {
        try {
          const { data, error } = await supabase
            .from("barangays")
            .select("*")
            .eq("id", userProfile.brgyid)
            .single();

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
        lastname: userProfile.lastname || "",
        phone: userProfile.phone || "",
        bio: "",
      });
      
      fetchBarangayData();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstname" className="text-sm font-medium text-gray-600">
                First Name
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="firstname"
                    name="firstname"
                    value={editData.firstname}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <span>{userProfile?.firstname || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastname" className="text-sm font-medium text-gray-600">
                Last Name
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="lastname"
                    name="lastname"
                    value={editData.lastname}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <span>{userProfile?.lastname || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-600">
                Email
              </Label>
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <span>{user?.email}</span>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-600">
                Phone Number
              </Label>
              <div className="relative">
                {editing ? (
                  <Input
                    id="phone"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <span>{userProfile?.phone || "Not set"}</span>
                  </div>
                )}
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-sm font-medium text-gray-600">
                Date of Birth
              </Label>
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <span>Not set</span>
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-gray-600">
                Country
              </Label>
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <span>{barangay?.country || "Philippines"}</span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium text-gray-600">
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
                  className="resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="p-3 border rounded-md bg-gray-50 min-h-[100px]">
                  <span className="text-gray-500">No bio added yet</span>
                </div>
              )}
              {!editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 text-blue-600"
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
                    firstname: userProfile?.firstname || "",
                    lastname: userProfile?.lastname || "",
                    phone: userProfile?.phone || "",
                    bio: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
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
