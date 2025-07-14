
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
        console.log("Fetching barangay data for profile page:", userProfile.brgyid);
        try {
          const { data, error } = await supabase
            .from("barangays")
            .select("*")
            .eq("id", userProfile.brgyid)
            .single();

          if (error) throw error;
          if (data) {
            console.log("Barangay data loaded:", data);
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
      } else {
        console.log("No barangay ID available in user profile");
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

    if (userProfile) {
      console.log("User profile is available, setting edit data:", userProfile);
      setEditData({
        firstname: userProfile.firstname || "",
        middlename: userProfile.middlename || "",
        lastname: userProfile.lastname || "",
      });
      
      fetchBarangayData();
      checkEditRestriction();
    } else {
      console.log("No user profile available yet");
      setLoading(false);
    }
  }, [userProfile]);

  // Update edit data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setEditData({
        firstname: userProfile.firstname || "",
        middlename: userProfile.middlename || "",
        lastname: userProfile.lastname || "",
      });
    }
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

  console.log("Rendering profile page with user:", user?.id);
  console.log("User profile data:", userProfile);
  console.log("Barangay data:", barangay);

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





<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Webcrumbs Plugin</title>
        <style>
            @import url(https://fonts.googleapis.com/css2?family=Lato&display=swap);
            @import url(https://fonts.googleapis.com/css2?family=Open+Sans&display=swap);
            @import url(https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&text=event_note,refresh,search,expand_more,login,more_vert,add,computer,backup,edit,delete,download,chevron_left,chevron_right,filter_alt,schedule,close,map,print);
        </style>
    </head>
    <body>
        <div id="webcrumbs">
            <div class="w-full min-h-screen bg-gray-50 p-6">
                <div class="max-w-7xl mx-auto">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <span class="material-symbols-outlined text-white text-2xl">event_note</span>
                                    </div>
                                    <div>
                                        <h1 class="text-2xl font-bold text-white">Activity Logs</h1>
                                        <p class="text-primary-100 text-sm">
                                            Track all user activities and system events
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="px-3 py-1 bg-white bg-opacity-20 rounded-full">
                                        <span class="text-white text-sm font-medium">1,247 Total Logs</span>
                                    </div>
                                    <button
                                        class="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
                                    >
                                        <span class="material-symbols-outlined text-white">refresh</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="p-6 border-b border-gray-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div class="relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-2"
                                        >Search Activities</label
                                    >
                                    <div class="relative">
                                        <span
                                            class="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                            >search</span
                                        >
                                        <input
                                            type="text"
                                            placeholder="Search by action, user, or details..."
                                            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>
                                <div class="relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Sort by User</label>
                                    <details class="relative">
                                        <summary
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors duration-200 flex items-center justify-between"
                                        >
                                            <span class="text-gray-700">All Users</span>
                                            <span
                                                class="material-symbols-outlined transform transition-transform duration-200"
                                                >expand_more</span
                                            >
                                        </summary>
                                        <div
                                            class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1"
                                        >
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                All Users
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Admin Users
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Regular Users
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                System
                                            </div>
                                        </div>
                                    </details>
                                </div>
                                <div class="relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Sort by Action</label>
                                    <details class="relative">
                                        <summary
                                            class="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors duration-200 flex items-center justify-between"
                                        >
                                            <span class="text-gray-700">All Actions</span>
                                            <span
                                                class="material-symbols-outlined transform transition-transform duration-200"
                                                >expand_more</span
                                            >
                                        </summary>
                                        <div
                                            class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1"
                                        >
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                All Actions
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Login
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Create
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Update
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Delete
                                            </div>
                                            <div
                                                class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            >
                                                Export
                                            </div>
                                        </div>
                                    </details>
                                </div>
                                <div class="relative">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                    <input
                                        type="date"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Timestamp
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            User
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Action
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Resource
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Details
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            IP Address
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Status
                                        </th>
                                        <th
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">2024-01-15 09:23:45</div>
                                            <div class="text-xs text-gray-500">5 minutes ago</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div
                                                    class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="text-white text-xs font-medium">JD</span>
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">John Doe</div>
                                                    <div class="text-sm text-gray-500">Admin</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                <span class="material-symbols-outlined text-xs mr-1">login</span> Login
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Admin Dashboard
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">Successful authentication</div>
                                            <div class="text-xs text-gray-500">Browser: Chrome 120.0.0.0</div>
                                            <div class="text-xs text-gray-500">OS: Windows 10</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.100</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                Success
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <details class="relative">
                                                <summary
                                                    class="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                                                >
                                                    <span class="material-symbols-outlined">more_vert</span>
                                                </summary>
                                                <div
                                                    class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32"
                                                >
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        View Details
                                                    </div>
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        Export
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">2024-01-15 09:18:32</div>
                                            <div class="text-xs text-gray-500">10 minutes ago</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div
                                                    class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="text-white text-xs font-medium">MS</span>
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">Maria Santos</div>
                                                    <div class="text-sm text-gray-500">Staff</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                <span class="material-symbols-outlined text-xs mr-1">add</span> Create
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Resident Record
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">Created new resident profile</div>
                                            <div class="text-xs text-gray-500">Name: Juan Cruz</div>
                                            <div class="text-xs text-gray-500">ID: RES-2024-001</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.105</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                Success
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <details class="relative">
                                                <summary
                                                    class="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                                                >
                                                    <span class="material-symbols-outlined">more_vert</span>
                                                </summary>
                                                <div
                                                    class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32"
                                                >
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        View Details
                                                    </div>
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        Export
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">2024-01-15 09:15:21</div>
                                            <div class="text-xs text-gray-500">13 minutes ago</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div
                                                    class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="material-symbols-outlined text-white text-xs"
                                                        >computer</span
                                                    >
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">System</div>
                                                    <div class="text-sm text-gray-500">Automated</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                            >
                                                <span class="material-symbols-outlined text-xs mr-1">backup</span>
                                                Backup
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Database</td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">Daily database backup completed</div>
                                            <div class="text-xs text-gray-500">Size: 2.5 GB</div>
                                            <div class="text-xs text-gray-500">
                                                Location: /backups/daily_20240115.sql
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">127.0.0.1</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                Success
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <details class="relative">
                                                <summary
                                                    class="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                                                >
                                                    <span class="material-symbols-outlined">more_vert</span>
                                                </summary>
                                                <div
                                                    class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32"
                                                >
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        View Details
                                                    </div>
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        Export
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">2024-01-15 09:12:18</div>
                                            <div class="text-xs text-gray-500">16 minutes ago</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div
                                                    class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="text-white text-xs font-medium">RP</span>
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">Robert Perez</div>
                                                    <div class="text-sm text-gray-500">Staff</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                                            >
                                                <span class="material-symbols-outlined text-xs mr-1">edit</span> Update
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Barangay Clearance
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">Updated clearance status</div>
                                            <div class="text-xs text-gray-500">Document ID: BC-2024-0089</div>
                                            <div class="text-xs text-gray-500">Status: Pending → Approved</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.108</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                Success
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <details class="relative">
                                                <summary
                                                    class="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                                                >
                                                    <span class="material-symbols-outlined">more_vert</span>
                                                </summary>
                                                <div
                                                    class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32"
                                                >
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        View Details
                                                    </div>
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        Export
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">2024-01-15 09:08:55</div>
                                            <div class="text-xs text-gray-500">19 minutes ago</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div
                                                    class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="text-white text-xs font-medium">AL</span>
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">Anna Lopez</div>
                                                    <div class="text-sm text-gray-500">Admin</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                            >
                                                <span class="material-symbols-outlined text-xs mr-1">delete</span>
                                                Delete
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User Account</td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">Deleted inactive user account</div>
                                            <div class="text-xs text-gray-500">User: test_user@barangay.gov</div>
                                            <div class="text-xs text-gray-500">
                                                Reason: Account inactive for 90 days
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.102</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                Success
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <details class="relative">
                                                <summary
                                                    class="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                                                >
                                                    <span class="material-symbols-outlined">more_vert</span>
                                                </summary>
                                                <div
                                                    class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32"
                                                >
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        View Details
                                                    </div>
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        Export
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-gray-50 transition-colors duration-200">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">2024-01-15 09:05:12</div>
                                            <div class="text-xs text-gray-500">23 minutes ago</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div
                                                    class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="text-white text-xs font-medium">CT</span>
                                                </div>
                                                <div class="ml-3">
                                                    <div class="text-sm font-medium text-gray-900">Carlos Torres</div>
                                                    <div class="text-sm text-gray-500">Staff</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                            >
                                                <span class="material-symbols-outlined text-xs mr-1">download</span>
                                                Export
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Resident Report
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="text-sm text-gray-900">
                                                Generated resident demographics report
                                            </div>
                                            <div class="text-xs text-gray-500">Format: PDF</div>
                                            <div class="text-xs text-gray-500">Records: 1,245 residents</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">192.168.1.112</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                            >
                                                Success
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <details class="relative">
                                                <summary
                                                    class="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                                                >
                                                    <span class="material-symbols-outlined">more_vert</span>
                                                </summary>
                                                <div
                                                    class="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1 w-32"
                                                >
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        View Details
                                                    </div>
                                                    <div
                                                        class="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                                    >
                                                        Export
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm text-gray-700">Showing</span>
                                    <details class="relative">
                                        <summary
                                            class="px-3 py-1 border border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors duration-200"
                                        >
                                            <span class="text-sm">10</span>
                                        </summary>
                                        <div
                                            class="absolute bottom-full left-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 py-1"
                                        >
                                            <div
                                                class="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                            >
                                                5
                                            </div>
                                            <div
                                                class="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                            >
                                                10
                                            </div>
                                            <div
                                                class="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                            >
                                                25
                                            </div>
                                            <div
                                                class="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors duration-200 text-sm"
                                            >
                                                50
                                            </div>
                                        </div>
                                    </details>
                                    <span class="text-sm text-gray-700">of 1,247 results</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button
                                        class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                                    >
                                        <span class="material-symbols-outlined text-sm">chevron_left</span>
                                    </button>
                                    <button
                                        class="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors duration-200"
                                    >
                                        1
                                    </button>
                                    <button
                                        class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        2
                                    </button>
                                    <button
                                        class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        3
                                    </button>
                                    <span class="px-2 text-gray-500">...</span>
                                    <button
                                        class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        125
                                    </button>
                                    <button
                                        class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-4 bg-white border-t border-gray-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <button
                                        class="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                                    >
                                        <span class="material-symbols-outlined text-sm">download</span>
                                        <span>Export Logs</span>
                                    </button>
                                    <button
                                        class="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <span class="material-symbols-outlined text-sm">filter_alt</span>
                                        <span>Advanced Filter</span>
                                    </button>
                                </div>
                                <div class="flex items-center space-x-2 text-sm text-gray-600">
                                    <span class="material-symbols-outlined text-sm">schedule</span>
                                    <span>Last updated: 2 minutes ago</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div
                                    class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                                >
                                    <div
                                        class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between"
                                    >
                                        <div class="flex items-center space-x-3">
                                            <div class="p-2 bg-white bg-opacity-20 rounded-lg">
                                                <span class="material-symbols-outlined text-white text-xl">search</span>
                                            </div>
                                            <h2 class="text-xl font-bold text-white">Audit Log Details</h2>
                                        </div>
                                        <button
                                            class="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-200 text-white"
                                        >
                                            <span class="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <div class="p-6 overflow-y-auto">
                                        <div class="border-b border-gray-200 pb-4 mb-4">
                                            <div class="flex items-center space-x-4 mb-4">
                                                <div
                                                    class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center"
                                                >
                                                    <span class="text-white text-sm font-medium">JD</span>
                                                </div>
                                                <div>
                                                    <h3 class="text-lg font-semibold">Login Activity</h3>
                                                    <p class="text-gray-500">
                                                        Performed by John Doe (Admin) • 5 minutes ago
                                                    </p>
                                                </div>
                                                <span
                                                    class="ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                >
                                                    Success
                                                </span>
                                            </div>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">
                                                        Event Information
                                                    </h4>
                                                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">Timestamp:</span>
                                                            <span class="font-medium">2024-01-15 09:23:45</span>
                                                        </div>
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">Event ID:</span>
                                                            <span class="font-medium">EVT-20240115-0001</span>
                                                        </div>
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">IP Address:</span>
                                                            <span class="font-medium">192.168.1.100</span>
                                                        </div>
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">Location:</span>
                                                            <span class="font-medium">Manila, Philippines</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">
                                                        Device Information
                                                    </h4>
                                                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">Browser:</span>
                                                            <span class="font-medium">Chrome 120.0.0.0</span>
                                                        </div>
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">OS:</span>
                                                            <span class="font-medium">Windows 10</span>
                                                        </div>
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">Device:</span>
                                                            <span class="font-medium">Desktop</span>
                                                        </div>
                                                        <div class="flex">
                                                            <span class="text-gray-500 w-1/3">Screen:</span>
                                                            <span class="font-medium">1920×1080</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="mb-6">
                                            <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">
                                                Detailed Event Data
                                            </h4>
                                            <div class="bg-gray-50 rounded-lg p-4">
                                                <pre class="whitespace-pre-wrap text-sm font-mono text-gray-800">
 { &quot;event_type&quot;: &quot;authentication&quot;, &quot;status&quot;: &quot;success&quot;, &quot;user&quot;: { &quot;id&quot;: &quot;USR-001&quot;, &quot;username&quot;: &quot;john.doe&quot;, &quot;role&quot;: &quot;admin&quot;, &quot;last_login&quot;: &quot;2024-01-14T18:45:22Z&quot; }, &quot;resource&quot;: { &quot;type&quot;: &quot;dashboard&quot;, &quot;name&quot;: &quot;Admin Dashboard&quot;, &quot;path&quot;: &quot;/admin/dashboard&quot; }, &quot;auth_method&quot;: &quot;password&quot;, &quot;session_id&quot;: &quot;SES-20240115-7842&quot;, &quot;duration&quot;: &quot;28ms&quot; } </pre
                                                >
                                            </div>
                                        </div>
                                        <div class="mb-6">
                                            <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">
                                                Related Activities
                                            </h4>
                                            <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table class="w-full">
                                                    <thead class="bg-gray-50">
                                                        <tr>
                                                            <th
                                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                                            >
                                                                Timestamp
                                                            </th>
                                                            <th
                                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                                            >
                                                                Action
                                                            </th>
                                                            <th
                                                                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                                            >
                                                                Status
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody class="divide-y divide-gray-200">
                                                        <tr class="hover:bg-gray-50">
                                                            <td class="px-4 py-3 text-sm">2024-01-15 09:23:45</td>
                                                            <td class="px-4 py-3 text-sm">Login to Admin Dashboard</td>
                                                            <td class="px-4 py-3">
                                                                <span
                                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                                    >Success</span
                                                                >
                                                            </td>
                                                        </tr>
                                                        <tr class="hover:bg-gray-50">
                                                            <td class="px-4 py-3 text-sm">2024-01-14 17:12:08</td>
                                                            <td class="px-4 py-3 text-sm">Login to Admin Dashboard</td>
                                                            <td class="px-4 py-3">
                                                                <span
                                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                                    >Success</span
                                                                >
                                                            </td>
                                                        </tr>
                                                        <tr class="hover:bg-gray-50">
                                                            <td class="px-4 py-3 text-sm">2024-01-13 10:45:23</td>
                                                            <td class="px-4 py-3 text-sm">Login to Admin Dashboard</td>
                                                            <td class="px-4 py-3">
                                                                <span
                                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                                    >Success</span
                                                                >
                                                            </td>
                                                        </tr>
                                                        <tr class="hover:bg-gray-50">
                                                            <td class="px-4 py-3 text-sm">2024-01-12 08:32:17</td>
                                                            <td class="px-4 py-3 text-sm">Login to Admin Dashboard</td>
                                                            <td class="px-4 py-3">
                                                                <span
                                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                                                    >Failed</span
                                                                >
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div class="mb-4">
                                            <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">
                                                Audit Trail Map
                                            </h4>
                                            <div
                                                class="bg-gray-100 rounded-lg p-4 h-[200px] flex items-center justify-center"
                                            >
                                                <div class="text-center">
                                                    <span class="material-symbols-outlined text-4xl text-gray-400 mb-2"
                                                        >map</span
                                                    >
                                                    <p class="text-gray-500">
                                                        IP Location: Manila, Philippines (14.5995° N, 120.9842° E)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between"
                                    >
                                        <div class="flex items-center space-x-2">
                                            <button
                                                class="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                            >
                                                <span class="material-symbols-outlined text-sm">print</span>
                                                <span>Print</span>
                                            </button>
                                            <button
                                                class="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                            >
                                                <span class="material-symbols-outlined text-sm">download</span>
                                                <span>Export</span>
                                            </button>
                                        </div>
                                        <button
                                            class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                content: ["./src/**/*.{html,js}"],
                theme: {
                    name: "Bluewave",
                    fontFamily: {
                        sans: [
                            "Open Sans",
                            "ui-sans-serif",
                            "system-ui",
                            "sans-serif",
                            '"Apple Color Emoji"',
                            '"Segoe UI Emoji"',
                            '"Segoe UI Symbol"',
                            '"Noto Color Emoji"'
                        ]
                    },
                    extend: {
                        fontFamily: {
                            title: [
                                "Lato",
                                "ui-sans-serif",
                                "system-ui",
                                "sans-serif",
                                '"Apple Color Emoji"',
                                '"Segoe UI Emoji"',
                                '"Segoe UI Symbol"',
                                '"Noto Color Emoji"'
                            ],
                            body: [
                                "Open Sans",
                                "ui-sans-serif",
                                "system-ui",
                                "sans-serif",
                                '"Apple Color Emoji"',
                                '"Segoe UI Emoji"',
                                '"Segoe UI Symbol"',
                                '"Noto Color Emoji"'
                            ]
                        },
                        colors: {
                            neutral: {
                                50: "#f7f7f7",
                                100: "#eeeeee",
                                200: "#e0e0e0",
                                300: "#cacaca",
                                400: "#b1b1b1",
                                500: "#999999",
                                600: "#7f7f7f",
                                700: "#676767",
                                800: "#545454",
                                900: "#464646",
                                950: "#282828"
                            },
                            primary: {
                                50: "#f3f1ff",
                                100: "#e9e5ff",
                                200: "#d5cfff",
                                300: "#b7a9ff",
                                400: "#9478ff",
                                500: "#7341ff",
                                600: "#631bff",
                                700: "#611bf8",
                                800: "#4607d0",
                                900: "#3c08aa",
                                950: "#220174",
                                DEFAULT: "#611bf8"
                            }
                        }
                    },
                    fontSize: {
                        xs: ["12px", {lineHeight: "19.200000000000003px"}],
                        sm: ["14px", {lineHeight: "21px"}],
                        base: ["16px", {lineHeight: "25.6px"}],
                        lg: ["18px", {lineHeight: "27px"}],
                        xl: ["20px", {lineHeight: "28px"}],
                        "2xl": ["24px", {lineHeight: "31.200000000000003px"}],
                        "3xl": ["30px", {lineHeight: "36px"}],
                        "4xl": ["36px", {lineHeight: "41.4px"}],
                        "5xl": ["48px", {lineHeight: "52.800000000000004px"}],
                        "6xl": ["60px", {lineHeight: "66px"}],
                        "7xl": ["72px", {lineHeight: "75.60000000000001px"}],
                        "8xl": ["96px", {lineHeight: "100.80000000000001px"}],
                        "9xl": ["128px", {lineHeight: "134.4px"}]
                    },
                    borderRadius: {
                        none: "0px",
                        sm: "6px",
                        DEFAULT: "12px",
                        md: "18px",
                        lg: "24px",
                        xl: "36px",
                        "2xl": "48px",
                        "3xl": "72px",
                        full: "9999px"
                    },
                    spacing: {
                        0: "0px",
                        1: "4px",
                        2: "8px",
                        3: "12px",
                        4: "16px",
                        5: "20px",
                        6: "24px",
                        7: "28px",
                        8: "32px",
                        9: "36px",
                        10: "40px",
                        11: "44px",
                        12: "48px",
                        14: "56px",
                        16: "64px",
                        20: "80px",
                        24: "96px",
                        28: "112px",
                        32: "128px",
                        36: "144px",
                        40: "160px",
                        44: "176px",
                        48: "192px",
                        52: "208px",
                        56: "224px",
                        60: "240px",
                        64: "256px",
                        72: "288px",
                        80: "320px",
                        96: "384px",
                        px: "1px",
                        0.5: "2px",
                        1.5: "6px",
                        2.5: "10px",
                        3.5: "14px"
                    }
                },
                plugins: [],
                important: "#webcrumbs"
            }
        </script>
    </body>
</html>



  
export default ProfilePage;
