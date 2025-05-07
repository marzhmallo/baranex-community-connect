
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResidents } from '@/lib/api/residents';
import { Resident } from '@/lib/types';
import { Eye, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ResidentDetails from './ResidentDetails';

const ResidentsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<string | null>(null);
  
  // Fixed: Using getResidents instead of fetchResidents
  const { data: residentsResponse, isLoading, error } = useQuery({
    queryKey: ['residents'],
    queryFn: getResidents,
  });
  
  // Fixed: Creating a proper deleteResident function since it doesn't exist
  const deleteResidentFn = async (id: string) => {
    // We'll implement this based on the existing residents.ts API
    const response = await fetch(`/api/residents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete resident');
    }
    return true;
  };
  
  const deleteResidentMutation = useMutation({
    mutationFn: deleteResidentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['residents']
      });
      toast({
        title: "Resident Deleted",
        description: "The resident has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the resident.",
        variant: "destructive",
      });
    }
  });

  const handleViewDetails = (resident: Resident) => {
    setSelectedResident(resident);
    setIsDetailsOpen(true);
  };

  const confirmDelete = (id: string) => {
    setResidentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (residentToDelete) {
      deleteResidentMutation.mutate(residentToDelete);
    }
  };
  
  // Fixed: Safely accessing residents data
  const residents = residentsResponse || [];
  
  const filteredResidents = residents.filter(resident => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      resident.firstName.toLowerCase().includes(query) ||
      resident.lastName.toLowerCase().includes(query) ||
      (resident.middleName && resident.middleName.toLowerCase().includes(query)) ||
      (resident.address && resident.address.toLowerCase().includes(query)) ||
      (resident.contactNumber && resident.contactNumber.toLowerCase().includes(query));
    
    // Apply status filter if not set to 'all'
    const matchesStatus = statusFilter === 'all' || resident.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="p-4 text-center">Loading residents...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading residents: {error.toString()}</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search residents by name, address, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Permanent">Permanent</SelectItem>
            <SelectItem value="Temporary">Temporary</SelectItem>
            <SelectItem value="Relocated">Relocated</SelectItem>
            <SelectItem value="Deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredResidents && filteredResidents.length > 0 ? (
            filteredResidents.map((resident) => {
              // Calculate age
              const birthDate = new Date(resident.birthDate);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              
              // Create full name with middle initial
              let fullName = `${resident.firstName} `;
              if (resident.middleName) {
                fullName += `${resident.middleName.charAt(0)}. `;
              }
              fullName += resident.lastName;
              if (resident.suffix) {
                fullName += ` ${resident.suffix}`;
              }
              
              return (
                <TableRow key={resident.id}>
                  <TableCell>{fullName}</TableCell>
                  <TableCell>{resident.address || `Purok ${resident.purok}, ${resident.barangay}`}</TableCell>
                  <TableCell>{age}</TableCell>
                  <TableCell>{resident.gender}</TableCell>
                  <TableCell>{resident.contactNumber || "Not available"}</TableCell>
                  <TableCell>{resident.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewDetails(resident)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => confirmDelete(resident.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                {searchQuery || statusFilter !== 'all'
                  ? "No residents found matching your search criteria."
                  : "No residents available. Add a resident to get started."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Resident Details Dialog */}
      {selectedResident && (
        <ResidentDetails 
          resident={selectedResident} 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resident
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

export default ResidentsList;
