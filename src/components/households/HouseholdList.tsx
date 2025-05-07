
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { fetchHouseholds, deleteHousehold } from "@/lib/api/households";
import { Household } from "@/lib/types";
import HouseholdDetails from './HouseholdDetails';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const HouseholdList: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [householdToDelete, setHouseholdToDelete] = useState<string | null>(null);
  
  const { data: householdsData, isLoading, error } = useQuery({
    queryKey: ['households'],
    queryFn: fetchHouseholds,
  });
  
  const deleteHouseholdMutation = useMutation({
    mutationFn: (id: string) => deleteHousehold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['households']
      });
      toast({
        title: "Household Deleted",
        description: "The household has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the household.",
        variant: "destructive",
      });
    }
  });

  const handleViewDetails = (household: Household) => {
    setSelectedHousehold(household);
    setIsDetailsOpen(true);
  };

  const confirmDelete = (id: string) => {
    setHouseholdToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (householdToDelete) {
      deleteHouseholdMutation.mutate(householdToDelete);
    }
  };
  
  const filteredHouseholds = householdsData?.data?.filter(household => {
    const query = searchQuery.toLowerCase();
    return (
      household.name.toLowerCase().includes(query) ||
      household.address.toLowerCase().includes(query) ||
      (household.head_of_family && household.head_of_family.toLowerCase().includes(query)) ||
      household.purok.toLowerCase().includes(query) ||
      (household.contact_number && household.contact_number.toLowerCase().includes(query))
    );
  });

  if (isLoading) return <div className="p-4 text-center">Loading households...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading households: {error.toString()}</div>;

  return (
    <div className="p-4">
      {/* Search bar */}
      <div className="mb-4">
        <Input
          placeholder="Search households by name, address, head of family, etc."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Head of Family</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHouseholds && filteredHouseholds.length > 0 ? (
            filteredHouseholds.map((household) => (
              <TableRow key={household.id}>
                <TableCell>{household.name}</TableCell>
                <TableCell>{household.address}</TableCell>
                <TableCell>{household.head_of_family || "Not specified"}</TableCell>
                <TableCell>{household.contact_number || "Not available"}</TableCell>
                <TableCell>{household.status}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleViewDetails(household)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleViewDetails(household)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => confirmDelete(household.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                {searchQuery 
                  ? "No households found matching your search criteria."
                  : "No households available. Add a household to get started."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Household Details Dialog */}
      <HouseholdDetails 
        household={selectedHousehold} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the household
              and all associated data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HouseholdList;
