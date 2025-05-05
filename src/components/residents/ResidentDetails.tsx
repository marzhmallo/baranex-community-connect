
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resident } from "@/lib/types";

type ResidentDetailsProps = {
  resident: Resident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ResidentDetails = ({ resident, open, onOpenChange }: ResidentDetailsProps) => {
  if (!resident) return null;

  // Calculate age
  const birthDate = new Date(resident.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Resident Details</span>
          </DialogTitle>
          <DialogDescription>
            Complete profile information for {resident.firstName} {resident.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar/Photo placeholder */}
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl">
                  {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                </div>
                
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold">
                    {resident.firstName} {resident.lastName}
                    <span className="ml-2">{getStatusBadge(resident.status)}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p>{age} years old</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p>{resident.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Birth Date</p>
                      <p>{new Date(resident.birthDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Civil Status</p>
                      <p>{resident.civilStatus || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p>{resident.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p>{resident.contactNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{resident.email || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p>{resident.occupation || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years in Barangay</p>
                  <p>{resident.yearsInBarangay || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Classification</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {resident.classifications?.length ? 
                      resident.classifications.map((classification, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-100">
                          {classification}
                        </Badge>
                      )) 
                      : "None specified"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline">Edit Details</Button>
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResidentDetails;
