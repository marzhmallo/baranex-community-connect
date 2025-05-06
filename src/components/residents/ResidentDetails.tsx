
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resident } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResidentForm from "./ResidentForm";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ZoomIn, X } from "lucide-react";

type ResidentDetailsProps = {
  resident: Resident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ResidentDetails = ({ resident, open, onOpenChange }: ResidentDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  
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

  const handleClose = () => {
    console.log("ResidentDetails - handling close");
    
    // Reset edit mode when closing
    setIsEditMode(false);
    
    // First close the dialog through state
    onOpenChange(false);
    
    // Then clean up any lingering effects to ensure UI remains interactive
    setTimeout(() => {
      document.body.classList.remove('overflow-hidden');
      document.body.style.pointerEvents = '';
      
      // Remove any focus traps or aria-hidden attributes that might be lingering
      const elements = document.querySelectorAll('[aria-hidden="true"]');
      elements.forEach(el => {
        el.setAttribute('aria-hidden', 'false');
      });
    }, 150);
  };

  const handleFormSubmit = () => {
    console.log("ResidentDetails - form submitted, resetting edit mode");
    setIsEditMode(false);
    handleClose();
  };

  // Generate full address display
  const fullAddress = resident.purok ? 
    `Purok ${resident.purok}, ${resident.barangay}, ${resident.municipality}, ${resident.province}, ${resident.region}` : 
    resident.address || 'Address not provided';

  return (
    <Dialog 
      open={open} 
      onOpenChange={() => handleClose()}
    >
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => {
          console.log("Interaction outside dialog detected in ResidentDetails");
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          console.log("Escape key pressed in ResidentDetails");
          e.preventDefault();
        }}
      >
        {isEditMode ? (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle>Edit Resident</DialogTitle>
              <DialogDescription>
                Update information for {resident.firstName} {resident.lastName}
              </DialogDescription>
            </DialogHeader>
            <ResidentForm onSubmit={handleFormSubmit} resident={resident} />
          </>
        ) : (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span>Resident Details</span>
              </DialogTitle>
              <DialogDescription>
                Complete profile information for {resident.firstName} {resident.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="grid gap-6 pr-4 pb-4">
                {/* Personal Information */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* Avatar/Photo using the Avatar component with click to enlarge */}
                      {resident.photoUrl ? (
                        <div className="relative cursor-pointer group" onClick={() => setShowFullPhoto(true)}>
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={resident.photoUrl} alt={`${resident.firstName} ${resident.lastName}`} />
                            <AvatarFallback className="text-2xl">
                              {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="text-white h-8 w-8" />
                          </div>
                        </div>
                      ) : (
                        <Avatar className="w-24 h-24">
                          <AvatarFallback className="text-2xl">
                            {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {/* Full screen photo dialog */}
                      {resident.photoUrl && (
                        <Dialog open={showFullPhoto} onOpenChange={setShowFullPhoto}>
                          <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] max-h-[90vh] p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
                            <div 
                              className="relative w-full h-full flex items-center justify-center bg-black/70 p-2 rounded-lg"
                              onClick={() => setShowFullPhoto(false)}
                            >
                              <img 
                                src={resident.photoUrl} 
                                alt={`${resident.firstName} ${resident.lastName}`} 
                                className="max-h-[85vh] max-w-full object-contain rounded shadow-xl" 
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowFullPhoto(false);
                                }}
                              >
                                <span className="sr-only">Close</span>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
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
                          {resident.status === "Deceased" && resident.diedOn && (
                            <div>
                              <p className="text-sm text-gray-500">Date of Death</p>
                              <p>{new Date(resident.diedOn).toLocaleDateString()}</p>
                            </div>
                          )}
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
                        <p>{fullAddress}</p>
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
              </div>
            </ScrollArea>
            
            <div className="flex justify-end gap-2 pt-4 border-t mt-4 w-full shrink-0">
              <Button variant="outline" onClick={() => setIsEditMode(true)}>Edit Details</Button>
              <Button variant="ghost" onClick={handleClose}>Close</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResidentDetails;
