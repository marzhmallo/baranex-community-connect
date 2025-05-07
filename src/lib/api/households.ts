
import { supabase } from '@/integrations/supabase/client';
import { Household } from '@/lib/types';

// Get all households
export const getHouseholds = async () => {
  try {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching households:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Alias for getHouseholds for consistency with existing code
export const fetchHouseholds = getHouseholds;

// Get a single household by ID
export const getHouseholdById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error(`Error fetching household with ID ${id}:`, error);
    return { success: false, error: error.message, data: null };
  }
};

// Save household (create or update)
export const saveHousehold = async (household: Partial<Household>) => {
  try {
    // Ensure required fields are present
    if (!household.name || !household.address || !household.purok || !household.status) {
      throw new Error('Missing required fields for household');
    }

    let result;
    
    if (household.id) {
      // Update existing household
      const { data, error } = await supabase
        .from('households')
        .update({
          name: household.name,
          address: household.address,
          purok: household.purok,
          head_of_family: household.head_of_family,
          contact_number: household.contact_number,
          year_established: household.year_established,
          status: household.status,
          monthly_income: household.monthly_income,
          property_type: household.property_type,
          house_type: household.house_type,
          water_source: household.water_source,
          electricity_source: household.electricity_source,
          toilet_type: household.toilet_type,
          garbage_disposal: household.garbage_disposal,
          remarks: household.remarks,
        })
        .eq('id', household.id)
        .select();
      
      if (error) throw new Error(error.message);
      result = data;
    } else {
      // Create new household - use .insert() without id field rather than upsert
      const { data, error } = await supabase
        .from('households')
        .insert({
          name: household.name,
          address: household.address,
          purok: household.purok,
          status: household.status,
          head_of_family: household.head_of_family || null,
          contact_number: household.contact_number || null,
          year_established: household.year_established || null,
          monthly_income: household.monthly_income || null,
          property_type: household.property_type || null,
          house_type: household.house_type || null,
          water_source: household.water_source || null,
          electricity_source: household.electricity_source || null,
          toilet_type: household.toilet_type || null,
          garbage_disposal: household.garbage_disposal || null,
          remarks: household.remarks || null,
        })
        .select();
      
      if (error) throw new Error(error.message);
      result = data;
    }
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error saving household:', error);
    return { success: false, error: error.message };
  }
};

// Delete a household
export const deleteHousehold = async (id: string) => {
  try {
    const { error } = await supabase
      .from('households')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting household with ID ${id}:`, error);
    return { success: false, error: error.message };
  }
};
