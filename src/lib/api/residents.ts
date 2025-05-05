
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
      gender: item.gender,
      birthDate: item.birthdate,
      address: item.address || '',
      contactNumber: item.mobile_number || '',
      email: item.email || '',
      occupation: item.occupation || '',
      educationLevel: '', // Field doesn't exist in DB schema
      familySize: 0, // Field doesn't exist in DB schema
      dateRegistered: item.created_at || '',
      status: mapStatusValue(item.status),
      classifications: item.classifications || [],
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
function mapStatusValue(status: string | null): 'Active' | 'Inactive' | 'Deceased' | 'Transferred' {
  if (!status) return 'Active';
  
  // Map from database status to our application status
  // Adjust this mapping based on what's in your database
  switch (status.toLowerCase()) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'deceased':
      return 'Deceased';
    case 'transferred':
      return 'Transferred';
    default:
      return 'Active';
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
      gender: data.gender,
      birthDate: data.birthdate,
      address: data.address || '',
      contactNumber: data.mobile_number || '',
      email: data.email || '',
      occupation: data.occupation || '',
      educationLevel: '', // Field doesn't exist in DB schema
      familySize: 0, // Field doesn't exist in DB schema
      dateRegistered: data.created_at || '',
      status: mapStatusValue(data.status),
      classifications: data.classifications || [],
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
