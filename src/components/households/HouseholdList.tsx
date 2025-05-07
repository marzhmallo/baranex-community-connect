
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

// Mock household data for initial display
const mockHouseholds = [
  { id: "1", householdNumber: "H001", address: "123 Main St", headOfHousehold: "John Doe", contactNumber: "123-456-7890", memberCount: 4 },
  { id: "2", householdNumber: "H002", address: "456 Elm St", headOfHousehold: "Jane Smith", contactNumber: "234-567-8901", memberCount: 3 },
  { id: "3", householdNumber: "H003", address: "789 Oak St", headOfHousehold: "Robert Johnson", contactNumber: "345-678-9012", memberCount: 5 },
];

const HouseholdList: React.FC = () => {
  // In a real app, you would fetch this data from your backend
  const [households] = React.useState(mockHouseholds);

  const handleEdit = (id: string) => {
    console.log(`Edit household with ID: ${id}`);
    // Implement edit functionality
  };

  const handleDelete = (id: string) => {
    console.log(`Delete household with ID: ${id}`);
    // Implement delete functionality
  };

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Household #</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Head of Household</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Members</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {households.map((household) => (
            <TableRow key={household.id}>
              <TableCell>{household.householdNumber}</TableCell>
              <TableCell>{household.address}</TableCell>
              <TableCell>{household.headOfHousehold}</TableCell>
              <TableCell>{household.contactNumber}</TableCell>
              <TableCell>{household.memberCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(household.id)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(household.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HouseholdList;
