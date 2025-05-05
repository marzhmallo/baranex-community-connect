import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  ChevronDown,
  MoreHorizontal,
  Eye,
  Download,
  Printer,
  FileText,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Resident } from '@/lib/types';
import { getResidents } from '@/lib/api/residents';
import { useQuery } from '@tanstack/react-query';
import ResidentForm from './ResidentForm';
import ResidentStatusCard from './ResidentStatusCard';
import ClassificationStatusCard from './ClassificationStatusCard';
import ResidentDetails from './ResidentDetails';
import { toast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the age group options
type AgeGroup = 'Child' | 'Teen' | 'Young Adult' | 'Adult' | 'Elderly';

// Define the sort options
type SortField = 'name' | 'gender' | 'status' | 'age' | 'ageGroup' | 'purok' | 'contact';
type SortDirection = 'asc' | 'desc';

const ResidentsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Add state for edit dialog
  const [isEditResidentOpen, setIsEditResidentOpen] = useState(false);
  const [residentToEdit, setResidentToEdit] = useState<Resident | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Active sorting cards state
  const [activeStatusCard, setActiveStatusCard] = useState<string | null>(null);
  const [activeClassificationCard, setActiveClassificationCard] = useState<string | null>(null);
  
  // Fetch residents data from Supabase
  const { data: residents = [], isLoading, error } = useQuery({
    queryKey: ['residents'],
    queryFn: getResidents,
  });
  
  // Show error toast if there's an error fetching data
  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching residents",
        description: "There was a problem loading the resident data.",
        variant: "destructive",
      });
    }
  }, [error]);

  // Calculate counts by status
  const permanentCount = residents.filter(r => r.status === 'Permanent').length;
  const temporaryCount = residents.filter(r => r.status === 'Temporary').length;
  const deceasedCount = residents.filter(r => r.status === 'Deceased').length;
  const relocatedCount = residents.filter(r => r.status === 'Relocated').length;

  // Calculate counts by classification - fixed to correctly check classifications
  const getClassificationCount = (classification: string) => {
    return residents.filter(resident => 
      resident.classifications && Array.isArray(resident.classifications) && 
      resident.classifications.includes(classification)
    ).length;
  };

  const indigentCount = getClassificationCount('indigent');
  const studentCount = getClassificationCount('student');
  const ofwCount = getClassificationCount('ofw');
  const pwdCount = getClassificationCount('pwd');
  const missingCount = getClassificationCount('missing');

  // Get unique classifications
  const allClassifications = useMemo(() => {
    const classifications = new Set<string>();
    residents.forEach(resident => {
      if (resident.classifications && Array.isArray(resident.classifications)) {
        resident.classifications.forEach(c => classifications.add(c));
      }
    });
    return Array.from(classifications);
  }, [residents]);
  
  // Function to determine age group
  const getAgeGroup = (age: number): AgeGroup => {
    if (age <= 12) return 'Child';
    if (age <= 19) return 'Teen';
    if (age <= 29) return 'Young Adult';
    if (age <= 59) return 'Adult';
    return 'Elderly';
  };
  
  // Function to handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon for header
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-2" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2" /> : 
      <ArrowDown className="h-4 w-4 ml-2" />;
  };
  
  const filteredResidents = useMemo(() => {
    // Filter by search, status, tab, and classifications
    const filtered = residents.filter(resident => {
      // Search filter
      const matchesSearch = 
        searchQuery === '' || 
        `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resident.address && resident.address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter - now also considers activeStatusCard
      const matchesStatus = 
        (selectedStatus === null || resident.status === selectedStatus) && 
        (activeStatusCard === null || resident.status === activeStatusCard);
      
      // Tab filter - Only status tabs now
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'permanent' && resident.status === 'Permanent') ||
        (activeTab === 'temporary' && resident.status === 'Temporary') ||
        (activeTab === 'deceased' && resident.status === 'Deceased') ||
        (activeTab === 'relocated' && resident.status === 'Relocated');
      
      // Classifications filter - now also considers activeClassificationCard
      const hasClassificationsArray = resident.classifications && Array.isArray(resident.classifications);
      
      let matchesClassifications = selectedClassifications.length === 0;
      if (!matchesClassifications && hasClassificationsArray) {
        matchesClassifications = selectedClassifications.every(c => 
          resident.classifications!.includes(c)
        );
      }

      // Additional check for activeClassificationCard
      let matchesActiveClassification = activeClassificationCard === null;
      if (!matchesActiveClassification && hasClassificationsArray && activeClassificationCard) {
        matchesActiveClassification = resident.classifications!.includes(activeClassificationCard);
      }
      
      return matchesSearch && matchesStatus && matchesTab && matchesClassifications && matchesActiveClassification;
    });
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      // Calculate ages first to avoid repeated calculations
      const dateA = new Date(a.birthDate);
      const dateB = new Date(b.birthDate);
      const today = new Date();
      
      // Age calculation code is kept here
      let ageA = today.getFullYear() - dateA.getFullYear();
      const mA = today.getMonth() - dateA.getMonth();
      if (mA < 0 || (mA === 0 && today.getDate() < dateA.getDate())) {
        ageA--;
      }
      
      let ageB = today.getFullYear() - dateB.getFullYear();
      const mB = today.getMonth() - dateB.getMonth();
      if (mB < 0 || (mB === 0 && today.getDate() < dateB.getDate())) {
        ageB--;
      }
      
      const ageGroupA = getAgeGroup(ageA);
      const ageGroupB = getAgeGroup(ageB);
      
      const directionModifier = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return (`${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)) * directionModifier;
        case 'gender':
          return (a.gender.localeCompare(b.gender)) * directionModifier;
        case 'status':
          return (a.status.localeCompare(b.status)) * directionModifier;
        case 'age':
          return (ageA - ageB) * directionModifier;
        case 'ageGroup':
          const ageGroupOrder = { 'Child': 1, 'Teen': 2, 'Young Adult': 3, 'Adult': 4, 'Elderly': 5 };
          return (ageGroupOrder[ageGroupA] - ageGroupOrder[ageGroupB]) * directionModifier;
        case 'purok':
          // Some residents might not have a purok field
          const purokA = (a as any).purok || '';
          const purokB = (b as any).purok || '';
          return purokA.localeCompare(purokB) * directionModifier;
        case 'contact':
          return ((a.contactNumber || '').localeCompare(b.contactNumber || '')) * directionModifier;
        default:
          return 0;
      }
    });
  }, [
    searchQuery, 
    selectedStatus, 
    activeTab, 
    selectedClassifications, 
    residents, 
    sortField, 
    sortDirection, 
    activeStatusCard, 
    activeClassificationCard
  ]);

  // Calculate pagination
  const pageCount = Math.ceil(filteredResidents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredResidents.length);
  const paginatedResidents = filteredResidents.slice(startIndex, endIndex);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClassificationToggle = (classification: string) => {
    if (selectedClassifications.includes(classification)) {
      setSelectedClassifications(prev => prev.filter(c => c !== classification));
    } else {
      setSelectedClassifications(prev => [...prev, classification]);
    }
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleStatusCardClick = (status: string) => {
    // If clicking on the already active card, toggle it off
    if (activeStatusCard === status) {
      setActiveStatusCard(null);
    } else {
      setActiveStatusCard(status);
      // Reset any active classification card when selecting a status
      setActiveClassificationCard(null);
    }
    
    setActiveTab(status.toLowerCase());
    setCurrentPage(1); // Reset to first page on status card click
  };

  const handleClassificationCardClick = (classification: string) => {
    // If clicking on the already active card, toggle it off
    if (activeClassificationCard === classification) {
      setActiveClassificationCard(null);
      setSelectedClassifications([]);
    } else {
      setActiveClassificationCard(classification);
      setSelectedClassifications([classification]);
      // Reset any active status card when selecting a classification
      setActiveStatusCard(null);
    }
    
    setCurrentPage(1); // Reset to first page on classification card click
  };

  const handleViewDetails = (resident: Resident) => {
    setSelectedResident(resident);
    setIsDetailsOpen(true);
  };
  
  const handleCloseDetails = () => {
    // Add a small delay before fully closing to ensure proper cleanup
    setTimeout(() => {
      setSelectedResident(null);
    }, 100);
    setIsDetailsOpen(false);
  };

  const handleEditResident = (resident: Resident) => {
    setResidentToEdit(resident);
    setIsEditResidentOpen(true);
  };

  const handleCloseEditDialog = () => {
    // Add a small delay before fully closing to ensure proper cleanup
    setTimeout(() => {
      setResidentToEdit(null);
    }, 100);
    setIsEditResidentOpen(false);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        <ResidentStatusCard
          label="Permanent Residents"
          count={permanentCount}
          bgColor="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30"
          textColor="text-green-800 dark:text-green-300"
          iconBgColor="bg-green-200 dark:bg-green-800"
          iconColor="text-green-700 dark:text-green-300"
          onClick={() => handleStatusCardClick('Permanent')}
          isActive={activeStatusCard === 'Permanent'}
        />
        
        <ResidentStatusCard
          label="Temporary Residents"
          count={temporaryCount}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30"
          textColor="text-blue-800 dark:text-blue-300"
          iconBgColor="bg-blue-200 dark:bg-blue-800"
          iconColor="text-blue-700 dark:text-blue-300"
          onClick={() => handleStatusCardClick('Temporary')}
          isActive={activeStatusCard === 'Temporary'}
        />
        
        <ResidentStatusCard
          label="Deceased Residents"
          count={deceasedCount}
          bgColor="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30"
          textColor="text-red-800 dark:text-red-300"
          iconBgColor="bg-red-200 dark:bg-red-800"
          iconColor="text-red-700 dark:text-red-300"
          onClick={() => handleStatusCardClick('Deceased')}
          isActive={activeStatusCard === 'Deceased'}
        />
        
        <ResidentStatusCard
          label="Relocated Residents"
          count={relocatedCount}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30"
          textColor="text-purple-800 dark:text-purple-300"
          iconBgColor="bg-purple-200 dark:bg-purple-800"
          iconColor="text-purple-700 dark:text-purple-300"
          onClick={() => handleStatusCardClick('Relocated')}
          isActive={activeStatusCard === 'Relocated'}
        />
      </div>
      
      {/* Classification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 px-6">
        <ClassificationStatusCard
          label="Indigent Residents"
          count={indigentCount}
          bgColor="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30"
          textColor="text-amber-800 dark:text-amber-300"
          iconBgColor="bg-amber-200 dark:bg-amber-800"
          iconColor="text-amber-700 dark:text-amber-300"
          onClick={() => handleClassificationCardClick('indigent')}
          isActive={activeClassificationCard === 'indigent'}
        />
        
        <ClassificationStatusCard
          label="Student Residents"
          count={studentCount}
          bgColor="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/40 dark:to-cyan-900/30"
          textColor="text-cyan-800 dark:text-cyan-300"
          iconBgColor="bg-cyan-200 dark:bg-cyan-800"
          iconColor="text-cyan-700 dark:text-cyan-300"
          onClick={() => handleClassificationCardClick('student')}
          isActive={activeClassificationCard === 'student'}
        />
        
        <ClassificationStatusCard
          label="OFW Residents"
          count={ofwCount}
          bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/30"
          textColor="text-indigo-800 dark:text-indigo-300"
          iconBgColor="bg-indigo-200 dark:bg-indigo-800"
          iconColor="text-indigo-700 dark:text-indigo-300"
          onClick={() => handleClassificationCardClick('ofw')}
          isActive={activeClassificationCard === 'ofw'}
        />
        
        <ClassificationStatusCard
          label="PWD Residents"
          count={pwdCount}
          bgColor="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/30"
          textColor="text-pink-800 dark:text-pink-300"
          iconBgColor="bg-pink-200 dark:bg-pink-800"
          iconColor="text-pink-700 dark:text-pink-300"
          onClick={() => handleClassificationCardClick('pwd')}
          isActive={activeClassificationCard === 'pwd'}
        />
        
        <ClassificationStatusCard
          label="Missing Residents"
          count={missingCount}
          bgColor="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30"
          textColor="text-orange-800 dark:text-orange-300"
          iconBgColor="bg-orange-200 dark:bg-orange-800"
          iconColor="text-orange-700 dark:text-orange-300"
          onClick={() => handleClassificationCardClick('missing')}
          isActive={activeClassificationCard === 'missing'}
        />
      </div>
      
      <div className="bg-card text-card-foreground rounded-lg shadow-md">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border-b bg-muted/50">
            <TabsList className="h-10 bg-background/80">
              <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-accent">All Residents</TabsTrigger>
              <TabsTrigger value="permanent" className="rounded-md data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300">Permanent</TabsTrigger>
              <TabsTrigger value="temporary" className="rounded-md data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">Temporary</TabsTrigger>
              <TabsTrigger value="deceased" className="rounded-md data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-900/30 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300">Deceased</TabsTrigger>
              <TabsTrigger value="relocated" className="rounded-md data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">Relocated</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search residents..."
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedStatus || "All Statuses"}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusFilter(null)}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Permanent')}>
                    Permanent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Temporary')}>
                    Temporary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Deceased')}>
                    Deceased
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Relocated')}>
                    Relocated
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {allClassifications.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Classifications
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Classification</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allClassifications.map(classification => (
                      <DropdownMenuItem 
                        key={classification} 
                        onClick={() => handleClassificationToggle(classification)}
                      >
                        <div className="flex items-center">
                          {selectedClassifications.includes(classification) && (
                            <Check className="h-4 w-4 mr-2 text-primary" />
                          )}
                          <span className={selectedClassifications.includes(classification) ? "ml-6" : ""}>
                            {classification}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {selectedClassifications.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedClassifications([])}>
                          Clear filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Dialog 
                open={isAddResidentOpen} 
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    setTimeout(() => {
                      // Clean up after dialog is fully closed
                      document.body.style.pointerEvents = '';
                    }, 100);
                  }
                  setIsAddResidentOpen(isOpen);
                }}
              >
                <DialogContent 
                  className="sm:max-w-[600px]" 
                  onInteractOutside={(e) => {
                    // Prevent issues with outside clicks
                    e.preventDefault();
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Add New Resident</DialogTitle>
                    <DialogDescription>
                      Enter the resident's information below. Required fields are marked with an asterisk (*).
                    </DialogDescription>
                  </DialogHeader>
                  <ResidentForm onSubmit={() => {
                    setIsAddResidentOpen(false);
                    // Ensure pointer events are reset
                    setTimeout(() => {
                      document.body.style.pointerEvents = '';
                    }, 100);
                  }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-card border-b">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Report
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Loading residents..."
                ) : (
                  <>
                    Showing <span className="font-medium">{startIndex + 1}</span>-<span className="font-medium">{endIndex}</span> of{" "}
                    <span className="font-medium">{filteredResidents.length}</span> residents
                  </>
                )}
              </p>
              
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-2">Show:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Tabs Content - Only include status tabs */}
          {['all', 'permanent', 'temporary', 'deceased', 'relocated'].map(tab => (
            <TabsContent key={tab} value={tab} className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-baranex-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Name {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('gender')}
                        >
                          <div className="flex items-center">
                            Gender {getSortIcon('gender')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            Status {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('age')}
                        >
                          <div className="flex items-center">
                            Age {getSortIcon('age')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('ageGroup')}
                        >
                          <div className="flex items-center">
                            Age Group {getSortIcon('ageGroup')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('purok')}
                        >
                          <div className="flex items-center">
                            Purok {getSortIcon('purok')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/70"
                          onClick={() => handleSort('contact')}
                        >
                          <div className="flex items-center">
                            Contact {getSortIcon('contact')}
                          </div>
                        </TableHead>
                        <TableHead>Classifications</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedResidents.map((resident) => (
                        <ResidentRow 
                          key={resident.id} 
                          resident={resident} 
                          onViewDetails={handleViewDetails}
                          onEditResident={handleEditResident}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {filteredResidents.length === 0 && !isLoading && (
                <div className="py-12 text-center text-muted-foreground bg-muted/30">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-foreground">No residents found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
          
          {/* Pagination */}
          {filteredResidents.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {endIndex} of {filteredResidents.length} residents
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: pageCount }).map((_, i) => {
                    const pageNum = i + 1;
                    
                    // Show first page, last page, and pages around current page
                    if (
                      pageNum === 1 || 
                      pageNum === pageCount || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Show ellipsis for gaps
                    if (pageNum === 2 || pageNum === pageCount - 1) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(pageCount, currentPage + 1))}
                      className={currentPage === pageCount ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Tabs>
      </div>

      {/* Resident Details Dialog */}
      <ResidentDetails
        resident={selectedResident}
        open={isDetailsOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseDetails();
          else setIsDetailsOpen(true);
        }}
      />
      
      {/* Add Resident Dialog */}
      <Dialog 
        open={isAddResidentOpen} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setTimeout(() => {
              // Clean up after dialog is fully closed
              document.body.style.pointerEvents = '';
            }, 100);
          }
          setIsAddResidentOpen(isOpen);
        }}
      >
        <DialogContent 
          className="sm:max-w-[600px]" 
          onInteractOutside={(e) => {
            // Prevent issues with outside clicks
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Resident</DialogTitle>
            <DialogDescription>
              Enter the resident's information below. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          <ResidentForm onSubmit={() => {
            setIsAddResidentOpen(false);
            // Ensure pointer events are reset
            setTimeout(() => {
              document.body.style.pointerEvents = '';
            }, 100);
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Resident Dialog */}
      <Dialog 
        open={isEditResidentOpen} 
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseEditDialog();
          else setIsEditResidentOpen(isOpen);
        }}
      >
        <DialogContent 
          className="sm:max-w-[600px]" 
          onInteractOutside={(e) => {
            // Prevent issues with outside clicks
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Resident</DialogTitle>
            <DialogDescription>
              Update the resident's information below. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          <ResidentForm 
            resident={residentToEdit} 
            onSubmit={() => {
              handleCloseEditDialog();
              // Ensure pointer events are reset
              setTimeout(() => {
                document.body.style.pointerEvents = '';
              }, 100);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Update ResidentRow component to include the edit functionality
const ResidentRow = ({ 
  resident, 
  onViewDetails,
  onEditResident
}: { 
  resident: Resident;
  onViewDetails: (resident: Resident) => void;
  onEditResident: (resident: Resident) => void;
}) => {
  // Calculate age
  const birthDate = new Date(resident.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // Determine age group
  const getAgeGroup = (age: number): string => {
    if (age <= 12) return 'Child';
    if (age <= 19) return 'Teen';
    if (age <= 29) return 'Young Adult';
    if (age <= 59) return 'Adult';
    return 'Elderly';
  };
  
  const ageGroup = getAgeGroup(age);
  
  // Get purok if available (from database or as a property)
  const purok = (resident as any).purok || 'Not specified';
  
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">
        {resident.firstName} {resident.lastName}
      </TableCell>
      <TableCell>{resident.gender}</TableCell>
      <TableCell>
        <Badge className={`px-2 py-1 rounded-full text-xs font-medium ${
          resident.status === 'Permanent' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800' 
            : resident.status === 'Temporary'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
            : resident.status === 'Deceased'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
        }`}>
          {resident.status}
        </Badge>
      </TableCell>
      <TableCell>{age}</TableCell>
      <TableCell>{ageGroup}</TableCell>
      <TableCell>{purok}</TableCell>
      <TableCell>{resident.contactNumber || 'N/A'}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {resident.classifications?.map((classification, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className={`text-xs ${
                classification === 'indigent' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                : classification === 'student'
                  ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
                : classification === 'ofw'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                : classification === 'pwd'
                  ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
                : classification === 'missing'
                  ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                : ''
              }`}
            >
              {classification}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(resident)}>
              <Eye className="h-4 w-4 mr-2" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditResident(resident)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default ResidentsList;
