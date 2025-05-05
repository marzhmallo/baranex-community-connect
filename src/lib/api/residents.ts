import { Resident } from '../types';
import { supabase } from '@/integrations/supabase/client';

export type ResidentStatus = "Permanent" | "Temporary" | "Deceased" | "Relocated";

// Function to map database status to our application status
const mapDatabaseStatus = (status: string): ResidentStatus => {
  switch (status) {
    case 'Permanent': return 'Permanent';
    case 'Temporary': return 'Temporary';
    case 'Deceased': return 'Deceased';
    case 'Relocated': return 'Relocated';
    default: return 'Temporary'; // Default fallback
  }
};

// Function to map application status to database status
const mapApplicationStatus = (status: string): string => {
  switch (status) {
    case 'Active': return 'Permanent';
    case 'Inactive': return 'Temporary';
    case 'Deceased': return 'Deceased';
    case 'Transferred': return 'Relocated';
    default: return status; // If it's already using db naming
  }
};

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
      status: mapDatabaseStatus(resident.status),
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
    status: mapDatabaseStatus(data.status),
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

// Function to create a resident
export const createResident = async (residentData: any): Promise<{ success: boolean; error: any }> => {
  try {
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

// Function to save (create or update) a resident
export const saveResident = async (resident: Resident): Promise<{ success: boolean; error: any }> => {
  try {
    console.log("saveResident called with:", resident);
    // Map application model back to database fields, using exact database column names
    const residentData = {
      id: resident.id,
      first_name: resident.firstName,
      last_name: resident.lastName,
      middle_name: resident.middleName || null,
      suffix: resident.suffix || null,
      gender: resident.gender,
      birthdate: resident.birthDate,
      address: resident.address || null,
      mobile_number: resident.contactNumber || null,
      email: resident.email || null,
      occupation: resident.occupation || null,
      status: resident.status,
      civil_status: resident.civilStatus,
      monthly_income: resident.monthlyIncome || null,
      years_in_barangay: resident.yearsInBarangay || null,
      purok: resident.purok,
      barangaydb: resident.barangay,
      municipalitycity: resident.municipality,
      provinze: resident.province, // Note the "z" in provinze (actual database column name)
      regional: resident.region,
      countryph: resident.country || null,
      nationality: resident.nationality || null,
      is_voter: resident.isVoter || false,
      has_philhealth: resident.hasPhilhealth || false,
      has_sss: resident.hasSss || false,
      has_pagibig: resident.hasPagibig || false,
      has_tin: resident.hasTin || false,
      classifications: resident.classifications || [],
      remarks: resident.remarks || null,
      emname: resident.emergencyContact?.name || null,
      emrelation: resident.emergencyContact?.relationship || null,
      // Convert string to number or null if needed
      emcontact: resident.emergencyContact?.contactNumber && resident.emergencyContact.contactNumber.trim() !== '' ? 
        parseInt(resident.emergencyContact.contactNumber.replace(/\D/g, '')) || null : null
    };

    console.log("Processed resident data for DB:", residentData);
    
    let result;
    // Check if this is an update or create operation
    if (resident.id) {
      // Update existing resident
      console.log("Updating resident with ID:", resident.id);
      result = await supabase
        .from('residents')
        .update(residentData)
        .eq('id', resident.id);
    } else {
      // Create new resident with generated UUID
      // Remove id field for insert since it will be auto-generated
      const { id, ...dataWithoutId } = residentData;
      
      console.log("Creating new resident");
      result = await supabase
        .from('residents')
        .insert({
          ...dataWithoutId,
          id: crypto.randomUUID(), // Generate a new UUID for the resident
        });
    }
    
    if (result.error) {
      console.error("Supabase error:", result.error);
      return { success: false, error: result.error };
    }
    
    console.log("Resident saved successfully:", result);
    return { success: true, error: null };
  } catch (error) {
    console.error("Exception saving resident:", error);
    return { success: false, error };
  }
};

// Add more functions for CRUD operations as needed
