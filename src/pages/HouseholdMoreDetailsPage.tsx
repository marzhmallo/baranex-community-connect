import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit, Users, Calendar, DollarSign, MapPin, Home, Droplet, Zap, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getHouseholdById } from '@/lib/api/households';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import HouseholdForm from '@/components/households/HouseholdForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import HouseholdMembersManager from '@/components/households/HouseholdMembersManager';

const HouseholdMoreDetailsPage = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { data: householdData, isLoading, error } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => getHouseholdById(householdId || ''),
    enabled: !!householdId,
  });

  const household = householdData?.data;

  const handleEditSuccess = () => {
    setIsEditMode(false);
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>;
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
      // Check if date is valid
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

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/households')} 
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

  if (error || !household) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/households')} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Households
        </Button>
        
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load household details. This household may not exist."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header with back button and edit button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/households')} 
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              Household: {household.name} 
              <span className="ml-3">{getStatusBadge(household.status)}</span>
            </h1>
            <p className="text-muted-foreground">ID: {householdId}</p>
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
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Home className="h-5 w-5 text-blue-700" />
                </div>
                <h2 className="text-xl font-semibold ml-2">Basic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium">{household.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Head of Family</p>
                  <p className="font-medium">{household.head_of_family_name || "Not specified"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                  <p className="font-medium">{household.contact_number || "Not specified"}</p>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-1 flex-shrink-0" />
                    <p className="font-medium">{household.address}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Purok</p>
                  <p className="font-medium">{household.purok}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Year Established</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">{household.year_established || "Not specified"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">
                      {household.monthly_income ? `₱${household.monthly_income}` : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Property Information Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Home className="h-5 w-5 text-green-700" />
                </div>
                <h2 className="text-xl font-semibold ml-2">Property Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Property Type</p>
                  <p className="font-medium">{household.property_type || "Not specified"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">House Type</p>
                  <p className="font-medium">{household.house_type || "Not specified"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Water Source</p>
                  <div className="flex items-center">
                    <Droplet className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">{household.water_source || "Not specified"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Electricity Source</p>
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 text-gray-400 mr-1" />
                    <p className="font-medium">{household.electricity_source || "Not specified"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Toilet Type</p>
                  <p className="font-medium">{household.toilet_type || "Not specified"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Garbage Disposal</p>
                  <p className="font-medium">{household.garbage_disposal || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Information Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-purple-700" />
                </div>
                <h2 className="text-xl font-semibold ml-2">Additional Information</h2>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Remarks</p>
                <p className="font-medium whitespace-pre-line">{household.remarks || "No remarks added"}</p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created At</p>
                  <p className="font-medium">{formatDate(household.created_at)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="font-medium">{formatDate(household.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <HouseholdMembersManager 
            householdId={householdId || ''} 
            householdName={household.name}
          />
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
      
      {/* Edit Household Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Household</DialogTitle>
            <DialogDescription>
              Update information for {household.name}
            </DialogDescription>
          </DialogHeader>
          <HouseholdForm household={household} onSubmit={handleEditSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HouseholdMoreDetailsPage;
