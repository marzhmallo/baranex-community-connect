
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveHousehold } from "@/lib/api/households";
import { Household } from "@/lib/types";

// Define form schema
const householdFormSchema = z.object({
  name: z.string().min(1, { message: "Household name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  purok: z.string().min(1, { message: "Purok is required" }),
  head_of_family: z.string().optional(),
  contact_number: z.string().optional(),
  year_established: z.coerce.number().int().optional(),
  status: z.enum(["Active", "Inactive", "Relocated"]),
  monthly_income: z.string().optional(),
  property_type: z.string().optional(),
  house_type: z.string().optional(),
  water_source: z.string().optional(),
  electricity_source: z.string().optional(),
  toilet_type: z.string().optional(),
  garbage_disposal: z.string().optional(),
  remarks: z.string().optional(),
});

type HouseholdFormValues = z.infer<typeof householdFormSchema>;

interface HouseholdFormProps {
  onSubmit: () => void;
  household?: Household;
}

const HouseholdForm: React.FC<HouseholdFormProps> = ({ onSubmit, household }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Transform household data for the form
  const defaultValues: HouseholdFormValues = household ? {
    name: household.name,
    address: household.address,
    purok: household.purok,
    head_of_family: household.head_of_family || "",
    contact_number: household.contact_number || "",
    year_established: household.year_established || undefined,
    status: household.status as "Active" | "Inactive" | "Relocated",
    monthly_income: household.monthly_income || "",
    property_type: household.property_type || "",
    house_type: household.house_type || "",
    water_source: household.water_source || "",
    electricity_source: household.electricity_source || "",
    toilet_type: household.toilet_type || "",
    garbage_disposal: household.garbage_disposal || "",
    remarks: household.remarks || "",
  } : {
    name: "",
    address: "",
    purok: "",
    head_of_family: "",
    contact_number: "",
    year_established: undefined,
    status: "Active",
    monthly_income: "",
    property_type: "",
    house_type: "",
    water_source: "",
    electricity_source: "",
    toilet_type: "",
    garbage_disposal: "",
    remarks: "",
  };
  
  const form = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    defaultValues,
  });

  const handleSubmit = async (values: HouseholdFormValues) => {
    console.log("Form submitted with values:", values);
    setIsSubmitting(true);
    
    try {
      // Create the household data object based on form values
      const householdToSave: Partial<Household> = {
        id: household?.id,
        name: values.name,
        address: values.address,
        purok: values.purok,
        head_of_family: values.head_of_family || null,
        contact_number: values.contact_number || null,
        year_established: values.year_established || null,
        status: values.status,
        monthly_income: values.monthly_income || null,
        property_type: values.property_type || null,
        house_type: values.house_type || null,
        water_source: values.water_source || null,
        electricity_source: values.electricity_source || null,
        toilet_type: values.toilet_type || null,
        garbage_disposal: values.garbage_disposal || null,
        remarks: values.remarks || null,
      };
      
      console.log("Sending to saveHousehold:", householdToSave);
      
      // Use the saveHousehold function
      const result = await saveHousehold(householdToSave);
      
      console.log("saveHousehold result:", result);

      if (!result.success) {
        console.error("Error in saveHousehold:", result.error);
        throw new Error(result.error);
      }

      // Show success toast
      toast({
        title: household ? "Household updated successfully" : "Household added successfully",
        description: `${values.name} has been ${household ? 'updated in' : 'added to'} the database.`
      });

      // Invalidate households query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['households']
      });

      // Close the dialog
      onSubmit();
    } catch (error: any) {
      console.error('Error saving household:', error);
      toast({
        title: "Error saving household",
        description: error.message || "There was a problem saving the household.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle cancel button click
  const handleCancel = () => {
    // Reset form values
    form.reset();
    // Close dialog
    onSubmit();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="pr-4 h-[calc(85vh-180px)]">
          <div className="pr-4 space-y-6">
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Household Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe Family" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Relocated">Relocated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purok *</FormLabel>
                    <FormControl>
                      <Input placeholder="Purok 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year_established"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Established</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2010" 
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="head_of_family"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Family</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="monthly_income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income</FormLabel>
                  <FormControl>
                    <Input placeholder="20000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium mb-4 pt-4 border-t">Property Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Residential" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="house_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Concrete" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="water_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water Source</FormLabel>
                    <FormControl>
                      <Input placeholder="City Water" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="electricity_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Electricity Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Meralco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="toilet_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toilet Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Water-sealed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="garbage_disposal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garbage Disposal</FormLabel>
                    <FormControl>
                      <Input placeholder="Collected weekly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <h3 className="text-lg font-medium mb-4 pt-4 border-t">Additional Information</h3>
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this household" 
                      className="resize-none min-h-[150px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-4 pt-4 border-t mt-6">
          <Button
            variant="outline"
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : household ? "Update Household" : "Save Household"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default HouseholdForm;
