import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import ResidentForm from './ResidentForm';

const ResidentsList = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
  };

  return (
    <div className="w-full">
      {/* Table header, search, filters would go here */}
      
      {/* Add Resident Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Resident
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh]"
          onInteractOutside={(e) => {
            // Prevent closing when user clicks outside if form is submitting
            if (isSubmitting) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Resident</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new resident to the barangay registry.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-120px)] pr-4">
            <div className="pr-4">
              <ResidentForm onSubmit={handleAddDialogClose} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Resident details dialog would go here */}
      
      {/* Residents table would go here */}
    </div>
  );
};

export default ResidentsList;
