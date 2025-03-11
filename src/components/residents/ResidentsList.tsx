
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  ChevronDown,
  MoreHorizontal 
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
import { Resident } from '@/lib/types';
import { residents } from '@/lib/data';
import ResidentForm from './ResidentForm';

const ResidentsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = 
      searchQuery === '' || 
      `${resident.firstName} ${resident.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === null || resident.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold">Resident Registry</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
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
      
      <div className="border rounded-lg overflow-hidden">
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
            {filteredResidents.map((resident) => (
              <ResidentRow key={resident.id} resident={resident} />
            ))}
          </TableBody>
        </Table>
        
        {filteredResidents.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No residents found matching your search criteria.
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>Showing {filteredResidents.length} of {residents.length} residents</div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <span>Page 1 of 1</span>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
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
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
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
