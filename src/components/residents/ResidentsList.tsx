import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResidents } from '@/lib/api/residents';
import { Resident } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronDown, MoreHorizontal, Search, Filter, FileDown, Pencil, Trash2, SlidersHorizontal } from 'lucide-react';
import ResidentStatusCard from './ResidentStatusCard';
import ClassificationStatusCard from './ClassificationStatusCard';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import ResidentDetails from './ResidentDetails';

const RESIDENTS_PER_PAGE = 10;

const ResidentsList = () => {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<string | null>(null);
  const [activeStatusCard, setActiveStatusCard] = useState<string | null>(null);
  const [activeClassificationCard, setActiveClassificationCard] = useState<string | null>(null);
  const [filterTitle, setFilterTitle] = useState('All Residents');
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: 'lastName',
    direction: 'asc',
  });
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for filtered residents
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  
  // State for delete confirmation
  const [residentToDelete, setResidentToDelete] = useState<Resident | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // State for filter dialog
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showInactiveResidents, setShowInactiveResidents] = useState(true);

  // State for resident details modal
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // State for export options
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  // Query to fetch residents
  const { data: residents = [], isLoading, error } = useQuery({
    queryKey: ['residents'],
    queryFn: getResidents
  });

  // Reset filters when residents data changes
  useEffect(() => {
    if (residents.length > 0) {
      setFilteredResidents(residents);
      setTotalPages(Math.ceil(residents.length / RESIDENTS_PER_PAGE));
    }
  }, [residents]);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Handle status card click
  const handleStatusCardClick = (status: 'Permanent' | 'Temporary' | 'Deceased' | 'Relocated') => {
    setStatusFilter(currentStatus => {
      if (currentStatus === status) {
        // If clicking the same status again, remove the filter
        setActiveStatusCard(null);
        return null;
      } else {
        // Otherwise, apply the new filter
        setActiveStatusCard(status);
        return status;
      }
    });
  };

  // Handle classification card click
  const handleClassificationCardClick = (classification: string) => {
    setClassificationFilter(currentClassification => {
      if (currentClassification === classification) {
        // If clicking the same classification again, remove the filter
        setActiveClassificationCard(null);
        return null;
      } else {
        // Otherwise, apply the new filter
        setActiveClassificationCard(classification);
        return classification;
      }
    });
  };

  // Combined filtering for both status and classification
  useEffect(() => {
    let filteredResults = [...residents];
    
    // Filter by search term
    if (searchTerm) {
      filteredResults = filteredResults.filter(resident => {
        const fullName = `${resident.firstName} ${resident.middleName || ''} ${resident.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
    }
    
    // Filter by status if selected
    if (statusFilter) {
      filteredResults = filteredResults.filter(resident => resident.status === statusFilter);
    }
    
    // Filter by classification if selected
    if (classificationFilter) {
      filteredResults = filteredResults.filter(resident => 
        resident.classifications && resident.classifications.includes(classificationFilter)
      );
    }
    
    // Apply sorting
    filteredResults.sort((a, b) => {
      if (sortConfig.key) {
        // Apply the sorting logic based on the sorted field
        if (sortConfig.key === 'name') {
          // Special case for name sorting
          const nameA = `${a.lastName}, ${a.firstName}`;
          const nameB = `${b.lastName}, ${b.firstName}`;
          return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        } else if (sortConfig.key === 'age') {
          // Calculate age from birthDate
          const getAge = (birthDate: string) => {
            const today = new Date();
            const birthDateObj = new Date(birthDate);
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
              age--;
            }
            return age;
          };
          
          const ageA = getAge(a.birthDate);
          const ageB = getAge(b.birthDate);
          return sortConfig.direction === 'asc' ? ageA - ageB : ageB - ageA;
        } else {
          // For other fields
          const valueA = a[sortConfig.key as keyof Resident];
          const valueB = b[sortConfig.key as keyof Resident];
          
          if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortConfig.direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
          }
        }
      }
      
      // Default sort by last name
      return a.lastName.localeCompare(b.lastName);
    });
    
    setFilteredResidents(filteredResults);
    
    // Update total pages after filtering
    setTotalPages(Math.ceil(filteredResults.length / RESIDENTS_PER_PAGE));
    
    // Reset to first page when filters change
    setCurrentPage(1);
    
    // Update filter title
    let newFilterTitle = 'All Residents';
    if (statusFilter && classificationFilter) {
      newFilterTitle = `${statusFilter} ${classificationFilter} Residents`;
    } else if (statusFilter) {
      newFilterTitle = `${statusFilter} Residents`;
    } else if (classificationFilter) {
      newFilterTitle = `${classificationFilter} Residents`;
    }
    setFilterTitle(newFilterTitle);
  }, [residents, searchTerm, statusFilter, classificationFilter, sortConfig]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter(null);
    setClassificationFilter(null);
    setActiveStatusCard(null);
    setActiveClassificationCard(null);
    setSortConfig({ key: 'lastName', direction: 'asc' });
  };

  // Handle export
  const handleExport = (format: 'csv' | 'pdf') => {
    setExportFormat(format);
    setShowExportOptions(false);
    
    // Implement export functionality
    toast({
      title: "Export initiated",
      description: `Exporting residents data as ${format.toUpperCase()}...`,
    });
    
    // TODO: Implement actual export functionality
  };

  // Handle delete
  const handleDelete = (resident: Resident) => {
    setResidentToDelete(resident);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!residentToDelete) return;
    
    // TODO: Implement actual delete functionality
    toast({
      title: "Resident deleted",
      description: `${residentToDelete.firstName} ${residentToDelete.lastName} has been deleted.`,
    });
    
    setShowDeleteDialog(false);
    setResidentToDelete(null);
  };

  // Handle clicking on a resident to view details
  const handleViewResident = (resident: Resident) => {
    setSelectedResident(resident);
    setIsDetailsOpen(true);
  };

  // Get the counts for the status cards
  const getStatusCounts = () => {
    const permanentCount = residents.filter(r => r.status === 'Permanent').length;
    const temporaryCount = residents.filter(r => r.status === 'Temporary').length;
    const deceasedCount = residents.filter(r => r.status === 'Deceased').length;
    const relocatedCount = residents.filter(r => r.status === 'Relocated').length;
    
    return {
      permanentCount,
      temporaryCount,
      deceasedCount,
      relocatedCount,
      total: residents.length
    };
  };

  // Get counts for classification cards
  const getClassificationCounts = () => {
    const classifications: Record<string, number> = {};
    
    residents.forEach(resident => {
      if (resident.classifications && resident.classifications.length > 0) {
        resident.classifications.forEach(classification => {
          if (classifications[classification]) {
            classifications[classification]++;
          } else {
            classifications[classification] = 1;
          }
        });
      }
    });
    
    return classifications;
  };

  // Status card data
  const statusCounts = getStatusCounts();
  const classificationCounts = getClassificationCounts();

  // Get residents for current page
  const getCurrentPageResidents = () => {
    const startIndex = (currentPage - 1) * RESIDENTS_PER_PAGE;
    const endIndex = startIndex + RESIDENTS_PER_PAGE;
    return filteredResidents.slice(startIndex, endIndex);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">Error loading residents</h3>
        <p className="text-muted-foreground">
          There was a problem loading the resident data. Please try again later.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Status and Classification Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Resident Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ResidentStatusCard 
            status="Permanent"
            count={statusCounts.permanentCount}
            totalCount={statusCounts.total}
            onClick={() => handleStatusCardClick('Permanent')}
            isActive={activeStatusCard === 'Permanent'}
          />
          <ResidentStatusCard 
            status="Temporary" 
            count={statusCounts.temporaryCount}
            totalCount={statusCounts.total}
            onClick={() => handleStatusCardClick('Temporary')}
            isActive={activeStatusCard === 'Temporary'}
          />
          <ResidentStatusCard 
            status="Deceased" 
            count={statusCounts.deceasedCount}
            totalCount={statusCounts.total}
            onClick={() => handleStatusCardClick('Deceased')}
            isActive={activeStatusCard === 'Deceased'}
          />
          <ResidentStatusCard 
            status="Relocated" 
            count={statusCounts.relocatedCount}
            totalCount={statusCounts.total}
            onClick={() => handleStatusCardClick('Relocated')}
            isActive={activeStatusCard === 'Relocated'}
          />
          <ResidentStatusCard 
            status="All" 
            count={statusCounts.total}
            totalCount={statusCounts.total}
            onClick={() => { 
              setStatusFilter(null);
              setActiveStatusCard(null);
            }}
            isActive={activeStatusCard === null}
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Classifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(classificationCounts).map(([classification, count]) => (
            <ClassificationStatusCard 
              key={classification}
              classification={classification}
              count={count}
              totalCount={residents.length}
              onClick={() => handleClassificationCardClick(classification)}
              isActive={activeClassificationCard === classification}
            />
          ))}
          {Object.keys(classificationCounts).length === 0 && (
            <div className="col-span-5 text-center py-4 text-muted-foreground">
              No classifications found for residents
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search residents by name..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <FileDown className="h-4 w-4" />
                <span>Export</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(statusFilter || classificationFilter || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-1"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {/* Filter title */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{filterTitle} ({filteredResidents.length})</h3>
      </div>

      {/* Residents table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className={cn("cursor-pointer", sortConfig.key === 'name' ? 'bg-muted' : '')}
                onClick={() => handleSort('name')}
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className={cn("cursor-pointer", sortConfig.key === 'age' ? 'bg-muted' : '')}
                onClick={() => handleSort('age')}
              >
                Age {sortConfig.key === 'age' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageResidents().length > 0 ? (
              getCurrentPageResidents().map((resident) => {
                // Calculate age
                const birthDate = new Date(resident.birthDate);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
                }
                
                // Format address
                const address = resident.purok 
                  ? `Purok ${resident.purok}, ${resident.barangay || ''}`
                  : resident.address;
                
                return (
                  <TableRow 
                    key={resident.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewResident(resident)}
                  >
                    <TableCell className="font-medium">
                      {resident.lastName}, {resident.firstName} {resident.middleName ? resident.middleName.charAt(0) + '.' : ''}
                    </TableCell>
                    <TableCell>{age}</TableCell>
                    <TableCell>{resident.gender}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={address}>
                      {address}
                    </TableCell>
                    <TableCell>
                      {resident.status === 'Permanent' && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Permanent
                        </Badge>
                      )}
                      {resident.status === 'Temporary' && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Temporary
                        </Badge>
                      )}
                      {resident.status === 'Deceased' && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Deceased
                        </Badge>
                      )}
                      {resident.status === 'Relocated' && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Relocated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewResident(resident);
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement edit functionality
                            toast({
                              title: "Edit resident",
                              description: `Editing ${resident.firstName} ${resident.lastName}...`,
                            });
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(resident);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No residents found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {residentToDelete?.firstName} {residentToDelete?.lastName}'s record.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Filter dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Residents</DialogTitle>
            <DialogDescription>
              Customize which residents are displayed in the list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <h4 className="font-medium">Show Inactive Residents</h4>
                <p className="text-sm text-muted-foreground">
                  Include residents marked as inactive
                </p>
              </div>
              <Switch 
                checked={showInactiveResidents} 
                onCheckedChange={setShowInactiveResidents} 
              />
            </div>
            
            {/* Additional filters can be added here */}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Apply filters
              setShowFilterDialog(false);
              toast({
                title: "Filters applied",
                description: "The resident list has been updated based on your filters.",
              });
            }}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resident details dialog */}
      {selectedResident && (
        <ResidentDetails 
          resident={selectedResident} 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen} 
        />
      )}
    </div>
  );
};

export default ResidentsList;
