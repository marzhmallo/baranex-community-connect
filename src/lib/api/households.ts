
import { supabase } from "@/integrations/supabase/client";
import { Household } from "@/lib/types";

// Fetch households from Supabase
export const fetchHouseholds = async () => {
  try {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return {
      success: true,
      data: data as Household[]
    };
  } catch (error: any) {
    console.error('Error fetching households:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch households'
    };
  }
};

// Fetch a single household by ID
export const fetchHouseholdById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      data: data as Household
    };
  } catch (error: any) {
    console.error('Error fetching household:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch household'
    };
  }
};

// Save (create or update) a household
export const saveHousehold = async (household: Partial<Household>) => {
  try {
    let result;
    
    // Fix: Creating a properly typed object that meets Supabase requirements
    // The issue was that 'address' is required but was optional in our data
    const householdData = {
      name: household.name || '',
      // Ensure address is always provided (required by Supabase schema)
      address: household.address || '',
      purok: household.purok || '',
      head_of_family: household.head_of_family,
      contact_number: household.contact_number,
      year_established: household.year_established,
      status: household.status || 'Active',
      monthly_income: household.monthly_income,
      property_type: household.property_type,
      house_type: household.house_type,
      water_source: household.water_source,
      electricity_source: household.electricity_source,
      toilet_type: household.toilet_type,
      garbage_disposal: household.garbage_disposal,
      remarks: household.remarks,
      updated_at: new Date().toISOString(),
      // Only include brgyid if it exists
      ...(household.brgyid ? { brgyid: household.brgyid } : {})
    };
    
    if (household.id) {
      // Update existing household
      result = await supabase
        .from('households')
        .update(householdData)
        .eq('id', household.id)
        .select()
        .single();
    } else {
      // Create new household
      result = await supabase
        .from('households')
        .insert({
          ...householdData,
          created_at: new Date().toISOString(),
          // Generate a UUID for the new household
          id: crypto.randomUUID()
        })
        .select()
        .single();
    }
    
    const { data, error } = result;
    
    if (error) throw error;
    
    return {
      success: true,
      data: data as Household
    };
  } catch (error: any) {
    console.error('Error saving household:', error);
    return {
      success: false,
      error: error.message || 'Failed to save household'
    };
  }
};

// Delete a household by ID
export const deleteHousehold = async (id: string) => {
  try {
    const { error } = await supabase
      .from('households')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error deleting household:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete household'
    };
  }
};
