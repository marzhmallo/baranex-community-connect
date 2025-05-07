
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

    // Get the brgyid of the currently logged in user
    const brgyid = await getCurrentUserBarangayId();
    console.log("Current user's brgyid:", brgyid);
    
    if (!brgyid) {
      console.error("Failed to get current user's barangay ID");
      return { success: false, error: "User's barangay ID not found" };
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
      // Create new household with UUID generated on the client side
      const newHouseholdId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('households')
        .insert({
          id: newHouseholdId,
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
          brgyid: brgyid
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
