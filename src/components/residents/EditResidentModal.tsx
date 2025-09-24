import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Resident } from "@/lib/types";
import EnhancedResidentPhotoUpload from "./EnhancedResidentPhotoUpload";
import ResidentForm from "./ResidentForm";

interface EditResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident?: Resident | null;
}

const EditResidentModal = ({ isOpen, onClose, resident }: EditResidentModalProps) => {
  const handlePhotoUploaded = (url: string) => {
    // The photo URL will be handled by the ResidentForm component
    console.log('Photo uploaded:', url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {resident ? 'Edit Resident' : 'Add New Resident'}
          </DialogTitle>
          <DialogDescription>
            {resident 
              ? 'Update resident information and profile picture below.'
              : 'Add a new resident with their information and profile picture.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-2" />
        
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
          
          {/* Left Column: Profile Picture Upload */}
          <div className="lg:col-span-1 flex flex-col items-center justify-start">
            <div className="sticky top-0 w-full">
              <div className="bg-muted/30 rounded-lg p-6 border border-border">
                <h3 className="text-sm font-medium text-center mb-4 text-muted-foreground">
                  Profile Picture
                </h3>
                <EnhancedResidentPhotoUpload
                  residentId={resident?.id}
                  existingPhotoUrl={resident?.photoUrl}
                  onPhotoUploaded={handlePhotoUploaded}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Resident Form */}
          <div className="lg:col-span-3 overflow-hidden">
            <div className="h-full flex flex-col">
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                Personal Information
              </h3>
              <div className="flex-1 overflow-hidden">
                <ResidentForm 
                  resident={resident} 
                  onSubmit={onClose}
                />
              </div>
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditResidentModal;