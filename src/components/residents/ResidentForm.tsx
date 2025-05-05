
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast"
import { useQueryClient } from '@tanstack/react-query'

// Form schema using zod
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date in YYYY-MM-DD format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  contactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX"),
  email: z.string().email("Invalid email format").optional().or(z.literal('')),
  occupation: z.string().optional(),
  educationLevel: z.string().optional(),
  familySize: z.number().int().positive().optional(),
  emergencyContactName: z.string().min(2, "Name must be at least 2 characters"),
  emergencyContactRelationship: z.string().min(2, "Relationship must be at least 2 characters"),
  emergencyContactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX"),
  status: z.enum(["Active", "Inactive", "Deceased", "Transferred"]),
});

interface ResidentFormProps {
  onSubmit: () => void;
}

const ResidentForm = ({ onSubmit }: ResidentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      address: "",
      contactNumber: "",
      email: "",
      occupation: "",
      educationLevel: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactNumber: "",
      status: "Active",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Map form values to match Supabase table structure
      const residentData = {
        first_name: values.firstName,
        last_name: values.lastName,
        gender: values.gender,
        birthdate: values.birthDate,
        address: values.address,
        mobile_number: values.contactNumber,
        email: values.email || null,
        occupation: values.occupation || null,
        education: values.educationLevel || null,
        status: values.status,
        emergency_contact_name: values.emergencyContactName,
        emergency_contact_relationship: values.emergencyContactRelationship,
        emergency_contact_number: values.emergencyContactNumber,
        // Set other required fields for the table
        civil_status: 'Single', // Default value, update as needed
        purok: '1', // Default value, update as needed
        barangaydb: 'San Jose', // Default value, update as needed
        countryph: 'Philippines', // Default value
        nationality: 'Filipino', // Default value
        municipalitycity: 'Manila', // Default value, update as needed
        provinze: 'Metro Manila', // Default value, update as needed
        regional: 'NCR' // Default value, update as needed
      };
      
      const { error } = await supabase.from('residents').insert([residentData]);
      
      if (error) throw error;
      
      // Show success toast
      toast({
        title: "Resident added successfully",
        description: `${values.firstName} ${values.lastName} has been added to the database.`,
      });
      
      // Invalidate residents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      
      // Close the dialog
      onSubmit();
    } catch (error: any) {
      console.error('Error adding resident:', error);
      toast({
        title: "Error adding resident",
        description: error.message || "There was a problem adding the resident.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Dela Cruz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birth Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Contact Number *</FormLabel>
                <FormControl>
                  <Input placeholder="09123456789" {...field} />
                </FormControl>
                <FormDescription>
                  Format: 09XXXXXXXXX
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="juan@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input placeholder="Teacher" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="educationLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education Level</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Elementary">Elementary</SelectItem>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="Vocational">Vocational</SelectItem>
                    <SelectItem value="College">College</SelectItem>
                    <SelectItem value="Post-Graduate">Post-Graduate</SelectItem>
                    <SelectItem value="None">None</SelectItem>
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
              <FormLabel>Complete Address *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Complete street address" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Emergency Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Maria Dela Cruz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactRelationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship *</FormLabel>
                  <FormControl>
                    <Input placeholder="Spouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="09123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resident Status *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={onSubmit} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Resident"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ResidentForm;
