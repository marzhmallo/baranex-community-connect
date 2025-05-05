
import { Resident } from '../types';
import { supabase } from '@/integrations/supabase/client';

export type ResidentStatus = "Permanent" | "Temporary" | "Deceased" | "Relocated";

// Function to fetch all residents
export const getResidents = async (): Promise<Resident[]> => {
  const { data, error } = await supabase
    .from('residents')
    .select('*')
    .order('last_name', { ascending: true });

  if (error) throw error;

  // Map database fields to our application model
  return data.map(resident => {
    // Create emergency contact from individual fields
    const emergencyContact = {
      name: resident.emname || 'Emergency contact not set',
      relationship: resident.emrelation || 'Not specified',
      contactNumber: resident.emcontact ? resident.emcontact.toString() : 'Not specified'
    };

    return {
      id: resident.id,
      firstName: resident.first_name,
      lastName: resident.last_name,
      middleName: resident.middle_name || '',
      suffix: resident.suffix || '',
      gender: resident.gender,
      birthDate: resident.birthdate,
      address: resident.address,
      contactNumber: resident.mobile_number,
      email: resident.email || '',
      occupation: resident.occupation || '',
      status: resident.status as ResidentStatus,
      civilStatus: resident.civil_status,
      monthlyIncome: resident.monthly_income || 0,
      yearsInBarangay: resident.years_in_barangay || 0,
      purok: resident.purok,
      barangay: resident.barangaydb,
      municipality: resident.municipalitycity,
      province: resident.provinze,
      region: resident.regional,
      country: resident.countryph || '',
      nationality: resident.nationality || '',
      isVoter: resident.is_voter,
      hasPhilhealth: resident.has_philhealth,
      hasSss: resident.has_sss,
      hasPagibig: resident.has_pagibig,
      hasTin: resident.has_tin,
      classifications: resident.classifications || [], // Ensure classifications is an array
      remarks: resident.remarks || '',
      emergencyContact
    };
  });
};

// Function to fetch a single resident by ID
export const getResidentById = async (id: string): Promise<Resident | null> => {
  const { data, error } = await supabase
    .from('residents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Create emergency contact from individual fields
  const emergencyContact = {
    name: data.emname || 'Emergency contact not set',
    relationship: data.emrelation || 'Not specified',
    contactNumber: data.emcontact ? data.emcontact.toString() : 'Not specified'
  };

  // Map database fields to our application model
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    middleName: data.middle_name || '',
    suffix: data.suffix || '',
    gender: data.gender,
    birthDate: data.birthdate,
    address: data.address,
    contactNumber: data.mobile_number,
    email: data.email || '',
    occupation: data.occupation || '',
    status: data.status as ResidentStatus,
    civilStatus: data.civil_status,
    monthlyIncome: data.monthly_income || 0,
    yearsInBarangay: data.years_in_barangay || 0,
    purok: data.purok,
    barangay: data.barangaydb,
    municipality: data.municipalitycity,
    province: data.provinze,
    region: data.regional,
    country: data.countryph || '',
    nationality: data.nationality || '',
    isVoter: data.is_voter,
    hasPhilhealth: data.has_philhealth,
    hasSss: data.has_sss,
    hasPagibig: data.has_pagibig,
    hasTin: data.has_tin,
    classifications: data.classifications || [], // Ensure classifications is an array
    remarks: data.remarks || '',
    emergencyContact
  };
};

// Function to save (create or update) a resident
export const saveResident = async (residentData: Partial<Resident>) => {
  try {
    console.log("saveResident called with:", residentData);
    
    // Prepare the base data - using explicit typing to avoid TypeScript errors
    const baseData: Record<string, any> = {
      first_name: residentData.firstName?.trim(),
      middle_name: residentData.middleName?.trim() || null,
      last_name: residentData.lastName?.trim(),
      birthdate: residentData.birthDate,
      gender: residentData.gender,
      civil_status: residentData.civilStatus,
      mobile_number: residentData.contactNumber?.trim() || null,
      email: residentData.email?.trim() || null,
      address: residentData.address?.trim(),
      purok: residentData.purok?.trim() || null,
      occupation: residentData.occupation?.trim() || null,
      monthly_income: residentData.monthlyIncome,
      years_in_barangay: residentData.yearsInBarangay,
      is_voter: residentData.isVoter,
      has_philhealth: residentData.hasPhilhealth,
      has_sss: residentData.hasSss,
      has_pagibig: residentData.hasPagibig,
      has_tin: residentData.hasTin,
      nationality: residentData.nationality?.trim() || null,
      remarks: residentData.remarks?.trim() || null,
      status: residentData.status,
      classifications: residentData.classifications,
      // Address fields with special names - provide required defaults
      barangaydb: residentData.barangay?.trim() || "Unknown",
      municipalitycity: residentData.municipality?.trim() || "Unknown",
      regional: residentData.region?.trim() || "Unknown",
      provinze: residentData.province?.trim() || "Unknown",
      countryph: residentData.country?.trim() || "Philippines",
      // Emergency contact - handle conversion properly
      emname: residentData.emergencyContact?.name?.trim() || null,
      emrelation: residentData.emergencyContact?.relationship?.trim() || null,
    };
    
    // Convert emergency contact number to numeric format if provided
    if (residentData.emergencyContact?.contactNumber) {
      const numericValue = residentData.emergencyContact.contactNumber.replace(/\D/g, '');
      baseData.emcontact = numericValue.length > 0 ? parseFloat(numericValue) : null;
    } else {
      baseData.emcontact = null;
    }

    // For existing residents, update
    if (residentData.id) {
      console.log("Updating existing resident:", residentData.id);
      baseData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('residents')
        .update(baseData)
        .eq('id', residentData.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating resident:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, error: error.message };
      }

      console.log("Resident updated successfully:", data);
      return { success: true, data };
    } 
    // For new residents, create
    else {
      console.log("Creating new resident");
      // Add required fields for new residents
      baseData.id = crypto.randomUUID();
      baseData.created_at = new Date().toISOString();
      baseData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('residents')
        .insert(baseData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating resident:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, error: error.message };
      }

      console.log("Resident created successfully:", data);
      return { success: true, data };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Function to create a resident (legacy function, use saveResident instead)
export const createResident = async (residentData: any): Promise<{ success: boolean; error: any }> => {
  try {
    console.log("Legacy createResident function called, consider using saveResident instead");
    const { error } = await supabase
      .from('residents')
      .insert(residentData);
    
    if (error) {
      console.error("Error creating resident:", error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Exception creating resident:", error);
    return { success: false, error };
  }
};
