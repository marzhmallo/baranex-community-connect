
import React from 'react';
import ResidentsList from '@/components/residents/ResidentsList';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const ResidentsPage = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Resident Registry</h1>
        <p className="text-muted-foreground mt-2">Manage and track resident information in your barangay</p>
      </div>
      
      <Card className="shadow-lg border-t-4 border-t-baranex-primary bg-card text-card-foreground">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <ResidentsList />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentsPage;
