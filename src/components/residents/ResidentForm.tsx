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
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";
import { saveResident } from "@/lib/api/residents";
import { Resident } from "@/lib/types";

// Available resident classifications
const residentClassifications = [
  {
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
  }
];

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
  contactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX").optional().or(z.literal('')),
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
  emergencyContactName: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal('')),
  emergencyContactRelationship: z.string().min(2, "Relationship must be at least 2 characters").optional().or(z.literal('')),
  emergencyContactNumber: z.string().regex(/^09\d{9}$/, "Phone number must be in the format 09XXXXXXXXX").optional().or(z.literal('')),
  status: z.enum(["Active", "Inactive", "Deceased", "Transferred"]),
  remarks: z.string().optional()
});

// Define the type for form values based on the schema
type ResidentFormValues = z.infer<typeof formSchema>;

interface ResidentFormProps {
  onSubmit: () => void;
  resident?: Resident;
}

// Map database status to form status
const mapDBStatusToForm = (dbStatus: string): "Active" | "Inactive" | "Deceased" | "Transferred" => {
  switch (dbStatus) {
    case 'Permanent': return 'Permanent';
    case 'Temporary': return 'Temporary';
    case 'Deceased': return 'Deceased';
    case 'Relocated': return 'Relocated';
    default: return 'Inactive'; // Default fallback
  }
};

// Map form status to database format
const mapApplicationStatus = (formStatus: string): "Permanent" | "Temporary" | "Deceased" | "Relocated" => {
  switch (formStatus) {
    case 'Permanent': return 'Permanent';
    case 'Temporary': return 'Temporary';
    case 'Deceased': return 'Deceased';
    case 'Relocated': return 'Relocated';
    default: return 'Temporary'; // Default fallback
  }
};

const ResidentForm = ({
  onSubmit,
  resident
}: ResidentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Transform resident data for the form
  const transformResidentForForm = (resident: Resident): ResidentFormValues => {
    return {
      // Personal Info
      firstName: resident.firstName,
      lastName: resident.lastName,
      middleName: resident.middleName ?? "",
      suffix: resident.suffix ?? "",
      gender: resident.gender as "Male" | "Female" | "Other",
      birthDate: resident.birthDate,
      
      // Address
      address: resident.address,
      purok: resident.purok ?? "",
      barangay: resident.barangay ?? "",
      municipality: resident.municipality ?? "",
      province: resident.province ?? "",
      region: resident.region ?? "",
      country: resident.country ?? "",
      
      // Contact
      contactNumber: resident.contactNumber ?? "",
      email: resident.email ?? "",
      
      // Civil Status
      civilStatus: resident.civilStatus as "Single" | "Married" | "Widowed" | "Divorced" | "Separated",
      status: mapDBStatusToForm(resident.status),
      
      // Economic
      occupation: resident.occupation ?? "",
      monthlyIncome: resident.monthlyIncome ?? 0,
      yearsInBarangay: resident.yearsInBarangay ?? 0,
      
      // Documents
      isVoter: resident.isVoter ?? false,
      hasPhilhealth: resident.hasPhilhealth ?? false,
      hasSss: resident.hasSss ?? false,
      hasPagibig: resident.hasPagibig ?? false,
      hasTin: resident.hasTin ?? false,
      
      // Other
      nationality: resident.nationality ?? "",
      classifications: resident.classifications ?? [],
      remarks: resident.remarks ?? "",
      
      // Emergency Contact
      emergencyContactName: resident.emergencyContact?.name ?? "",
      emergencyContactRelationship: resident.emergencyContact?.relationship ?? "",
      emergencyContactNumber: resident.emergencyContact?.contactNumber ?? ""
    };
  };
  
  const defaultValues: ResidentFormValues = resident ? transformResidentForForm(resident) : {
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
    country: "Philippines",
    contactNumber: "",
    email: "",
    occupation: "",
    civilStatus: "Single",
    monthlyIncome: 0,
    yearsInBarangay: 0,
    nationality: "Filipino",
    isVoter: false,
    hasPhilhealth: false,
    hasSss: false,
    hasPagibig: false,
    hasTin: false,
    classifications: [],
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactNumber: "",
    status: "Active", // Default status
    remarks: ""
  };
  
  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  const handleSubmit = async (values: ResidentFormValues) => {
    console.log("Form submitted with values:", values);
    setIsSubmitting(true);
    
    try {
      const residentToSave: Resident = {
        id: resident?.id, // Undefined for new residents
        
        // Personal Info
        id: resident?.id,
  first_name: values.firstName.trim(),
  middle_name: values.middleName?.trim() || null, // Use null instead of undefined
  last_name: values.lastName.trim(),
  suffix: values.suffix?.trim() || null,
  gender: values.gender,
  birthdate: values.birthDate,
        
        // Address
        address: values.address.trim(),
        purok: values.purok.trim() || undefined,
       barangaydb: values.barangay?.trim() || null, // ← Different name
  municipalitycity: values.municipality?.trim() || null, // ← Combined field
  regional: values.region?.trim() || null, // ← Different name
  provinze: values.province?.trim() || null, // ← Note spelling
  countryph: values.country?.trim() || null, // ← Different name

        
        // Contact
        mobile_number: values.contactNumber?.trim() || undefined,
        email: values.email?.trim() || undefined,
        
        // Status
        status: mapApplicationStatus(values.status),
        civil_status: values.civilStatus,
        
        // Economic
        occupation: values.occupation?.trim() || undefined,
        monthly_income: values.monthlyIncome,
        years_in_barangay: values.yearsInBarangay,
        
        // Documents
        is_Voter: values.isVoter,
        has_Philhealth: values.hasPhilhealth,
        has_Sss: values.hasSss,
        has_Pagibig: values.hasPagibig,
        has_Tin: values.hasTin,
        
        // Other
        nationality: values.nationality?.trim() || undefined,
        classifications: values.classifications,
        remarks: values.remarks?.trim() || undefined,
        
        // Emergency Contact
        emergencyContact: {
          emname: values.emergencyContactName?.trim() || '',
          emrelation: values.emergencyContactRelationship?.trim() || '',
          emcontact: values.emergencyContactNumber?.trim() || ''
        }
      };
      
      console.log("Sending to saveResident:", residentToSave);
      
      // Use the saveResident function
      const { success, error } = await saveResident(residentToSave);
      
      console.log("saveResident result:", { success, error });

      if (!success) {
        console.error("Error in saveResident:", error);
        throw error;
      }

      // Show success toast
      toast({
        title: resident ? "Resident updated successfully" : "Resident added successfully",
        description: `${values.firstName} ${values.lastName} has been ${resident ? 'updated in' : 'added to'} the database.`
      });

      // Invalidate residents query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['residents']
      });

      // Close the dialog
      onSubmit();
    } catch (error: any) {
      console.error('Error saving resident:', error);
      toast({
        title: "Error saving resident",
        description: error.message || "There was a problem saving the resident.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Maria Dela Cruz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="emergencyContactRelationship" render={({
                field
              }) => <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Spouse" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="emergencyContactNumber" render={({
                field
              }) => <FormItem>
                      <FormLabel>Contact Number</FormLabel>
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
            {isSubmitting ? "Saving..." : resident ? "Update Resident" : "Save Resident"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ResidentForm;
