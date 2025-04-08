import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent } from "@/components/ui/card";
import { Resident } from '@/lib/types';
import { residents } from '@/lib/data';
import ResidentForm from './ResidentForm';

const ResidentsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = 
      searchQuery === '' || 
      `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === null || resident.status === selectedStatus;
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'active' && resident.status === 'Active') ||
      (activeTab === 'inactive' && resident.status === 'Inactive') ||
      (activeTab === 'deceased' && resident.status === 'Deceased') ||
      (activeTab === 'transferred' && resident.status === 'Transferred');
    
    return matchesSearch && matchesStatus && matchesTab;
  });
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
  };

  // Count residents by status
  const activeCount = residents.filter(r => r.status === 'Active').length;
  const inactiveCount = residents.filter(r => r.status === 'Inactive').length;
  const deceasedCount = residents.filter(r => r.status === 'Deceased').length;
  const transferredCount = residents.filter(r => r.status === 'Transferred').length;

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-700">Active Residents</p>
              <p className="text-2xl font-bold text-green-800">{activeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-700">Inactive Residents</p>
              <p className="text-2xl font-bold text-blue-800">{inactiveCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-red-700">Deceased Residents</p>
              <p className="text-2xl font-bold text-red-800">{deceasedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center">
              <Users className="h-5 w-5 text-red-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-purple-700">Transferred Residents</p>
              <p className="text-2xl font-bold text-purple-800">{transferredCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-700" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
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
              Showing <span className="font-medium">{filteredResidents.length}</span> of{" "}
              <span className="font-medium">{residents.length}</span> residents
            </p>
          </div>
          
          <TabsContent value="all" className="m-0">
            {renderResidentsTable(filteredResidents)}
          </TabsContent>
          <TabsContent value="active" className="m-0">
            {renderResidentsTable(filteredResidents)}
          </TabsContent>
          <TabsContent value="inactive" className="m-0">
            {renderResidentsTable(filteredResidents)}
          </TabsContent>
          <TabsContent value="deceased" className="m-0">
            {renderResidentsTable(filteredResidents)}
          </TabsContent>
          <TabsContent value="transferred" className="m-0">
            {renderResidentsTable(filteredResidents)}
          </TabsContent>
        </Tabs>
      </Card>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>Total: {residents.length} residents</div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <span>Page 1 of 1</span>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
};

const renderResidentsTable = (residents: Resident[]) => {
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
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {residents.map((resident) => (
            <ResidentRow key={resident.id} resident={resident} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ResidentRow = ({ resident }: { resident: Resident }) => {
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center">
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
