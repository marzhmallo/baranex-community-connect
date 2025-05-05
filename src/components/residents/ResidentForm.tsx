import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Form as FormProvider } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";

// Available resident classifications
const residentClassifications = [{
  id: "indigent",
  label: "Indigent"
}, {
  id: "student",
  label: "Student"
}, {
  id: "ofw",
  label: "OFW"
}, {
  id: "pwd",
  label: "PWD"
}, {
  id: "missing",
  label: "Missing"
}];

// Form schema using zod
const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date in YYYY-MM-DD format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  purok: z.string().min(1, "Purok is required"),
  barangay: z.string().min(1, "Barangay is required"),
  municipality: z.string().min(1, "Municipality is required"),
  province: z.string().min(1, "Province is required"),
  region: z.string().min(1, "Region is required"),
  country: z.string().min(1, "Country is required"),
  contactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX"),
  email: z.string().email("Invalid email format").optional().or(z.literal('')),
  occupation: z.string().optional(),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Divorced", "Separated"]),
  monthlyIncome: z.number().nonnegative().optional(),
  yearsInBarangay: z.number().int().nonnegative().optional(),
  nationality: z.string().default("Filipino"),
  isVoter: z.boolean().default(false),
  hasPhilhealth: z.boolean().default(false),
  hasSss: z.boolean().default(false),
  hasPagibig: z.boolean().default(false),
  hasTin: z.boolean().default(false),
  classifications: z.array(z.string()).default([]),
  emergencyContactName: z.string().min(2, "Name must be at least 2 characters"),
  emergencyContactRelationship: z.string().min(2, "Relationship must be at least 2 characters"),
  emergencyContactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX"),
  status: z.enum(["Active", "Inactive", "Deceased", "Transferred"]),
  remarks: z.string().optional()
});
interface ResidentFormProps {
  onSubmit: () => void;
}
const ResidentForm = ({
  onSubmit
}: ResidentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      gender: "Male",
      birthDate: "",
      address: "",
      purok: "",
      barangay: "",
      municipality: "",
      province: "",
      region: "",
      country: "",
      contactNumber: "",
      email: "",
      occupation: "",
      civilStatus: "Single",
      monthlyIncome: 0,
      yearsInBarangay: 0,
      nationality: "",
      isVoter: false,
      hasPhilhealth: false,
      hasSss: false,
      hasPagibig: false,
      hasTin: false,
      classifications: ["resident"],
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactNumber: "",
      status: "Active",
      remarks: ""
    }
  });
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Generate a UUID for the new resident
      const uuid = crypto.randomUUID();

      // Map form values to match Supabase table structure
      const residentData = {
        id: uuid,
        first_name: values.firstName,
        last_name: values.lastName,
        middle_name: values.middleName || null,
        suffix: values.suffix || null,
        gender: values.gender,
        birthdate: values.birthDate,
        address: values.address,
        mobile_number: values.contactNumber,
        email: values.email || null,
        occupation: values.occupation || null,
        status: values.status === 'Active' ? 'Permanent' : values.status === 'Inactive' ? 'Temporary' : values.status === 'Deceased' ? 'Deceased' : 'Relocated',
        civil_status: values.civilStatus,
        purok: values.purok,
        barangaydb: values.barangay,
        municipalitycity: values.municipality,
        provinze: values.province,
        regional: values.region,
        countryph: values.country,
        nationality: values.nationality,
        monthly_income: values.monthlyIncome || null,
        years_in_barangay: values.yearsInBarangay || null,
        is_voter: values.isVoter,
        has_philhealth: values.hasPhilhealth,
        has_sss: values.hasSss,
        has_pagibig: values.hasPagibig,
        has_tin: values.hasTin,
        classifications: values.classifications,
        remarks: values.remarks || null,
        emergency_contact: JSON.stringify({
          name: values.emergencyContactName,
          relationship: values.emergencyContactRelationship,
          contactNumber: values.emergencyContactNumber
        })
      };
      const {
        error
      } = await supabase.from('residents').insert(residentData);
      if (error) throw error;

      // Show success toast
      toast({
        title: "Resident added successfully",
        description: `${values.firstName} ${values.lastName} has been added to the database.`
      });

      // Invalidate residents query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['residents']
      });

      // Close the dialog
      onSubmit();
    } catch (error: any) {
      console.error('Error adding resident:', error);
      toast({
        title: "Error adding resident",
        description: error.message || "There was a problem adding the resident.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="pr-4 h-[calc(85vh-180px)]">
          <div className="pr-4 space-y-6">
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({
              field
            }) => <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="lastName" render={({
              field
            }) => <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="middleName" render={({
              field
            }) => <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Santos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="suffix" render={({
              field
            }) => <FormItem>
                    <FormLabel>Suffix</FormLabel>
                    <FormControl>
                      <Input placeholder="Jr., Sr., III" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="gender" render={({
              field
            }) => <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </FormItem>} />

              <FormField control={form.control} name="birthDate" render={({
              field
            }) => <FormItem>
                    <FormLabel>Birth Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="civilStatus" render={({
              field
            }) => <FormItem>
                    <FormLabel>Civil Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="nationality" render={({
              field
            }) => <FormItem>
                    <FormLabel>Nationality *</FormLabel>
                    <FormControl>
                      <Input placeholder="Filipino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <h3 className="text-lg font-medium mb-4 pt-4 border-t">Contact Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="purok" render={({
              field
            }) => <FormItem>
                    <FormLabel>Purok *</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="barangay" render={({
              field
            }) => <FormItem>
                    <FormLabel>Barangay *</FormLabel>
                    <FormControl>
                      <Input placeholder="San Jose" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="municipality" render={({
              field
            }) => <FormItem>
                    <FormLabel>Municipality/City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Manila" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="province" render={({
              field
            }) => <FormItem>
                    <FormLabel>Province *</FormLabel>
                    <FormControl>
                      <Input placeholder="Metro Manila" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="region" render={({
              field
            }) => <FormItem>
                    <FormLabel>Region *</FormLabel>
                    <FormControl>
                      <Input placeholder="NCR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="country" render={({
              field
            }) => <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input placeholder="Philippines" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="yearsInBarangay" render={({
              field
            }) => <FormItem>
                    <FormLabel>Years in Barangay</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value === undefined ? '' : field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="contactNumber" render={({
              field
            }) => <FormItem>
                    <FormLabel>Contact Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      Format: 09XXXXXXXXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="juan@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <h3 className="text-lg font-medium mb-4 pt-4 border-t">Resident Classifications</h3>
            <div>
              <FormField control={form.control} name="classifications" render={() => <FormItem>
                    <div className="mb-4">
                      <FormLabel>Classifications</FormLabel>
                      <FormDescription className="mt-1">
                        Select all that apply to this resident
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {residentClassifications.map(classification => <FormField key={classification.id} control={form.control} name="classifications" render={({
                  field
                }) => {
                  return <FormItem key={classification.id} className="flex flex-row items-center space-x-3 space-y-0 p-2 border rounded-md hover:bg-accent">
                                <FormControl>
                                  <Checkbox checked={field.value?.includes(classification.id)} onCheckedChange={checked => {
                        const currentValues = [...(field.value || [])];
                        if (checked) {
                          field.onChange([...currentValues, classification.id]);
                        } else {
                          field.onChange(currentValues.filter(value => value !== classification.id));
                        }
                      }} />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {classification.label}
                                </FormLabel>
                              </FormItem>;
                }} />)}
                    </div>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <h3 className="text-lg font-medium mb-4 pt-4 border-t">Other Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="occupation" render={({
              field
            }) => <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Teacher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="monthlyIncome" render={({
              field
            }) => <FormItem>
                    <FormLabel>Monthly Income</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20000" onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value === undefined ? '' : field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <h3 className="text-md font-medium mb-2 pt-2">Government IDs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="isVoter" render={({
              field
            }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Voter</FormLabel>
                    </div>
                  </FormItem>} />
              
              <FormField control={form.control} name="hasPhilhealth" render={({
              field
            }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>PhilHealth</FormLabel>
                    </div>
                  </FormItem>} />

              <FormField control={form.control} name="hasSss" render={({
              field
            }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>SSS</FormLabel>
                    </div>
                  </FormItem>} />

              <FormField control={form.control} name="hasPagibig" render={({
              field
            }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pag-IBIG</FormLabel>
                    </div>
                  </FormItem>} />

              <FormField control={form.control} name="hasTin" render={({
              field
            }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>TIN</FormLabel>
                    </div>
                  </FormItem>} />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Emergency Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="emergencyContactName" render={({
                field
              }) => <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Maria Dela Cruz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="emergencyContactRelationship" render={({
                field
              }) => <FormItem>
                      <FormLabel>Relationship *</FormLabel>
                      <FormControl>
                        <Input placeholder="Spouse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="emergencyContactNumber" render={({
                field
              }) => <FormItem>
                      <FormLabel>Contact Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="09123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </div>
    
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Resident Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({
                field
              }) => <FormItem>
                      <FormLabel>Resident Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </FormItem>} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField control={form.control} name="remarks" render={({
                field
              }) => <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes about this resident" className="resize-none min-h-[150px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-4 pt-4 border-t mt-6">
          <Button variant="outline" type="button" onClick={onSubmit} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Resident"}
          </Button>
        </div>
      </form>
    </FormProvider>;
};
export default ResidentForm;
