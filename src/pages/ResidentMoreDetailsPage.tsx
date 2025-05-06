import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getResidentById } from '@/lib/api/residents';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, FileText, UserCheck, MapPin, Mail, Phone, Briefcase, Calendar, Home, Skull, Clock, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const ResidentMoreDetailsPage = () => {
  const { residentId } = useParams<{ residentId: string }>();
  const navigate = useNavigate();
  
  const { data: resident, isLoading, error } = useQuery({
    queryKey: ['resident', residentId],
    queryFn: () => getResidentById(residentId as string),
    enabled: !!residentId,
  });
  
  // Calculate age if resident data is available
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Permanent':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Permanent</Badge>;
      case 'Temporary':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Temporary</Badge>;
      case 'Deceased':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Deceased</Badge>;
      case 'Relocated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Relocated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center mb-8">
          <Button onClick={() => navigate('/residents')} variant="ghost" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center mb-8">
          <Button onClick={() => navigate('/residents')} variant="ghost" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Resident Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              The resident information could not be loaded or does not exist.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate('/residents')}>
                Return to Residents List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Log to debug what we're receiving from the API
  console.log("Resident data:", resident);
  console.log("Created at value:", resident.created_at);

  // Generate full address display
  const fullAddress = resident.purok 
    ? `Purok ${resident.purok}, ${resident.barangay}, ${resident.municipality}, ${resident.province}, ${resident.region}` 
    : resident.address || 'Address not provided';

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center mb-8">
        <Button onClick={() => navigate('/residents')} variant="ghost" className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resident Profile</h1>
          <p className="text-muted-foreground mt-1">
            Complete details for {resident.firstName} {resident.lastName}
          </p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid gap-6 pb-8">
          {/* Header Card */}
          <Card className="border-t-4 border-t-baranex-primary">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Photo/Avatar */}
                {resident.photoUrl ? (
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-gray-100">
                      <AvatarImage src={resident.photoUrl} alt={`${resident.firstName} ${resident.lastName}`} />
                      <AvatarFallback className="text-4xl">
                        {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <Avatar className="w-32 h-32 border-4 border-gray-100">
                    <AvatarFallback className="text-4xl">
                      {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                {/* Basic Info */}
                <div className="space-y-2 text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h2 className="text-2xl font-bold">
                      {resident.firstName} {resident.middleName ? `${resident.middleName.charAt(0)}. ` : ''}{resident.lastName} {resident.suffix || ''}
                    </h2>
                    <div className="flex items-center">
                      {getStatusBadge(resident.status)}
                      {resident.status === 'Deceased' && (
                        <Skull className="ml-2 h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 text-muted-foreground">
                    <div className="flex items-center">
                      <UserCheck className="mr-2 h-4 w-4" />
                      <span>{resident.gender}, {calculateAge(resident.birthDate)} years old</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>Purok {resident.purok || "Unknown"}</span>
                    </div>
                    {resident.occupation && (
                      <div className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>{resident.occupation}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {resident.classifications?.map((classification, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-100">
                        {classification}
                      </Badge>
                    ))}
                    {resident.isVoter && (
                      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-100">Voter</Badge>
                    )}
                  </div>
                </div>
                
                {/* Quick actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Issue Document
                  </Button>
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">First Name</p>
                      <p className="font-medium">{resident.firstName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Name</p>
                      <p className="font-medium">{resident.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Middle Name</p>
                      <p className="font-medium">{resident.middleName || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Suffix</p>
                      <p className="font-medium">{resident.suffix || "None"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{resident.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Civil Status</p>
                      <p className="font-medium">{resident.civilStatus || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Birth Date</p>
                      <p className="font-medium">{new Date(resident.birthDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{calculateAge(resident.birthDate)} years old</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nationality</p>
                      <p className="font-medium">{resident.nationality || "Filipino"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center">
                        <p className="font-medium">{resident.status}</p>
                        {resident.status === 'Deceased' && (
                          <Skull className="ml-2 h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Classifications</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resident.classifications?.length 
                        ? resident.classifications.map((classification, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-100">
                              {classification}
                            </Badge>
                          )) 
                        : <p className="text-muted-foreground">None specified</p>}
                    </div>
                  </div>
                  
                  {resident.status === "Deceased" && resident.diedOn && (
                    <div>
                      <p className="text-sm text-gray-500">Date of Death</p>
                      <p className="font-medium">{new Date(resident.diedOn).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Complete Address</p>
                    <p className="font-medium">{fullAddress}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Purok</p>
                      <p className="font-medium">{resident.purok || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Barangay</p>
                      <p className="font-medium">{resident.barangay || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Municipality/City</p>
                      <p className="font-medium">{resident.municipality || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Province</p>
                      <p className="font-medium">{resident.province || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Region</p>
                      <p className="font-medium">{resident.region || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-medium">{resident.country || "Philippines"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Years in Barangay</p>
                    <p className="font-medium">{resident.yearsInBarangay || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Contact Information, Emergency Contact & Socioeconomic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{resident.contactNumber || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{resident.email || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{resident.emergencyContact?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{resident.emergencyContact?.relationship || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{resident.emergencyContact?.contactNumber || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Socioeconomic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Socioeconomic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Occupation</p>
                    <p className="font-medium">{resident.occupation || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Income</p>
                    <p className="font-medium">{resident.monthlyIncome 
                      ? `₱${resident.monthlyIncome.toLocaleString()}`
                      : "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Remarks - New separate card */}
          {resident.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{resident.remarks}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Government Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Government Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Voter Status</p>
                    <p className="font-medium">{resident.isVoter ? "Registered Voter" : "Non-Voter"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PhilHealth</p>
                    <p className="font-medium">{resident.hasPhilhealth ? "Member" : "Non-Member"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">SSS</p>
                    <p className="font-medium">{resident.hasSss ? "Member" : "Non-Member"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pag-IBIG</p>
                    <p className="font-medium">{resident.hasPagibig ? "Member" : "Non-Member"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">TIN</p>
                  <p className="font-medium">{resident.hasTin ? "Has TIN" : "No TIN"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Record Information - New card for created and updated dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <History className="mr-2 h-5 w-5" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    {resident.created_at ? formatDate(resident.created_at) : 
                     resident.dateRegistered ? formatDate(resident.dateRegistered) : 
                     "Not available"}
                  </p>
                </div>
                {(resident.updated_at || resident.updatedAt) && (
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      {resident.updated_at ? formatDate(resident.updated_at) : 
                       formatDate(resident.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResidentMoreDetailsPage;
