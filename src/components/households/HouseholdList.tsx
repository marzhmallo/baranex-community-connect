import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { getHouseholds, deleteHousehold } from "@/lib/api/households";
import { Household } from "@/lib/types";
import HouseholdDetails from './HouseholdDetails';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HouseholdList: React.FC = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [purokFilter, setPurokFilter] = useState<string>('');
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [householdToDelete, setHouseholdToDelete] = useState<string | null>(null);
  const {
    data: householdsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['households'],
    queryFn: getHouseholds
  });
  const deleteHouseholdMutation = useMutation({
    mutationFn: (id: string) => deleteHousehold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['households']
      });
      toast({
        title: "Household Deleted",
        description: "The household has been successfully deleted."
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the household.",
        variant: "destructive"
      });
    }
  });
  
  const handleViewDetails = (household: Household) => {
    setSelectedHousehold(household);
    setIsDetailsOpen(true);
  };
  
  const handleEditHousehold = (household: Household) => {
    setSelectedHousehold(household);
    setIsDetailsOpen(true);
  };
  
  const handleViewMore = (household: Household) => {
    navigate(`/households/${household.id}`);
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

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'permanent':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Permanent</Badge>;
      case 'temporary':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Temporary</Badge>;
      case 'relocated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Relocated</Badge>;
      case 'abandoned':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Abandoned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate unique puroks for filtering
  const uniquePuroks = useMemo(() => {
    if (!householdsData?.data) return [];
    const puroks = new Set<string>();
    householdsData.data.forEach((household: Household) => {
      if (household.purok) {
        puroks.add(household.purok);
      }
    });
    return Array.from(puroks).sort();
  }, [householdsData?.data]);

  // Calculate unique statuses for filtering
  const uniqueStatuses = useMemo(() => {
    if (!householdsData?.data) return [];
    const statuses = new Set<string>();
    householdsData.data.forEach((household: Household) => {
      if (household.status) {
        statuses.add(household.status);
      }
    });
    return Array.from(statuses).sort();
  }, [householdsData?.data]);

  // Calculate various household statistics
  const householdStats = useMemo(() => {
    if (!householdsData?.data) return {
      total: 0,
      permanent: 0,
      temporary: 0,
      relocated: 0,
      abandoned: 0
    };
    const stats = {
      total: householdsData.data.length,
      permanent: 0,
      temporary: 0,
      relocated: 0,
      abandoned: 0
    };
    householdsData.data.forEach((household: Household) => {
      if (household.status?.toLowerCase() === 'permanent') stats.permanent++;else if (household.status?.toLowerCase() === 'temporary') stats.temporary++;else if (household.status?.toLowerCase() === 'relocated') stats.relocated++;else if (household.status?.toLowerCase() === 'abandoned') stats.abandoned++;
    });
    return stats;
  }, [householdsData?.data]);

  const filteredHouseholds = useMemo(() => {
    if (!householdsData?.data) return [];
    
    return householdsData.data.filter((household: Household) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        household.name?.toLowerCase().includes(query) || false ||
        household.address?.toLowerCase().includes(query) || false ||
        household.head_of_family_name?.toLowerCase().includes(query) || false ||
        household.purok?.toLowerCase().includes(query) || false ||
        household.contact_number?.toLowerCase().includes(query) || false;
      
      const matchesStatus = !statusFilter || statusFilter === "all-statuses" ? 
        true : household.status?.toLowerCase() === statusFilter.toLowerCase();
      
      const matchesPurok = !purokFilter || purokFilter === "all-puroks" ? 
        true : household.purok?.toLowerCase() === purokFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPurok;
    });
  }, [householdsData?.data, searchQuery, statusFilter, purokFilter]);

  if (isLoading) return <div className="p-4 text-center">Loading households...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error loading households: {error.toString()}</div>;
  return (
    <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 shadow my-[15px] mx-[15px] rounded-lg px-[15px] py-[15px]">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500 font-medium">Total Households</h3>
              <span className="text-2xl font-bold">{householdStats.total}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mx-[15px] my-[15px] px-[15px] py-[15px]">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500 font-medium">Permanent</h3>
              <span className="text-2xl font-bold">{householdStats.permanent}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mx-[15px] my-[15px] py-[15px] px-[15px]">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-yellow-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500 font-medium">Temporary</h3>
              <span className="text-2xl font-bold">{householdStats.temporary}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mx-[15px] my-[15px] py-[15px] px-[15px]">
          <div className="flex items-center">
            <div className="rounded-full p-3 bg-purple-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm text-gray-500 font-medium">Relocated</h3>
              <span className="text-2xl font-bold">{householdStats.relocated}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 px-[12px]">
          <Input placeholder="Search households by name, address, head of family, etc." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full px-[15px]" />
        </div>
        
        <div className="flex gap-2 px-[15px]">
          <Select value={purokFilter} onValueChange={setPurokFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Purok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-puroks">All Puroks</SelectItem>
              {uniquePuroks.map(purok => <SelectItem key={purok} value={purok}>{purok}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">All Statuses</SelectItem>
              {uniqueStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Head of Family</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right px-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHouseholds.length > 0 ? (
            filteredHouseholds.map((household: Household) => (
              <TableRow key={household.id}>
                <TableCell className="font-medium">{household.name}</TableCell>
                <TableCell>{household.address}</TableCell>
                <TableCell>{household.head_of_family_name || "Not specified"}</TableCell>
                <TableCell>{household.contact_number || "Not available"}</TableCell>
                <TableCell>{getStatusBadge(household.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(household)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEditHousehold(household)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(household.id)}>
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
                {searchQuery || statusFilter || purokFilter ? 
                  "No households found matching your search criteria." : 
                  "No households available. Add a household to get started."
                }
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Household Details Dialog */}
      <HouseholdDetails household={selectedHousehold} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HouseholdList;
