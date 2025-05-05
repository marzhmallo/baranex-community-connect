
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

// Function to fetch all residents
export const getResidents = async (): Promise<Resident[]> => {
  const { data, error } = await supabase
    .from('residents')
    .select('*')
    .order('last_name', { ascending: true });

  if (error) throw error;

  // Map database fields to our application model
  return data.map(resident => {
    // Parse emergency contact if available
    let emergencyContact = {
      name: 'Emergency contact not set',
      relationship: 'Not specified',
      contactNumber: 'Not specified'
    };
    
    if (resident.emergency_contact) {
      try {
        const parsedContact = JSON.parse(resident.emergency_contact);
        emergencyContact = {
          name: parsedContact.name || emergencyContact.name,
          relationship: parsedContact.relationship || emergencyContact.relationship,
          contactNumber: parsedContact.contactNumber || emergencyContact.contactNumber
        };
      } catch (e) {
        console.error('Failed to parse emergency contact:', e);
      }
    }

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
      classifications: resident.classifications, // Use classifications from database or default
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

  // Parse emergency contact if available
  let emergencyContact = {
    name: 'Emergency contact not set',
    relationship: 'Not specified',
    contactNumber: 'Not specified'
  };
  
  if (data.emergency_contact) {
    try {
      const parsedContact = JSON.parse(data.emergency_contact);
      emergencyContact = {
        name: parsedContact.name || emergencyContact.name,
        relationship: parsedContact.relationship || emergencyContact.relationship,
        contactNumber: parsedContact.contactNumber || emergencyContact.contactNumber
      };
    } catch (e) {
      console.error('Failed to parse emergency contact:', e);
    }
  }

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
    classifications: data.classifications, // Use classifications from database or default
    remarks: data.remarks || '',
    emergencyContact
  };
};

// Add more functions for CRUD operations as needed
