
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
import { fetchResidents } from '@/lib/api/residents';
import { useQuery } from '@tanstack/react-query';
import ResidentForm from './ResidentForm';
import ResidentStatusCard from './ResidentStatusCard';
import ResidentDetails from './ResidentDetails';
import { toast } from '@/hooks/use-toast';

const ResidentsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch residents data from Supabase
  const { data: residents = [], isLoading, error } = useQuery({
    queryKey: ['residents'],
    queryFn: fetchResidents,
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
  const activeCount = residents.filter(r => r.status === 'Active').length;
  const inactiveCount = residents.filter(r => r.status === 'Inactive').length;
  const deceasedCount = residents.filter(r => r.status === 'Deceased').length;
  const transferredCount = residents.filter(r => r.status === 'Transferred').length;

  // Get unique classifications
  const allClassifications = useMemo(() => {
    const classifications = new Set<string>();
    residents.forEach(resident => {
      resident.classifications?.forEach(c => classifications.add(c));
    });
    return Array.from(classifications);
  }, [residents]);
  
  const filteredResidents = useMemo(() => {
    return residents.filter(resident => {
      // Search filter
      const matchesSearch = 
        searchQuery === '' || 
        `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resident.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = selectedStatus === null || resident.status === selectedStatus;
      
      // Tab filter
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'active' && resident.status === 'Active') ||
        (activeTab === 'inactive' && resident.status === 'Inactive') ||
        (activeTab === 'deceased' && resident.status === 'Deceased') ||
        (activeTab === 'transferred' && resident.status === 'Transferred');
      
      // Classifications filter
      const matchesClassifications = 
        selectedClassifications.length === 0 || 
        (resident.classifications && 
          selectedClassifications.every(c => resident.classifications?.includes(c)));
      
      return matchesSearch && matchesStatus && matchesTab && matchesClassifications;
    });
  }, [searchQuery, selectedStatus, activeTab, selectedClassifications, residents]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
  };

  const handleClassificationToggle = (classification: string) => {
    if (selectedClassifications.includes(classification)) {
      setSelectedClassifications(prev => prev.filter(c => c !== classification));
    } else {
      setSelectedClassifications(prev => [...prev, classification]);
    }
  };

  const handleStatusCardClick = (status: string) => {
    setActiveTab(status.toLowerCase());
    setSelectedStatus(status);
  };

  const handleViewDetails = (resident: Resident) => {
    setSelectedResident(resident);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResidentStatusCard
          label="Active Residents"
          count={activeCount}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
          textColor="text-green-800"
          iconBgColor="bg-green-200"
          iconColor="text-green-700"
          onClick={() => handleStatusCardClick('Active')}
        />
        
        <ResidentStatusCard
          label="Inactive Residents"
          count={inactiveCount}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          textColor="text-blue-800"
          iconBgColor="bg-blue-200"
          iconColor="text-blue-700"
          onClick={() => handleStatusCardClick('Inactive')}
        />
        
        <ResidentStatusCard
          label="Deceased Residents"
          count={deceasedCount}
          bgColor="bg-gradient-to-br from-red-50 to-red-100"
          textColor="text-red-800"
          iconBgColor="bg-red-200"
          iconColor="text-red-700"
          onClick={() => handleStatusCardClick('Deceased')}
        />
        
        <ResidentStatusCard
          label="Transferred Residents"
          count={transferredCount}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          textColor="text-purple-800"
          iconBgColor="bg-purple-200"
          iconColor="text-purple-700"
          onClick={() => handleStatusCardClick('Transferred')}
        />
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border-b">
            <TabsList className="h-10">
              <TabsTrigger value="all" className="rounded-md">All Residents</TabsTrigger>
              <TabsTrigger value="active" className="rounded-md">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="rounded-md">Inactive</TabsTrigger>
              <TabsTrigger value="deceased" className="rounded-md">Deceased</TabsTrigger>
              <TabsTrigger value="transferred" className="rounded-md">Transferred</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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
                  <DropdownMenuItem onClick={() => handleStatusFilter('Active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Inactive')}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Deceased')}>
                    Deceased
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilter('Transferred')}>
                    Transferred
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
              
              <Dialog open={isAddResidentOpen} onOpenChange={setIsAddResidentOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Resident
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Resident</DialogTitle>
                    <DialogDescription>
                      Enter the resident's information below. Required fields are marked with an asterisk (*).
                    </DialogDescription>
                  </DialogHeader>
                  <ResidentForm onSubmit={() => setIsAddResidentOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4">
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
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading residents..."
              ) : (
                <>
                  Showing <span className="font-medium">{filteredResidents.length}</span> of{" "}
                  <span className="font-medium">{residents.length}</span> residents
                </>
              )}
            </p>
          </div>
          
          {/* Tabs Content */}
          {['all', 'active', 'inactive', 'deceased', 'transferred'].map(tab => (
            <TabsContent key={tab} value={tab} className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderResidentsTable(filteredResidents, handleViewDetails)
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>Total: {residents.length} residents</div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <span>Page 1 of 1</span>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>

      {/* Resident Details Dialog */}
      <ResidentDetails
        resident={selectedResident}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
};

const renderResidentsTable = (residents: Resident[], onViewDetails: (resident: Resident) => void) => {
  if (residents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No residents found matching your search criteria.
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classifications</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {residents.map((resident) => (
            <ResidentRow 
              key={resident.id} 
              resident={resident} 
              onViewDetails={onViewDetails} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ResidentRow = ({ 
  resident, 
  onViewDetails 
}: { 
  resident: Resident;
  onViewDetails: (resident: Resident) => void;
}) => {
  // Calculate age
  const birthDate = new Date(resident.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return (
    <TableRow>
      <TableCell className="font-medium">
        {resident.firstName} {resident.lastName}
      </TableCell>
      <TableCell>{resident.gender}</TableCell>
      <TableCell>{age}</TableCell>
      <TableCell className="max-w-[200px] truncate" title={resident.address}>
        {resident.address}
      </TableCell>
      <TableCell>{resident.contactNumber}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          resident.status === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : resident.status === 'Inactive'
            ? 'bg-gray-100 text-gray-800'
            : resident.status === 'Deceased'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {resident.status}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {resident.classifications?.map((classification, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-blue-50 text-xs text-blue-800 border-blue-100"
            >
              {classification}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center" onClick={() => onViewDetails(resident)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center text-red-600">
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
