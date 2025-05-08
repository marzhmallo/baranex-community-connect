
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, PencilLine, Save, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  const [lastEditDate, setLastEditDate] = useState<Date | null>(null);

  const [editData, setEditData] = useState({
    firstname: userProfile?.firstname || "",
    middlename: userProfile?.middlename || "",
    lastname: userProfile?.lastname || "",
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
          if (data) setBarangay(data);
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

    // Check if user can edit profile (not edited in last 60 days)
    const checkEditRestriction = async () => {
      if (userProfile?.id) {
        try {
          // Check for last_edit_date in the profile or activity logs
          // This is a simplified example - you may need to implement the actual logic
          const lastEdit = new Date();
          lastEdit.setDate(lastEdit.getDate() - 70); // Example: last edit was 70 days ago
          setLastEditDate(lastEdit);

          // Check if 60 days have passed since last edit
          const daysSinceLastEdit = Math.floor((Date.now() - lastEdit.getTime()) / (1000 * 60 * 60 * 24));
          setCanEdit(daysSinceLastEdit >= 60);
        } catch (error) {
          console.error("Error checking edit restrictions:", error);
        }
      }
    };

    fetchBarangayData();
    checkEditRestriction();
  }, [userProfile]);

  const handleEditToggle = () => {
    if (!canEdit) {
      toast({
        title: "Edit Restricted",
        description: "You can only edit your profile once every 60 days",
        variant: "destructive",
      });
      return;
    }
    
    setEditing(!editing);
    if (!editing) {
      // Reset form data when starting edit
      setEditData({
        firstname: userProfile?.firstname || "",
        middlename: userProfile?.middlename || "",
        lastname: userProfile?.lastname || "",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update the profile
      const { error } = await supabase
        .from("profiles")
        .update({
          firstname: editData.firstname,
          middlename: editData.middlename,
          lastname: editData.lastname,
          // You would also update last_edit_date here if you implement that column
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state with new values
      if (userProfile) {
        userProfile.firstname = editData.firstname;
        userProfile.middlename = editData.middlename;
        userProfile.lastname = editData.lastname;
      }

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
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Personal Information</span>
                {!editing ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditToggle}
                    disabled={!canEdit}
                  >
                    <PencilLine className="h-4 w-4 mr-1" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleEditToggle}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Your account information
                {!canEdit && lastEditDate && (
                  <div className="mt-1 text-amber-500">
                    Profile editing restricted until {new Date(lastEditDate.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <div className="font-medium">{userProfile?.username || "Not set"}</div>
                </div>
                
                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="font-medium">{user?.email}</div>
                </div>

                {/* First Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="firstname"
                      value={editData.firstname}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <div className="font-medium">{userProfile?.firstname || "Not set"}</div>
                  )}
                </div>

                {/* Middle Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Middle Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="middlename"
                      value={editData.middlename}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <div className="font-medium">{userProfile?.middlename || "Not set"}</div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="lastname"
                      value={editData.lastname}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <div className="font-medium">{userProfile?.lastname || "Not set"}</div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="font-medium">{userProfile?.phone || "Not set"}</div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="font-medium">{userProfile?.status || "Not set"}</div>
                </div>

                {/* Role */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="font-medium">{userProfile?.role || "Not set"}</div>
                </div>

                {/* Created At */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <div className="font-medium">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "Not available"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Barangay Information</CardTitle>
              <CardDescription>Your assigned barangay details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {barangay ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Barangay Name</label>
                    <div className="font-medium">{barangay.barangayname}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Municipality</label>
                    <div className="font-medium">{barangay.municipality}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Province</label>
                    <div className="font-medium">{barangay.province}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Region</label>
                    <div className="font-medium">{barangay.region || "Not set"}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                    <div className="font-medium">{barangay.country || "Not set"}</div>
                  </div>

                  <Separator className="my-3" />
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Barangay Created</label>
                    <div className="font-medium">{new Date(barangay.created_at).toLocaleDateString()}</div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground italic">No barangay information available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
