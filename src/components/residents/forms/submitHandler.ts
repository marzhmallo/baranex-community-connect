
import { ResidentFormValues } from './formSchema';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { QueryClient } from '@tanstack/react-query';

interface SubmitHandlerOptions {
  onSuccess?: () => void;
  queryClient?: QueryClient;
}

export const submitResidentForm = async (
  values: ResidentFormValues, 
  options: SubmitHandlerOptions = {}
): Promise<void> => {
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
      status: values.status === 'Active' ? 'Temporary' : values.status === 'Inactive' ? 'Temporary' : values.status === 'Deceased' ? 'Deceased' : 'Relocated',
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
      remarks: values.remarks || null,
      // Emergency contact is not currently stored in the database
      // But we could add it to a separate table later if needed
    };
    
    const { error } = await supabase.from('residents').insert(residentData);
    
    if (error) throw error;
    
    // Show success toast
    toast({
      title: "Resident added successfully",
      description: `${values.firstName} ${values.lastName} has been added to the database.`,
    });
    
    // Invalidate residents query to refresh the list
    if (options.queryClient) {
      options.queryClient.invalidateQueries({ queryKey: ['residents'] });
    }
    
    // Call success callback if provided
    if (options.onSuccess) {
      options.onSuccess();
    }
    
  } catch (error: any) {
    console.error('Error adding resident:', error);
    toast({
      title: "Error adding resident",
      description: error.message || "There was a problem adding the resident.",
      variant: "destructive",
    });
    throw error; // Re-throw to allow the component to handle it
  }
};
