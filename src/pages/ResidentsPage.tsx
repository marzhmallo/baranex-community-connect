
import React from 'react';
import ResidentsList from '@/components/residents/ResidentsList';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ResidentForm from '@/components/residents/ResidentForm';
import { useQueryClient } from '@tanstack/react-query';

const ResidentsPage = () => {
  const [isAddResidentOpen, setIsAddResidentOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const handleCloseDialog = () => {
    // First close the dialog through state
    setIsAddResidentOpen(false);
    
    // Then clean up any lingering effects to ensure UI remains interactive
    setTimeout(() => {
      document.body.classList.remove('overflow-hidden');
      document.body.style.pointerEvents = '';
      
      // Remove any focus traps or aria-hidden attributes that might be lingering
      const elements = document.querySelectorAll('[aria-hidden="true"]');
      elements.forEach(el => {
        el.setAttribute('aria-hidden', 'false');
      });

      // Refresh the residents list
      queryClient.invalidateQueries({
        queryKey: ['residents']
      });
    }, 150);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resident Registry</h1>
          <p className="text-muted-foreground mt-2">Manage and track resident information in your barangay</p>
        </div>
        
        <Button 
          onClick={() => setIsAddResidentOpen(true)}
          className="bg-baranex-primary hover:bg-baranex-primary/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Resident
        </Button>
      </div>
      
      <Card className="shadow-lg border-t-4 border-t-baranex-primary bg-card text-card-foreground">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <ResidentsList />
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Add Resident Dialog */}
      <Dialog 
        open={isAddResidentOpen} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseDialog();
          } else {
            setIsAddResidentOpen(true);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[600px]"
        >
          <DialogHeader>
            <DialogTitle>Add New Resident</DialogTitle>
            <DialogDescription>
              Enter the resident's information below. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          <ResidentForm onSubmit={handleCloseDialog} />
        </DialogContent>
      </Dialog>
      
      {/* Make sure Toaster is included on the page */}
      <Toaster />
    </div>
  );
};

export default ResidentsPage;
