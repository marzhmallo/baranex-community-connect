import { Resident } from '../types';
import { supabase } from '@/integrations/supabase/client';

export type ResidentStatus = "Permanent" | "Temporary" | "Deceased" | "Relocated";

// Function to get the current user's barangay ID
export const getCurrentUserBarangayId = async (): Promise<string | null> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Get user profile to find brgyid
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('brgyid')
      .eq('id', user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    if (!profileData?.brgyid) {
      // If user profile doesn't have brgyid, try to get it from adminid relationship
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('brgyid')
        .eq('adminid', user.id)
        .maybeSingle();
        
      if (adminError) {
        console.error('Error fetching admin profile:', adminError);
        return null;
      }
      
      return adminProfile?.brgyid || null;
    }
    
    return profileData.brgyid;
  } catch (error) {
    console.error('Error getting current user barangay ID:', error);
    return null;
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
      address: resident.address || '',  // Ensure address is never null
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
      photoUrl: resident.photo_url || '',
      emergencyContact,
      diedOn: resident.died_on || null, // Add died_on field
      createdat: resident.created_at,
      updatedat: resident.updated_at,
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
    address: data.address || '', // Ensure address is never null
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
    photoUrl: data.photo_url || '',
    emergencyContact,
    diedOn: data.died_on || null, // Add died_on field
     createdat: resident.created_at,
      updatedat: resident.updated_at,
  };
};

// Function to save (create or update) a resident
export const saveResident = async (residentData: Partial<Resident>) => {
  try {
    console.log("saveResident called with:", residentData);
    
    // Get the brgyid of the currently logged in user
    const brgyid = await getCurrentUserBarangayId();
    console.log("Current user's brgyid:", brgyid);
    
    if (!brgyid) {
      console.error("Failed to get current user's barangay ID");
      return { success: false, error: "User's barangay ID not found" };
    }
    
    // Define the expected database schema fields for Supabase
    interface ResidentDatabaseFields {
      first_name?: string;
      middle_name?: string | null;
      last_name?: string;
      birthdate?: string;
      gender?: string;
      civil_status?: string;
      mobile_number?: string | null;
      email?: string | null;
      address?: string | null;
      purok?: string | null;
      occupation?: string | null;
      monthly_income?: number;
      years_in_barangay?: number;
      is_voter?: boolean;
      has_philhealth?: boolean;
      has_sss?: boolean;
      has_pagibig?: boolean;
      has_tin?: boolean;
      nationality?: string | null;
      remarks?: string | null;
      status?: string;
      classifications?: string[];
      barangaydb?: string;
      municipalitycity?: string;
      regional?: string;
      provinze?: string;
      countryph?: string;
      emname?: string | null;
      emrelation?: string | null;
      emcontact?: number | null;
      suffix?: string | null;
      updated_at?: string;
      died_on?: string | null;
      brgyid?: string | null;
      photo_url?: string | null;
       created_at?: string | null;
      updated_at?: string | null;
    }
    
    // Map from our application model to database model
    const databaseFields: ResidentDatabaseFields = {
      first_name: residentData.firstName?.trim(),
      middle_name: residentData.middleName?.trim() || null,
      last_name: residentData.lastName?.trim(),
      birthdate: residentData.birthDate,
      gender: residentData.gender,
      civil_status: residentData.civilStatus,
      mobile_number: residentData.contactNumber?.trim() || null,
      email: residentData.email?.trim() || null,
      // Always ensure there's a value for the address field
      address: residentData.address?.trim() || "No detailed address provided",
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
      // Emergency contact - handle each field individually
      emname: residentData.emergencyContact?.name?.trim() || null,
      emrelation: residentData.emergencyContact?.relationship?.trim() || null,
      // Add died_on date
      died_on: residentData.diedOn || null,
      // Add the brgyid of the currently logged in user
      brgyid: brgyid,
      // Add photo URL
      photo_url: residentData.photoUrl || null,
    };
    
    // Convert emergency contact number to numeric format if provided
    if (residentData.emergencyContact?.contactNumber) {
      // Remove non-numeric characters
      const numericValue = residentData.emergencyContact.contactNumber.replace(/\D/g, '');
      databaseFields.emcontact = numericValue.length > 0 ? parseFloat(numericValue) : null;
    } else {
      databaseFields.emcontact = null;
    }

    // For existing residents, update
    if (residentData.id) {
      console.log("Updating existing resident:", residentData.id);
      databaseFields.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('residents')
        .update(databaseFields)
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
      const newId = crypto.randomUUID();
      
      // Create a complete database record with required fields
      // Fix: Ensure all required fields from the database schema are provided
      const completeRecord = {
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        first_name: databaseFields.first_name || "Unknown",
        last_name: databaseFields.last_name || "Unknown",
        birthdate: databaseFields.birthdate || new Date().toISOString().split('T')[0],
        gender: databaseFields.gender || "Not Specified",
        civil_status: databaseFields.civil_status || "Single",
        barangaydb: databaseFields.barangaydb || "Unknown",
        municipalitycity: databaseFields.municipalitycity || "Unknown",
        provinze: databaseFields.provinze || "Unknown",
        regional: databaseFields.regional || "Unknown",
        countryph: databaseFields.countryph || "Philippines",
        purok: databaseFields.purok || "Unknown",
        address: databaseFields.address || "No address provided", // Ensure address is never null
        status: databaseFields.status || "Temporary",
        nationality: databaseFields.nationality || "Filipino",  // Add missing required field
        brgyid: brgyid, // Add the barangay ID of the currently logged in user
        photo_url: databaseFields.photo_url || null, // Add photo URL
        // Include all other fields from databaseFields
        middle_name: databaseFields.middle_name,
        suffix: databaseFields.suffix,
        mobile_number: databaseFields.mobile_number,
        email: databaseFields.email,
        occupation: databaseFields.occupation,
        monthly_income: databaseFields.monthly_income,
        years_in_barangay: databaseFields.years_in_barangay,
        is_voter: databaseFields.is_voter || false,
        has_philhealth: databaseFields.has_philhealth || false,
        has_sss: databaseFields.has_sss || false,
        has_pagibig: databaseFields.has_pagibig || false,
        has_tin: databaseFields.has_tin || false,
        classifications: databaseFields.classifications || [],
        remarks: databaseFields.remarks,
        emname: databaseFields.emname,
        emrelation: databaseFields.emrelation,
        emcontact: databaseFields.emcontact,
        died_on: databaseFields.died_on,
      };
      
      console.log("Creating resident with data:", completeRecord);
      
      const { data, error } = await supabase
        .from('residents')
        .insert(completeRecord)
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
