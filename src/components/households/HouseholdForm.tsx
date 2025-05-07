
import React from 'react';
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
import { useToast } from "@/hooks/use-toast";

// Define form schema
const householdFormSchema = z.object({
  householdNumber: z.string().min(1, { message: "Household number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  headOfHousehold: z.string().min(1, { message: "Head of household is required" }),
  contactNumber: z.string().optional(),
  memberCount: z.coerce.number().int().positive().optional(),
});

type HouseholdFormValues = z.infer<typeof householdFormSchema>;

interface HouseholdFormProps {
  onSubmit: () => void;
}

const HouseholdForm: React.FC<HouseholdFormProps> = ({ onSubmit }) => {
  const { toast } = useToast();
  
  const form = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: {
      householdNumber: "",
      address: "",
      headOfHousehold: "",
      contactNumber: "",
      memberCount: 1,
    },
  });

  const handleSubmit = (values: HouseholdFormValues) => {
    console.log("Form submitted with values:", values);
    
    // In a real app, you would save this data to your backend
    toast({
      title: "Household Added",
      description: `Household ${values.householdNumber} has been successfully added.`,
    });
    
    onSubmit();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="householdNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Household Number *</FormLabel>
                <FormControl>
                  <Input placeholder="H001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input placeholder="123-456-7890" {...field} />
                </FormControl>
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
            name="headOfHousehold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Head of Household *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="memberCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Members</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="submit" className="bg-baranex-primary hover:bg-baranex-primary/90">
            Add Household
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default HouseholdForm;
