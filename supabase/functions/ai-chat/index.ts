
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

// Extract potential names from query
function extractNamesFromQuery(userQuery: string): string[] {
  const names: string[] = [];
  const commonWords = ['tell', 'me', 'about', 'who', 'is', 'find', 'search', 'for', 'show', 'information', 'details', 'resident', 'person', 'named', 'called', 'household', 'family', 'we', 'have', 'our', 'barangay', 'sure', 'any', 'from', 'here', 'ring', 'bells'];
  
  // Split into words and filter out common words
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

  // Add filtered words that might be names (length > 2 to avoid short words)
  for (const word of words) {
    if (word.length > 2 && !names.map(n => n.toLowerCase()).includes(word)) {
      names.push(word);
    }
  }

  console.log('Extracted potential names:', names);
  return names;
}

// SUPABASE-FIRST: Check if residents exist - ONLY CONFIRM EXISTENCE
async function checkResidentExistsInSupabase(supabase: any, query: string, brgyid: string): Promise<{ found: boolean, count: number }> {
  try {
    const nameTerms = extractNamesFromQuery(query);
    if (nameTerms.length === 0) return { found: false, count: 0 };

    console.log('Checking Supabase for residents with terms:', nameTerms);

    // Build search conditions for name matching
    const searchConditions = [];
    for (const term of nameTerms) {
      searchConditions.push(`first_name.ilike.%${term}%`);
      searchConditions.push(`last_name.ilike.%${term}%`);
      searchConditions.push(`middle_name.ilike.%${term}%`);
    }

    const { data: residents, error } = await supabase
      .from('residents')
      .select('id')  // Only select ID - we don't need personal data
      .or(searchConditions.join(','))
      .eq('brgyid', brgyid)
      .limit(10);

    if (error) {
      console.error('Error querying residents:', error);
      return { found: false, count: 0 };
    }

    const count = residents ? residents.length : 0;
    console.log(`Found ${count} resident(s) matching the query`);
    
    return { found: count > 0, count };
  } catch (error) {
    console.error('Error checking residents in Supabase:', error);
    return { found: false, count: 0 };
  }
}

// SUPABASE-FIRST: Check if households exist - ONLY CONFIRM EXISTENCE
async function checkHouseholdExistsInSupabase(supabase: any, query: string, brgyid: string): Promise<{ found: boolean, count: number }> {
  try {
    const { data: households, error } = await supabase
      .from('households')
      .select('id, name')  // Only select minimal data needed for name matching
      .eq('brgyid', brgyid)
      .limit(20);

    if (error || !households) {
      console.error('Error querying households:', error);
      return { found: false, count: 0 };
    }

    // Simple keyword matching for household names
    const lowerQuery = query.toLowerCase();
    const matchingHouseholds = households.filter(h => 
      h.name && (
        h.name.toLowerCase().includes(lowerQuery) || 
        lowerQuery.includes(h.name.toLowerCase())
      )
    );

    const count = matchingHouseholds.length;
    console.log(`Found ${count} household(s) matching the query`);
    
    return { found: count > 0, count };
  } catch (error) {
    console.error('Error checking households in Supabase:', error);
    return { found: false, count: 0 };
  }
}

// Get general statistics from Supabase (safe to share)
async function getGeneralStatsFromSupabase(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const normalizedQuery = query.toLowerCase();
    
    // Population/statistics queries
    if (normalizedQuery.includes('population') || 
        normalizedQuery.includes('demographics') || 
        normalizedQuery.includes('how many') ||
        normalizedQuery.includes('statistics') ||
        normalizedQuery.includes('total') ||
        normalizedQuery.includes('count')) {
      
      const { data: residents, error } = await supabase
        .from('residents')
        .select('gender, civil_status, purok, status')
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
    console.error('Error getting general stats from Supabase:', error);
    return null;
  }
}

// SUPABASE-FIRST: Query and verify data before any AI response
async function querySupabaseFirst(userQuery: string, supabase: any, brgyid: string): Promise<string | null> {
  const normalizedQuery = userQuery.toLowerCase();
  
  console.log('SUPABASE-FIRST: Querying database for verified data');
  
  try {
    // 1. FIRST: Check for residents in Supabase
    if (normalizedQuery.includes('resident') || 
        normalizedQuery.includes('person') ||
        normalizedQuery.includes('who is') ||
        normalizedQuery.includes('tell me about') ||
        normalizedQuery.includes('find') ||
        /\b[A-Z][a-z]+\s*[A-Z][a-z]*\b/.test(userQuery)) {
      
      const { found, count } = await checkResidentExistsInSupabase(supabase, userQuery, brgyid);
      
      if (found) {
        if (count === 1) {
          return `✅ **Found 1 resident** matching that name in our barangay records.\n\n*For privacy protection under the Data Privacy Act of 2012, I can only confirm their existence in our database.*`;
        } else {
          return `✅ **Found ${count} residents** with similar names in our barangay records.\n\n*For privacy protection under the Data Privacy Act of 2012, I can only confirm their existence in our database.*`;
        }
      }
    }
    
    // 2. SECOND: Check for households in Supabase
    if (normalizedQuery.includes('household') || 
        normalizedQuery.includes('family') || 
        normalizedQuery.includes('home')) {
      
      const { found, count } = await checkHouseholdExistsInSupabase(supabase, userQuery, brgyid);
      
      if (found) {
        if (count === 1) {
          return `🏠 **Found 1 household** matching that name in our barangay records.\n\n*For privacy protection, I can only confirm its existence in our database.*`;
        } else {
          return `🏠 **Found ${count} households** with similar names in our barangay records.\n\n*For privacy protection, I can only confirm their existence in our database.*`;
        }
      }
    }
    
    // 3. THIRD: Check for statistics (safe to share)
    const statsResult = await getGeneralStatsFromSupabase(supabase, userQuery, brgyid);
    if (statsResult) return statsResult;
    
    // 4. NO MATCH FOUND: Return null so we can give a fallback
    console.log('No verified data found in Supabase for this query');
    return null;
    
  } catch (error) {
    console.error('Error in Supabase-first query:', error);
    return null;
  }
}

// Call Gemini AI ONLY for general guidance (never for data lookup)
async function callGeminiForGuidance(messages: any[], conversationHistory: any[], userRole: string) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const systemInstructions = `You are Alexander Cabalan, also known as "Alan" (Automated Live Artificial Neurointelligence), a helpful assistant for the Baranex barangay management system.

CRITICAL RULES:
1. NEVER provide specific information about residents, households, or personal data
2. NEVER make up or fabricate any resident information  
3. You are a GUIDANCE assistant, not a data lookup service
4. The database verification happens BEFORE you respond
5. Only provide general help about barangay services, procedures, and system navigation

Your personality: Professional, helpful, but always privacy-conscious.

CAPABILITIES:
- Guide users on barangay services and procedures
- Explain system features and navigation
- Provide general information about barangay governance
- Help with document requirements and processes

STRICT LIMITATIONS:
- You CANNOT and WILL NOT provide resident information
- You CANNOT and WILL NOT confirm if specific people exist
- You CANNOT access the resident database
- All data verification is handled separately

If users ask about specific residents or personal data, politely redirect them to proper channels or suggest they use the system's search features directly.

Your goal: Be helpful with general guidance while strictly protecting privacy.`;

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
        maxOutputTokens: 800,
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

    console.log('User has access, brgyid:', brgyid);
    
    // STEP 1: ALWAYS query Supabase FIRST for data verification
    console.log('STEP 1: Querying Supabase for verified data...');
    const supabaseResult = await querySupabaseFirst(userMessage.content, supabase, brgyid);
    
    if (supabaseResult) {
      // We found verified data in Supabase - return it directly
      console.log('VERIFIED DATA FOUND: Returning Supabase result');
      return new Response(JSON.stringify({ 
        message: supabaseResult,
        source: 'verified_data',
        category: 'Supabase Verified Data' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // STEP 2: No verified data found - handle based on mode
    if (!isOnlineMode) {
      // OFFLINE MODE: Funny fallback when no data found
      console.log('OFFLINE MODE: No data found, returning funny fallback');
      const fallbackMessages = [
        "Hmm, I probably could help with that... but something's not right I decided 😅",
        "Oops! That name doesn't ring a bell in our records. Maybe try double-checking the spelling? 🤔",
        "I've looked through our records, but that name isn't showing up. Could there be a typo? 🕵️",
        "That name seems to be playing hide and seek with our database! 😄",
        "I searched high and low, but couldn't find that name in our barangay records. 🔍"
      ];
      
      const randomFallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      
      return new Response(JSON.stringify({ 
        message: randomFallback,
        source: 'offline_fallback',
        category: 'No Data Found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // STEP 3: ONLINE MODE: Use AI for general guidance only (never for data lookup)
    console.log('ONLINE MODE: No data found, using AI for general guidance');
    
    const geminiResponse = await callGeminiForGuidance(messages, conversationHistory, userProfile.role);

    return new Response(JSON.stringify({ 
      message: geminiResponse,
      source: 'ai_guidance',
      category: 'General Guidance' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    const fallbackMessage = "Hmm, I probably could help with that... but something's not right I decided 😅";
    
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
