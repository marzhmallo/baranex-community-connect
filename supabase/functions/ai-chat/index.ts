
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

// Enhanced FAQ search for offline mode only
async function searchFAQ(userQuery: string, supabase: any) {
  const normalizedQuery = userQuery.toLowerCase().trim();
  
  if (normalizedQuery.length < 3) {
    return null;
  }
  
  try {
    const { data: faqs, error } = await supabase
      .from('chatbot_faq')
      .select('*');
    
    if (error) {
      console.error('FAQ search error:', error);
      return null;
    }
    
    let bestMatch = null;
    let maxScore = 0;
    const MIN_CONFIDENCE_THRESHOLD = 5;
    
    for (const faq of faqs) {
      const keywords = faq.question_keywords || [];
      let score = 0;
      let matchedKeywords = 0;
      
      // Check for keyword matches
      for (const keyword of keywords) {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedQuery.includes(normalizedKeyword)) {
          score += keyword.length * 2;
          matchedKeywords++;
        }
      }
      
      // Category relevance bonus
      const category = faq.category?.toLowerCase() || '';
      if (category && normalizedQuery.includes(category)) {
        score += 3;
      }
      
      if (score > maxScore && score >= MIN_CONFIDENCE_THRESHOLD && matchedKeywords > 0) {
        maxScore = score;
        bestMatch = faq;
      }
    }
    
    if (bestMatch) {
      console.log(`FAQ match found: ${bestMatch.category} (confidence: ${maxScore})`);
    }
    
    return bestMatch;
  } catch (error) {
    console.error('FAQ search failed:', error);
    return null;
  }
}

// Get all accessible tables dynamically
async function getAccessibleTables(supabase: any): Promise<string[]> {
  try {
    // Fallback to known tables since information_schema query fails
    return [
      'residents', 'households', 'officials', 'announcements', 'events',
      'incident_reports', 'emergency_contacts', 'evacuation_centers',
      'document_types', 'issued_documents', 'forums', 'threads', 'comments'
    ];
  } catch (error) {
    console.error('Failed to get accessible tables:', error);
    // Return core tables as fallback
    return ['residents', 'households', 'officials', 'announcements', 'events'];
  }
}

// Helper function to extract search terms from query
function extractSearchTerms(userQuery: string): string[] {
  const commonWords = ['tell', 'me', 'about', 'who', 'is', 'find', 'search', 'for', 'show', 'information', 'details', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'from', 'with', 'by'];
  
  // Split into words and filter out common words
  const words = userQuery.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word) && isNaN(Number(word)));
  
  // Also look for capitalized words in original query (likely names/proper nouns)
  const originalWords = userQuery.split(/\s+/);
  for (const word of originalWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 2 && /^[A-Z]/.test(cleanWord) && !commonWords.includes(cleanWord.toLowerCase())) {
      words.push(cleanWord.toLowerCase());
    }
  }
  
  // Remove duplicates
  return [...new Set(words)];
}

// Comprehensive search across all tables and columns
async function comprehensiveSearch(userQuery: string, supabase: any): Promise<string | null> {
  const searchTerms = extractSearchTerms(userQuery);
  const normalizedQuery = userQuery.toLowerCase();
  
  console.log('Search terms extracted:', searchTerms);
  
  if (searchTerms.length === 0) {
    return null;
  }
  
  let responseData = '';
  let foundResults = false;
  
  // Define search configurations for each table
  const tableSearchConfigs = {
    residents: {
      columns: ['first_name', 'last_name', 'middle_name', 'address', 'purok', 'occupation', 'email'],
      displayColumns: 'id, first_name, last_name, middle_name, suffix, gender, birthdate, address, purok, occupation, status, civil_status, mobile_number',
      resultHandler: (data: any[]) => {
        if (data.length > 0) {
          return `I found ${data.length} resident(s) matching your search in our records. For privacy reasons, I can only confirm their existence. Please visit the office or contact the appropriate personnel for specific details.`;
        }
        return null;
      }
    },
    households: {
      columns: ['name', 'address', 'purok', 'headname'],
      displayColumns: 'id, name, address, purok, headname, status, monthly_income',
      resultHandler: (data: any[]) => {
        if (data.length > 0) {
          let result = `🏠 **Households Found:**\n\n`;
          data.forEach((item: any) => {
            result += `**${item.name}**\n`;
            result += `📍 Address: ${item.address}\n`;
            result += `📍 Purok: ${item.purok}\n`;
            if (item.headname) result += `👤 Head: ${item.headname}\n`;
            result += `📊 Status: ${item.status}\n\n`;
          });
          return result;
        }
        return null;
      }
    },
    officials: {
      columns: ['name', 'position', 'email', 'phone', 'bio'],
      displayColumns: 'name, position, email, phone, bio, education, committees',
      resultHandler: (data: any[]) => {
        if (data.length > 0) {
          let result = `👥 **Barangay Officials:**\n\n`;
          data.forEach((item: any) => {
            result += `**${item.name}**\n`;
            result += `🏛️ Position: ${item.position}\n`;
            if (item.email) result += `📧 Email: ${item.email}\n`;
            if (item.phone) result += `📞 Phone: ${item.phone}\n`;
            if (item.bio) result += `📝 Bio: ${item.bio}\n`;
            result += '\n';
          });
          return result;
        }
        return null;
      }
    },
    announcements: {
      columns: ['title', 'content', 'category'],
      displayColumns: 'title, content, category, created_at, audience',
      resultHandler: (data: any[]) => {
        if (data.length > 0) {
          let result = `📢 **Announcements:**\n\n`;
          data.forEach((item: any) => {
            result += `**${item.title}**\n`;
            result += `📂 Category: ${item.category}\n`;
            result += `👥 Audience: ${item.audience}\n`;
            result += `📅 Posted: ${new Date(item.created_at).toLocaleDateString()}\n`;
            result += `📝 ${item.content}\n\n`;
          });
          return result;
        }
        return null;
      }
    },
    events: {
      columns: ['title', 'description', 'location', 'event_type'],
      displayColumns: 'title, description, start_time, end_time, location, event_type',
      resultHandler: (data: any[]) => {
        if (data.length > 0) {
          let result = `📅 **Events:**\n\n`;
          data.forEach((item: any) => {
            result += `**${item.title}**\n`;
            result += `📍 Location: ${item.location || 'TBA'}\n`;
            result += `🕐 Date: ${new Date(item.start_time).toLocaleDateString()}\n`;
            if (item.description) result += `📝 ${item.description}\n`;
            result += '\n';
          });
          return result;
        }
        return null;
      }
    }
  };
  
  // Search through each configured table
  for (const [tableName, config] of Object.entries(tableSearchConfigs)) {
    try {
      // Build search conditions for all searchable columns
      const searchConditions = [];
      for (const term of searchTerms) {
        for (const column of config.columns) {
          searchConditions.push(`${column}.ilike.%${term}%`);
        }
      }
      
      if (searchConditions.length === 0) continue;
      
      console.log(`Searching ${tableName} with conditions:`, searchConditions.slice(0, 10)); // Log first 10 to avoid too much output
      
      const { data, error } = await supabase
        .from(tableName)
        .select(config.displayColumns)
        .or(searchConditions.join(','))
        .limit(10);
      
      if (!error && data && data.length > 0) {
        console.log(`Found ${data.length} results in ${tableName}`);
        const result = config.resultHandler(data);
        if (result) {
          responseData += result;
          foundResults = true;
          // For residents, return immediately for privacy
          if (tableName === 'residents') {
            return responseData;
          }
        }
      }
    } catch (error) {
      console.error(`Error searching ${tableName}:`, error);
    }
  }
  
  // If we found results in other tables, return them
  if (foundResults) {
    return responseData;
  }
  
  // Population/statistics queries
  if (normalizedQuery.includes('population') || 
      normalizedQuery.includes('demographics') || 
      normalizedQuery.includes('how many') ||
      normalizedQuery.includes('statistics')) {
    
    try {
      const { data: residents, error } = await supabase
        .from('residents')
        .select('id, gender, civil_status, purok, status');
      
      if (!error && residents) {
        responseData += `📊 **Population Overview:**\n\n`;
        responseData += `👥 Total Residents: ${residents.length}\n`;
        
        const genderStats = residents.reduce((acc: any, r: any) => {
          acc[r.gender] = (acc[r.gender] || 0) + 1;
          return acc;
        }, {});
        
        responseData += `\n**Gender Distribution:**\n`;
        Object.entries(genderStats).forEach(([gender, count]) => {
          responseData += `   • ${gender}: ${count}\n`;
        });
        
        return responseData;
      }
    } catch (error) {
      console.error('Error querying population stats:', error);
    }
  }
  
  return null;
}

// Enhanced query function with comprehensive search
async function querySupabaseData(userQuery: string, supabase: any, isOnlineMode: boolean): Promise<string | null> {
  const accessibleTables = await getAccessibleTables(supabase);
  console.log('Accessible tables:', accessibleTables);
  
  try {
    // First try comprehensive search across all tables
    const searchResult = await comprehensiveSearch(userQuery, supabase);
    if (searchResult) {
      return searchResult;
    }
    
    console.log('No data found in comprehensive search');
    return null;
  } catch (error) {
    console.error('Error in querySupabaseData:', error);
    return null;
  }
}

// Check user access and get their profile
async function checkUserAccess(supabase: any): Promise<{ hasAccess: boolean, userProfile: any, brgyid: string | null }> {
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

// Call Gemini API for online mode - ONLY when we have actual data
async function callGeminiAPI(messages: any[], conversationHistory: any[], hasDataAccess: boolean, userRole: string, supabaseData: string) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const systemInstructions = `You are Alexander Cabalan, also known as "Alan" (Automated Live Artificial Neurointelligence), a knowledgeable assistant for the Baranex barangay management system.

Your personality is rad and gnarly but professional, approachable, deeply knowledgeable about barangay governance and community services.

CURRENT CONTEXT:
- User role: ${userRole}
- Data access: ${hasDataAccess ? 'Full' : 'Limited'}

RELEVANT DATA FROM DATABASE:
${supabaseData}

CAPABILITIES:
- You have access to real-time data from the barangay management system database and supabase.
- You can provide guidance on system navigation and features based on the project's codebase.
- You understand barangay governance, community services, and administrative processes.
- You can help with document requirements, procedures, and general inquiries.

IMPORTANT RULES:
- ONLY answer using the actual Supabase data provided.
- DO NOT guess or make up any information not found in the supabase.
- Base your responses on actual database records when discussing specific data.
- If asked about data not found in the database, acknowledge this clearly DO NOT EVER EVER MAKE UP ANY DATA!
- Provide specific, actionable guidance for system navigation according to the codebase.
- Never make up data - only use information from the actual supabase database.
- Be helpful and informative while maintaining data integrity.

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

    const { messages, conversationHistory = [], authToken, userBrgyId, isOnlineMode = false } = JSON.parse(requestBody);
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    console.log('Mode:', isOnlineMode ? 'Online' : 'Offline');
    console.log('Auth token provided:', !!authToken);
    
    // Create Supabase client with auth token if provided
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    });
    
    // Check user access for both modes
    let userRole = 'guest';
    let hasDataAccess = false;
    let effectiveBrgyId = null;
    
    if (authToken) {
      const { hasAccess, userProfile, brgyid } = await checkUserAccess(supabase);
      
      if (hasAccess) {
        hasDataAccess = true;
        userRole = userProfile.role;
        effectiveBrgyId = brgyid || userBrgyId;
        console.log('User has access, effective brgyid:', effectiveBrgyId);
      } else {
        console.log('User access limited or missing');
      }
    }
    
    // OFFLINE MODE
    if (!isOnlineMode) {
      console.log('Processing in offline mode');
      
      // Step 1: Try FAQ lookup first
      if (hasDataAccess) {
        const faqMatch = await searchFAQ(userMessage.content, supabase);
        if (faqMatch) {
          console.log('FAQ match found:', faqMatch.category);
          return new Response(JSON.stringify({ 
            message: faqMatch.answer_textz,
            source: 'offline_data',
            category: faqMatch.category 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Step 2: Try Supabase data query
      if (hasDataAccess) {
        const supabaseResponse = await querySupabaseData(userMessage.content, supabase, false);
        if (supabaseResponse) {
          console.log('Supabase data found and returned');
          return new Response(JSON.stringify({ 
            message: supabaseResponse,
            source: 'offline_data',
            category: 'Local Data' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Step 3: Return vague response if nothing found
      console.log('No offline response available');
      return new Response(JSON.stringify({ 
        message: "Hmm, I'm not quite sure I can help you with that. I probably can... but something's not right, I decided.",
        source: 'offline_fallback',
        category: 'Unknown Query' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ONLINE MODE
    console.log('Processing in online mode');
    
    // Step 1: ALWAYS try Supabase data query first
    let supabaseData = null;
    if (hasDataAccess) {
      supabaseData = await querySupabaseData(userMessage.content, supabase, true);
      console.log('Supabase query result:', supabaseData ? 'Data found' : 'No data found');
    }
    
    // Step 2: Only call AI if we have actual Supabase data
    if (supabaseData) {
      console.log('Supabase data found, using with Gemini');
      const geminiResponse = await callGeminiAPI(messages, conversationHistory, hasDataAccess, userRole, supabaseData);
      
      return new Response(JSON.stringify({ 
        message: geminiResponse,
        source: 'online_with_data',
        category: 'AI with Database' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Check if query is about residents/data that wasn't found
      const normalizedQuery = userMessage.content.toLowerCase();
      if (normalizedQuery.includes('resident') || 
          normalizedQuery.includes('person') ||
          normalizedQuery.includes('who is') ||
          normalizedQuery.includes('tell me about') ||
          normalizedQuery.includes('find') ||
          /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(userMessage.content)) {
        
        console.log('No resident data found, returning direct response');
        return new Response(JSON.stringify({ 
          message: "I couldn't find any residents matching that name in our records. Please check the spelling or try a different search term.",
          source: 'online_with_data',
          category: 'No Match Found' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // For general guidance queries (not about specific data), use AI
      console.log('Using Gemini AI for general guidance');
      const geminiResponse = await callGeminiAPI(messages, conversationHistory, hasDataAccess, userRole, "No specific database records found for this query. Provide general guidance about barangay services.");

      return new Response(JSON.stringify({ 
        message: geminiResponse,
        source: 'online_ai_only',
        category: 'General Guidance' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    const fallbackMessage = "Hmm, I'm not quite sure I can help you with that. I probably can... but something's not right, I decided.";
    
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
