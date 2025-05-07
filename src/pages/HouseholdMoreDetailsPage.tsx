
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchHouseholdById } from '@/lib/api/households';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Home, Phone, User } from 'lucide-react';
import HouseholdForm from '@/components/households/HouseholdForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const HouseholdMoreDetailsPage = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  
  // Fetch household details
  const { data: householdData, isLoading, error } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => fetchHouseholdById(householdId || ''),
    enabled: !!householdId,
  });

  const household = householdData?.data;

  const handleGoBack = () => {
    navigate('/households');
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <p className="text-lg font-medium">Loading household details...</p>
        </div>
      </div>
    );
  }

  if (error || !household) {
    return (
      <div className="p-6 flex justify-center items-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <p className="text-lg font-medium text-red-500">
            Error loading household details. The household may not exist.
          </p>
          <Button onClick={handleGoBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Households
          </Button>
        </div>
      </div>
    );
  }

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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'Inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>;
      case 'Relocated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Relocated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Households
        </Button>
        <Button onClick={() => setIsEditDialogOpen(true)}>
          Edit Household
        </Button>
      </div>
      
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Home className="h-8 w-8" />
          {household.name}
          <span className="ml-2">{getStatusBadge(household.status)}</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Added on {formatDate(household.created_at)}
          {household.updated_at && household.updated_at !== household.created_at && 
            ` • Last updated on ${formatDate(household.updated_at)}`}
        </p>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Basic Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1">{household.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Purok</dt>
                  <dd className="mt-1">{household.purok}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Head of Family</dt>
                  <dd className="mt-1 flex items-center">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    {household.head_of_family || "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                  <dd className="mt-1 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    {household.contact_number || "Not available"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Year Established</dt>
                  <dd className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {household.year_established || "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monthly Income</dt>
                  <dd className="mt-1">{household.monthly_income || "Not specified"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                  <dd className="mt-1">{household.property_type || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">House Type</dt>
                  <dd className="mt-1">{household.house_type || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Water Source</dt>
                  <dd className="mt-1">{household.water_source || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Electricity Source</dt>
                  <dd className="mt-1">{household.electricity_source || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Toilet Type</dt>
                  <dd className="mt-1">{household.toilet_type || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Garbage Disposal</dt>
                  <dd className="mt-1">{household.garbage_disposal || "Not specified"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Remarks & other data */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Remarks</h3>
                <p className="mt-1 whitespace-pre-wrap">{household.remarks || "No remarks provided"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Household</DialogTitle>
            <DialogDescription>
              Update information for {household.name}
            </DialogDescription>
          </DialogHeader>
          <HouseholdForm onSubmit={handleEditDialogClose} household={household} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HouseholdMoreDetailsPage;
