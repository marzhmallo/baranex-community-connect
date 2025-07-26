
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
import { useAuth } from '@/components/AuthProvider';
import LocalizedLoadingScreen from '@/components/ui/LocalizedLoadingScreen';

const ResidentsPage = () => {
  const [isAddResidentOpen, setIsAddResidentOpen] = React.useState(false);
  const [isDataReady, setIsDataReady] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const loadingStartTime = React.useRef<number>(Date.now());

  // Check if pre-loaded data is available
  React.useEffect(() => {
    const checkDataReady = () => {
      if (userProfile?.role === 'admin' || userProfile?.role === 'staff') {
        const residentsData = localStorage.getItem('preloadedResidentsData');
        const residentStats = localStorage.getItem('preloadedResidentStats');
        
        if (residentsData && residentStats) {
          // Data already exists, skip loading screen
          setIsDataReady(true);
          setIsInitialLoad(false);
        } else {
          // Data doesn't exist, show loading screen and wait for data
          setIsInitialLoad(true);
          const interval = setInterval(() => {
            const data = localStorage.getItem('preloadedResidentsData');
            const stats = localStorage.getItem('preloadedResidentStats');
            if (data && stats) {
              setIsDataReady(true);
              setIsInitialLoad(false);
              clearInterval(interval);
            }
          }, 100);
          
          // Cleanup interval after 10 seconds to prevent infinite checking
          setTimeout(() => {
            clearInterval(interval);
            setIsDataReady(true);
            setIsInitialLoad(false);
          }, 10000);
        }
      } else {
        // For non-admin/staff users, show content immediately
        setIsDataReady(true);
        setIsInitialLoad(false);
      }
    };

    if (userProfile) {
      checkDataReady();
    }
  }, [userProfile]);


  const handleCloseDialog = () => {
    console.log("Dialog close handler triggered");
    
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
      
      console.log("Dialog cleanup completed");
    }, 150);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto relative">
      {/* Loading overlay within container */}
      {!isDataReady && isInitialLoad && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <UserPlus className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full border-2 border-primary/20" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Loading residents data...</p>
              <p className="text-sm text-muted-foreground mt-2">Preparing resident registry and statistics</p>
              <div className="flex space-x-1 mt-4 justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      
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
          console.log("Dialog open state changed to:", isOpen);
          if (!isOpen) {
            handleCloseDialog();
          } else {
            setIsAddResidentOpen(true);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[600px]"
          onInteractOutside={(e) => {
            console.log("Interaction outside dialog detected");
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            console.log("Escape key pressed");
            e.preventDefault();
          }}
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
