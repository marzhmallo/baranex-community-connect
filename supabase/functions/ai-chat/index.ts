
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Check user access and get their brgyid
async function getUserAccess(supabase: any): Promise<{ hasAccess: boolean, userProfile: any, brgyid: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found');
      return { hasAccess: false, userProfile: null, brgyid: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, firstname, lastname, brgyid')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('No profile found for user');
      return { hasAccess: false, userProfile: null, brgyid: null };
    }

    const hasAccess = ['admin', 'staff', 'user'].includes(profile.role);
    console.log(`User role: ${profile.role}, hasAccess: ${hasAccess}, brgyid: ${profile.brgyid}`);
    
    return { hasAccess, userProfile: profile, brgyid: profile.brgyid };
  } catch (error) {
    console.error('Error checking user access:', error);
    return { hasAccess: false, userProfile: null, brgyid: null };
  }
}

// Get all accessible tables for the user's barangay
async function getAccessibleTables(supabase: any): Promise<string[]> {
  // Core tables that should be accessible
  const coreTables = [
    'residents', 'households', 'officials', 'announcements', 'events',
    'incident_reports', 'emergency_contacts', 'evacuation_centers',
    'document_types', 'issued_documents', 'forums', 'threads', 'comments'
  ];
  
  return coreTables;
}

// Search for residents with strict data-only approach
async function searchResidents(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const nameTerms = extractNamesFromQuery(query);
    if (nameTerms.length === 0) return null;

    console.log('Searching for residents with terms:', nameTerms);

    // Build search conditions for name matching
    const searchConditions = [];
    for (const term of nameTerms) {
      searchConditions.push(`first_name.ilike.%${term}%`);
      searchConditions.push(`last_name.ilike.%${term}%`);
      searchConditions.push(`middle_name.ilike.%${term}%`);
    }

    const { data: residents, error } = await supabase
      .from('residents')
      .select(`
        id, first_name, last_name, middle_name, suffix, gender, birthdate,
        address, mobile_number, email, occupation, status, civil_status,
        purok, barangaydb, municipalitycity, provinze, household_id
      `)
      .or(searchConditions.join(','))
      .eq('brgyid', brgyid)
      .limit(5);

    if (error || !residents || residents.length === 0) {
      console.log('No residents found');
      return null;
    }

    // Format response with strict template
    let response = '👥 **Resident Information:**\n\n';
    residents.forEach((resident: any) => {
      const fullName = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
        .filter(Boolean).join(' ');
      
      response += `**${fullName}**\n`;
      response += `🆔 ID: ${resident.id}\n`;
      response += `👤 Gender: ${resident.gender}\n`;
      response += `📅 Birthdate: ${resident.birthdate}\n`;
      response += `📍 Address: ${resident.address || 'Not specified'}\n`;
      response += `🏠 Purok: ${resident.purok}\n`;
      response += `🏛️ Barangay: ${resident.barangaydb}\n`;
      response += `🏙️ Municipality: ${resident.municipalitycity}\n`;
      response += `💼 Occupation: ${resident.occupation || 'Not specified'}\n`;
      response += `👑 Status: ${resident.status}\n`;
      response += `💒 Civil Status: ${resident.civil_status}\n`;
      if (resident.mobile_number) {
        response += `📞 Contact: ${resident.mobile_number}\n`;
      }
      response += '\n';
    });

    return response;
  } catch (error) {
    console.error('Error searching residents:', error);
    return null;
  }
}

// Search households with strict templates
async function searchHouseholds(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const { data: households, error } = await supabase
      .from('households')
      .select('*')
      .eq('brgyid', brgyid)
      .limit(10);

    if (error || !households || households.length === 0) {
      return null;
    }

    let response = '🏠 **Household Information:**\n\n';
    households.forEach((household: any) => {
      response += `**${household.name}**\n`;
      response += `📍 Address: ${household.address}\n`;
      response += `🏠 Purok: ${household.purok}\n`;
      if (household.headname) {
        response += `👤 Head of Family: ${household.headname}\n`;
      }
      if (household.contact_number) {
        response += `📞 Contact: ${household.contact_number}\n`;
      }
      response += `📊 Status: ${household.status}\n`;
      response += '\n';
    });

    return response;
  } catch (error) {
    console.error('Error searching households:', error);
    return null;
  }
}

// Search officials with strict templates
async function searchOfficials(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const { data: officials, error } = await supabase
      .from('officials')
      .select('name, position, email, phone, bio')
      .eq('brgyid', brgyid)
      .limit(10);

    if (error || !officials || officials.length === 0) {
      return null;
    }

    let response = '👥 **Barangay Officials:**\n\n';
    officials.forEach((official: any) => {
      response += `**${official.name}**\n`;
      response += `🏛️ Position: ${official.position}\n`;
      if (official.email) response += `📧 Email: ${official.email}\n`;
      if (official.phone) response += `📞 Phone: ${official.phone}\n`;
      if (official.bio) response += `📝 Bio: ${official.bio}\n`;
      response += '\n';
    });

    return response;
  } catch (error) {
    console.error('Error searching officials:', error);
    return null;
  }
}

// Search announcements with strict templates
async function searchAnnouncements(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('title, content, category, created_at, audience')
      .eq('brgyid', brgyid)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !announcements || announcements.length === 0) {
      return null;
    }

    let response = '📢 **Latest Announcements:**\n\n';
    announcements.forEach((item: any) => {
      response += `**${item.title}**\n`;
      response += `📂 Category: ${item.category}\n`;
      response += `👥 Audience: ${item.audience}\n`;
      response += `📅 Posted: ${new Date(item.created_at).toLocaleDateString()}\n`;
      response += `📝 ${item.content}\n\n`;
    });

    return response;
  } catch (error) {
    console.error('Error searching announcements:', error);
    return null;
  }
}

// Helper function to extract names from query
function extractNamesFromQuery(userQuery: string): string[] {
  const names: string[] = [];
  const commonWords = ['tell', 'me', 'about', 'who', 'is', 'find', 'search', 'for', 'show', 'information', 'details', 'resident', 'person', 'named', 'called', 'household', 'family'];
  
  // Split into words and filter
  const words = userQuery.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !commonWords.includes(word) && isNaN(Number(word)));

  // Look for capitalized words in original query (likely names)
  const originalWords = userQuery.split(/\s+/);
  for (const word of originalWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 1 && /^[A-Z]/.test(cleanWord) && !commonWords.includes(cleanWord.toLowerCase())) {
      names.push(cleanWord);
    }
  }

  // Add filtered words that might be names
  for (const word of words) {
    if (word.length > 2 && !names.map(n => n.toLowerCase()).includes(word)) {
      names.push(word);
    }
  }

  return names;
}

// Strict data-only query for offline mode
async function querySupabaseDataOnly(userQuery: string, supabase: any, brgyid: string): Promise<string | null> {
  const normalizedQuery = userQuery.toLowerCase();
  
  console.log('Querying Supabase with strict data-only approach for brgyid:', brgyid);
  
  try {
    // Residents search
    if (normalizedQuery.includes('resident') || 
        normalizedQuery.includes('person') ||
        normalizedQuery.includes('who is') ||
        normalizedQuery.includes('tell me about') ||
        normalizedQuery.includes('find') ||
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(userQuery)) {
      
      const result = await searchResidents(supabase, userQuery, brgyid);
      if (result) return result;
    }
    
    // Household search
    if (normalizedQuery.includes('household') || normalizedQuery.includes('family') || normalizedQuery.includes('home')) {
      const result = await searchHouseholds(supabase, userQuery, brgyid);
      if (result) return result;
    }
    
    // Officials search
    if (normalizedQuery.includes('official') || normalizedQuery.includes('captain') || normalizedQuery.includes('councilor') || normalizedQuery.includes('kagawad')) {
      const result = await searchOfficials(supabase, userQuery, brgyid);
      if (result) return result;
    }
    
    // Announcements search
    if (normalizedQuery.includes('announcement') || normalizedQuery.includes('news') || normalizedQuery.includes('update')) {
      const result = await searchAnnouncements(supabase, userQuery, brgyid);
      if (result) return result;
    }
    
    // Population/statistics queries
    if (normalizedQuery.includes('population') || 
        normalizedQuery.includes('demographics') || 
        normalizedQuery.includes('how many') ||
        normalizedQuery.includes('statistics')) {
      
      const { data: residents, error } = await supabase
        .from('residents')
        .select('id, gender, civil_status, purok, status')
        .eq('brgyid', brgyid);
      
      if (!error && residents) {
        let response = `📊 **Population Overview:**\n\n`;
        response += `👥 Total Residents: ${residents.length}\n`;
        
        const genderStats = residents.reduce((acc: any, r: any) => {
          acc[r.gender] = (acc[r.gender] || 0) + 1;
          return acc;
        }, {});
        
        response += `\n**Gender Distribution:**\n`;
        Object.entries(genderStats).forEach(([gender, count]) => {
          response += `   • ${gender}: ${count}\n`;
        });
        
        return response;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error querying Supabase data:', error);
    return null;
  }
}

// Call Gemini API for online mode with data context
async function callGeminiAPI(messages: any[], conversationHistory: any[], userRole: string, supabaseData?: string) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const systemInstructions = `You are Alexander Cabalan, also known as "Alan" (Automated Live Artificial Neurointelligence), a knowledgeable assistant for the Baranex barangay management system.

Your personality is professional yet approachable, deeply knowledgeable about barangay governance and community services.

CURRENT CONTEXT:
- User role: ${userRole}
${supabaseData ? `\nRELEVANT DATA FROM DATABASE:\n${supabaseData}` : ''}

CAPABILITIES:
- You have access to real-time data from the barangay management system
- You can provide guidance on system navigation and features
- You understand barangay governance, community services, and administrative processes
- You can help with document requirements, procedures, and general inquiries

IMPORTANT RULES:
- Base your responses STRICTLY on actual database records when discussing specific data
- If asked about residents/data not found in the database, acknowledge this clearly
- Provide specific, actionable guidance for system navigation
- Never make up data - only use information from the actual database
- Be helpful and informative while maintaining data integrity

Your goal is to make barangay services more accessible and help users navigate the system effectively.`;

  const allMessages = [
    { role: 'model', parts: [{ text: systemInstructions }] },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    ...messages.slice(-1).map(msg => ({
      role: 'user',
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: allMessages.filter(msg => msg.role !== 'model' || msg.parts[0].text !== systemInstructions),
      systemInstruction: {
        parts: [{ text: systemInstructions }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    
    if (!requestBody) {
      throw new Error('Empty request body');
    }

    const { messages, conversationHistory = [], authToken, isOnlineMode = false } = JSON.parse(requestBody);
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    console.log('Mode:', isOnlineMode ? 'Online' : 'Offline');
    console.log('Auth token provided:', !!authToken);
    
    // Create Supabase client with auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    });
    
    // Check user access - required for both modes
    const { hasAccess, userProfile, brgyid } = await getUserAccess(supabase);
    
    if (!hasAccess || !brgyid) {
      return new Response(JSON.stringify({ 
        message: "I need you to be logged in with proper permissions to help you with that.",
        source: 'auth_required',
        category: 'Authentication' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRole = userProfile.role;
    console.log('User has access, brgyid:', brgyid);
    
    // OFFLINE MODE - Strict data-only approach
    if (!isOnlineMode) {
      console.log('Processing in OFFLINE mode - strict data only');
      
      const supabaseResponse = await querySupabaseDataOnly(userMessage.content, supabase, brgyid);
      
      if (supabaseResponse) {
        console.log('Found data in offline mode');
        return new Response(JSON.stringify({ 
          message: supabaseResponse,
          source: 'offline_data',
          category: 'Local Data' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Offline fallback when no data found
      console.log('No data found in offline mode');
      return new Response(JSON.stringify({ 
        message: "Hmm... that name doesn't ring a bell in our records. Try rechecking the spelling or asking something else I can dig into.",
        source: 'offline_fallback',
        category: 'No Data Found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ONLINE MODE - AI + Data approach
    console.log('Processing in ONLINE mode - AI + data');
    
    // Try to get data first
    const supabaseData = await querySupabaseDataOnly(userMessage.content, supabase, brgyid);
    
    // Use Gemini AI with or without data context
    console.log('Using Gemini AI for online mode');
    const geminiResponse = await callGeminiAPI(messages, conversationHistory, userRole, supabaseData);

    return new Response(JSON.stringify({ 
      message: geminiResponse,
      source: supabaseData ? 'online_with_data' : 'online_ai_only',
      category: 'AI Response' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    const fallbackMessage = "I might need a moment to figure that out… it's a bit out of the ordinary. Try rewording it?";
    
    return new Response(JSON.stringify({ 
      message: fallbackMessage,
      source: 'error_fallback',
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
