import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit, Users, Calendar, MapPin, Phone, Mail, Briefcase, Clock, History, Skull, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getResidentById } from '@/lib/api/residents';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ResidentForm from '@/components/residents/ResidentForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useProfileData } from '@/hooks/useProfileData';

const ResidentMoreDetailsPage = () => {
  const { residentId } = useParams<{ residentId: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { data: residentData, isLoading, error } = useQuery({
    queryKey: ['resident', residentId],
    queryFn: () => getResidentById(residentId || ''),
    enabled: !!residentId,
  });

  // Fetch household information
  const { data: household } = useQuery({
    queryKey: ['resident-household', residentData?.householdId],
    queryFn: async () => {
      if (!residentData?.householdId) return null;
      
      const { data, error } = await supabase
        .from('households')
        .select('id, name, address, purok, status')
        .eq('id', residentData.householdId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!residentData?.householdId,
  });

  const resident = residentData;

  // Fetch profile data for recordedby and editedby
  const { displayName: createdByName, isLoading: isCreatedByLoading } = useProfileData(resident?.recordedby || null);
  const { displayName: updatedByName, isLoading: isUpdatedByLoading } = useProfileData(resident?.editedby || null);

  const handleEditSuccess = () => {
    setIsEditMode(false);
  };

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'permanent':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Permanent</Badge>;
      case 'temporary':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Temporary</Badge>;
      case 'deceased':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Deceased</Badge>;
      case 'relocated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Relocated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (error) {
      return "Date error";
    }
  };

  // Generate full address display
  const getFullAddress = (resident: any) => {
    return resident.purok ? 
      `Purok ${resident.purok}, ${resident.barangay}, ${resident.municipality}, ${resident.province}` : 
      resident.address || 'Address not provided';
  };

  // Navigate to household details page
  const handleViewHousehold = () => {
    if (household) {
      navigate(`/households/${household.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/residents')} 
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/residents')} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Residents
        </Button>
        
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load resident details. This resident may not exist."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const age = calculateAge(resident.birthDate);
  const fullAddress = getFullAddress(resident);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header with back button and edit button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/residents')} 
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              {resident.firstName} {resident.lastName}
              <span className="ml-3">{getStatusBadge(resident.status)}</span>
            </h1>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditMode(true)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar/Photo */}
                {resident.photoUrl ? (
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={resident.photoUrl} alt={`${resident.firstName} ${resident.lastName}`} />
                    <AvatarFallback className="text-2xl">
                      {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-2xl">
                      {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold">
                    {resident.firstName} {resident.middleName} {resident.lastName} {resident.suffix}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Age</p>
                      <p className="font-medium">{age} years old</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="font-medium">{resident.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Birth Date</p>
                      <p className="font-medium">{formatDate(resident.birthDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Civil Status</p>
                      <p className="font-medium">{resident.civilStatus || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nationality</p>
                      <p className="font-medium">{resident.nationality || "Not specified"}</p>
                    </div>
                    {resident.status === "Deceased" && resident.diedOn && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Date of Death <Skull className="inline h-4 w-4 text-red-500 ml-1" /></p>
                        <p className="font-medium">{formatDate(resident.diedOn)}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Classifications */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Classifications</p>
                    <div className="flex flex-wrap gap-1">
                      {resident.classifications?.length ? 
                        resident.classifications.map((classification, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-100">
                            {classification}
                          </Badge>
                        )) 
                        : <span className="text-sm text-gray-500">None specified</span>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Information Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Phone className="h-5 w-5 text-green-700" />
                </div>
                <h2 className="text-xl font-semibold ml-2">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-1 flex-shrink-0" />
                    <p className="font-medium">{fullAddress}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">{resident.contactNumber || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">{resident.email || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Household Information */}
          {household && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Home className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-xl font-semibold ml-2">Household Information</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleViewHousehold}
                  >
                    View Household
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Household Name</p>
                    <p className="font-medium">{household.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Household Status</p>
                    <Badge variant="outline">{household.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Additional Information Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Briefcase className="h-5 w-5 text-blue-700" />
                </div>
                <h2 className="text-xl font-semibold ml-2">Additional Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Occupation</p>
                  <p className="font-medium">{resident.occupation || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Years in Barangay</p>
                  <p className="font-medium">{resident.yearsInBarangay || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
                  <p className="font-medium">
                    {resident.monthlyIncome ? `₱${resident.monthlyIncome}` : "Not specified"}
                  </p>
                </div>
              </div>

              {/* Emergency Contact */}
              {resident.emergencyContact && (
                <div className="mt-4">
                  <Separator className="mb-4" />
                  <h3 className="text-lg font-medium mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="font-medium">{resident.emergencyContact.name || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Relationship</p>
                      <p className="font-medium">{resident.emergencyContact.relationship || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                      <p className="font-medium">{resident.emergencyContact.contactNumber || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {resident.remarks && (
                <div className="mt-4">
                  <Separator className="mb-4" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Remarks</p>
                    <p className="font-medium whitespace-pre-line">{resident.remarks}</p>
                  </div>
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created At</p>
                  <p className="font-medium">
                    {formatDate(resident.created_at)}
                    {resident.recordedby && (
                      <span className="text-sm text-gray-600 ml-1">
                        by {isCreatedByLoading ? 'Loading...' : createdByName}
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="font-medium">
                    {formatDate(resident.updated_at)}
                    {resident.editedby && (
                      <span className="text-sm text-gray-600 ml-1">
                        by {isUpdatedByLoading ? 'Loading...' : updatedByName}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="relationships">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Family Relationships</h2>
              
              <p className="text-muted-foreground text-center py-10">
                No relationship records available
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">History</h2>
              
              <p className="text-muted-foreground text-center py-10">
                No history records available
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Resident Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Resident</DialogTitle>
            <DialogDescription>
              Update information for {resident.firstName} {resident.lastName}
            </DialogDescription>
          </DialogHeader>
          <ResidentForm resident={resident} onSubmit={handleEditSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResidentMoreDetailsPage;
