
import { supabase } from "@/integrations/supabase/client";
import { Resident } from "@/lib/types";

/**
 * Fetch all residents from Supabase database
 */
export async function fetchResidents() {
  try {
    const { data, error } = await supabase
      .from('residents')
      .select('*');

    if (error) {
      console.error('Error fetching residents:', error);
      throw error;
    }

    // Map Supabase resident data to our Resident type
    const residents: Resident[] = data.map(item => ({
      id: item.id,
      firstName: item.first_name,
      lastName: item.last_name,
      middleName: item.middle_name || '',
      suffix: item.suffix || '',
      gender: item.gender,
      birthDate: item.birthdate,
      address: item.address || '',
      contactNumber: item.mobile_number || '',
      email: item.email || '',
      occupation: item.occupation || '',
      educationLevel: '', // Field doesn't exist in DB schema
      familySize: 0, // Field doesn't exist in DB schema
      dateRegistered: item.created_at || '',
      status: item.status,
      civilStatus: item.civil_status || '',
      yearsInBarangay: item.years_in_barangay || 0,
      classifications: item.classifications || [],
      nationality: item.nationality || 'Filipino',
      monthlyIncome: item.monthly_income || 0,
      purok: item.purok || '',
      barangay: item.barangaydb || '',
      municipality: item.municipalitycity || '',
      province: item.provinze || '',
      region: item.regional || '',
      country: item.countryph || 'Philippines',
      isVoter: item.is_voter || false,
      hasPhilhealth: item.has_philhealth || false,
      hasSss: item.has_sss || false,
      hasPagibig: item.has_pagibig || false,
      hasTin: item.has_tin || false,
      remarks: item.remarks || '',
      photoUrl: item.photo_url || '',
      diedOn: item.died_on || null,
      householdId: item.household_id || null,
      updatedAt: item.updated_at || '',
      brgyId: item.brgyid || '',
      emergencyContact: {
        name: '', // Field doesn't exist in DB schema
        relationship: '', // Field doesn't exist in DB schema
        contactNumber: '' // Field doesn't exist in DB schema
      }
    }));

    return residents;
  } catch (error) {
    console.error('Failed to fetch residents:', error);
    throw error;
  }
}

/**
 * Map database status values to our application status values
 */
function mapStatusValue(status: string | null): 'Permanent' | 'Temporary' | 'Deceased' | 'Relocated' {
  if (!status) return 'Temporary';
  
  // Map from database status to our application status
  // Adjust this mapping based on what's in your database
  switch (status.toLowerCase()) {
    case 'active':
      return 'Permanent';
    case 'inactive':
      return 'Temporary';
    case 'deceased':
      return 'Deceased';
    case 'transferred':
      return 'Relocated';
    default:
      return 'Temporary';
  }
}

export async function fetchResidentById(id: string) {
  try {
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching resident:', error);
      throw error;
    }

    // Map data to Resident type
    const resident: Resident = {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      middleName: data.middle_name || '',
      suffix: data.suffix || '',
      gender: data.gender,
      birthDate: data.birthdate,
      address: data.address || '',
      contactNumber: data.mobile_number || '',
      email: data.email || '',
      occupation: data.occupation || '',
      educationLevel: '', // Field doesn't exist in DB schema
      familySize: 0, // Field doesn't exist in DB schema
      dateRegistered: data.created_at || '',
      status: data.status,
      civilStatus: data.civil_status || '',
      yearsInBarangay: data.years_in_barangay || 0,
      classifications: data.classifications || [],
      nationality: data.nationality || 'Filipino',
      monthlyIncome: data.monthly_income || 0,
      purok: data.purok || '',
      barangay: data.barangaydb || '',
      municipality: data.municipalitycity || '',
      province: data.provinze || '',
      region: data.regional || '',
      country: data.countryph || 'Philippines',
      isVoter: data.is_voter || false,
      hasPhilhealth: data.has_philhealth || false,
      hasSss: data.has_sss || false,
      hasPagibig: data.has_pagibig || false,
      hasTin: data.has_tin || false,
      remarks: data.remarks || '',
      photoUrl: data.photo_url || '',
      diedOn: data.died_on || null,
      householdId: data.household_id || null,
      updatedAt: data.updated_at || '',
      brgyId: data.brgyid || '',
      emergencyContact: {
        name: '', // Field doesn't exist in DB schema
        relationship: '', // Field doesn't exist in DB schema
        contactNumber: '' // Field doesn't exist in DB schema
      }
    };

    return resident;
  } catch (error) {
    console.error('Failed to fetch resident:', error);
    throw error;
  }
}
