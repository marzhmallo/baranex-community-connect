
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

// Privacy-safe search for residents - only confirms existence
async function checkResidentExists(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const nameTerms = extractNamesFromQuery(query);
    if (nameTerms.length === 0) return null;

    console.log('Checking residents with terms:', nameTerms);

    // Build search conditions for name matching
    const searchConditions = [];
    for (const term of nameTerms) {
      searchConditions.push(`first_name.ilike.%${term}%`);
      searchConditions.push(`last_name.ilike.%${term}%`);
      searchConditions.push(`middle_name.ilike.%${term}%`);
    }

    const { data: residents, error } = await supabase
      .from('residents')
      .select('id, first_name, last_name')
      .or(searchConditions.join(','))
      .eq('brgyid', brgyid)
      .limit(5);

    if (error || !residents || residents.length === 0) {
      console.log('No residents found');
      return null;
    }

    // Privacy-safe response - only confirm existence
    const count = residents.length;
    if (count === 1) {
      return `✅ I found **1 resident** matching that name in our records. For privacy protection, I can only confirm their existence in our database.`;
    } else {
      return `✅ I found **${count} residents** with similar names in our records. For privacy protection, I can only confirm their existence in our database.`;
    }
  } catch (error) {
    console.error('Error checking residents:', error);
    return null;
  }
}

// Privacy-safe search for households - only confirms existence
async function checkHouseholdExists(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const { data: households, error } = await supabase
      .from('households')
      .select('id, name')
      .eq('brgyid', brgyid)
      .limit(10);

    if (error || !households || households.length === 0) {
      return null;
    }

    // Simple keyword matching for household names
    const lowerQuery = query.toLowerCase();
    const matchingHouseholds = households.filter(h => 
      h.name.toLowerCase().includes(lowerQuery) || 
      lowerQuery.includes(h.name.toLowerCase())
    );

    if (matchingHouseholds.length === 0) return null;

    const count = matchingHouseholds.length;
    if (count === 1) {
      return `🏠 I found **1 household** matching that name in our records. For privacy protection, I can only confirm its existence in our database.`;
    } else {
      return `🏠 I found **${count} households** with similar names in our records. For privacy protection, I can only confirm their existence in our database.`;
    }
  } catch (error) {
    console.error('Error checking households:', error);
    return null;
  }
}

// General statistics that don't reveal personal info
async function getGeneralStats(supabase: any, query: string, brgyid: string): Promise<string | null> {
  try {
    const normalizedQuery = query.toLowerCase();
    
    // Population/statistics queries
    if (normalizedQuery.includes('population') || 
        normalizedQuery.includes('demographics') || 
        normalizedQuery.includes('how many') ||
        normalizedQuery.includes('statistics') ||
        normalizedQuery.includes('total')) {
      
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
    console.error('Error getting general stats:', error);
    return null;
  }
}

// Privacy-safe data query for offline mode
async function querySupabasePrivacySafe(userQuery: string, supabase: any, brgyid: string): Promise<string | null> {
  const normalizedQuery = userQuery.toLowerCase();
  
  console.log('Querying Supabase with privacy-safe approach for brgyid:', brgyid);
  
  try {
    // Check for residents
    if (normalizedQuery.includes('resident') || 
        normalizedQuery.includes('person') ||
        normalizedQuery.includes('who is') ||
        normalizedQuery.includes('tell me about') ||
        normalizedQuery.includes('find') ||
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(userQuery)) {
      
      const result = await checkResidentExists(supabase, userQuery, brgyid);
      if (result) return result;
    }
    
    // Check for households
    if (normalizedQuery.includes('household') || normalizedQuery.includes('family') || normalizedQuery.includes('home')) {
      const result = await checkHouseholdExists(supabase, userQuery, brgyid);
      if (result) return result;
    }
    
    // General statistics (safe to share)
    const statsResult = await getGeneralStats(supabase, userQuery, brgyid);
    if (statsResult) return statsResult;
    
    return null;
  } catch (error) {
    console.error('Error querying Supabase data:', error);
    return null;
  }
}

// Call Gemini API for online mode with privacy guidelines
async function callGeminiAPI(messages: any[], conversationHistory: any[], userRole: string, hasData?: boolean) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const systemInstructions = `You are Alexander Cabalan, also known as "Alan" (Automated Live Artificial Neurointelligence), a knowledgeable assistant for the Baranex barangay management system.

Your personality is professional yet approachable, deeply knowledgeable about barangay governance and community services.

CRITICAL PRIVACY RULE: Due to the Philippines' Data Privacy Act of 2012, you MUST NEVER reveal personal information about residents, households, or any individuals. You can only:
- Confirm existence of records without revealing details
- Provide general statistics that don't identify individuals
- Give guidance on barangay services and procedures
- Answer general questions about the system

CURRENT CONTEXT:
- User role: ${userRole}
${hasData ? '\nRELEVANT DATA: Some records were found in the database, but privacy rules prevent sharing details.' : ''}

CAPABILITIES:
- You can confirm if records exist in the barangay management system
- You can provide guidance on system navigation and features
- You understand barangay governance, community services, and administrative processes
- You can help with document requirements, procedures, and general inquiries

IMPORTANT RULES:
- NEVER reveal names, addresses, contact information, or any personal details
- Only confirm existence: "I found X records matching that criteria"
- Provide helpful guidance about barangay services instead
- Always respect privacy and data protection laws

Your goal is to be helpful while strictly protecting resident privacy and personal data.`;

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
    
    // OFFLINE MODE - Privacy-safe data checking only
    if (!isOnlineMode) {
      console.log('Processing in OFFLINE mode - privacy-safe data checking');
      
      const supabaseResponse = await querySupabasePrivacySafe(userMessage.content, supabase, brgyid);
      
      if (supabaseResponse) {
        console.log('Found data in offline mode (privacy-safe)');
        return new Response(JSON.stringify({ 
          message: supabaseResponse,
          source: 'offline_data',
          category: 'Privacy-Safe Data Check' 
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
    
    // ONLINE MODE - AI with privacy guidelines
    console.log('Processing in ONLINE mode - AI with privacy protection');
    
    // Check if we have any relevant data (without revealing it)
    const hasData = await querySupabasePrivacySafe(userMessage.content, supabase, brgyid) !== null;
    
    // Use Gemini AI with privacy guidelines
    console.log('Using Gemini AI for online mode with privacy protection');
    const geminiResponse = await callGeminiAPI(messages, conversationHistory, userRole, hasData);

    return new Response(JSON.stringify({ 
      message: geminiResponse,
      source: hasData ? 'online_with_data' : 'online_ai_only',
      category: 'Privacy-Protected AI Response' 
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
