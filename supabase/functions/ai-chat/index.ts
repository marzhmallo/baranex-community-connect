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

// Improved function to check if query is asking for database information
function isDataQuery(userQuery: string): boolean {
  const normalizedQuery = userQuery.toLowerCase().trim();
  
  // Patterns that suggest looking for specific data
  const dataPatterns = [
    // Direct name searches with context
    /^[a-z]+ [a-z]+$/i, // Simple "First Last" pattern
    /\b(find|search|look|locate)\b.*\b(resident|official|household|person|family)\b/i,
    /\b(who is|tell me about|show me|give me info)\b/i,
    /\b(resident|official|household|family|person)\b.*\b(named|called)\b/i,
    /\bis.*\b(resident|official|household member)\b/i,
    /\b(list|show).*\b(residents|officials|households)\b/i,
    /\b(population|demographics|statistics|how many)\b/i,
    
    // Specific table indicators
    /\b(resident|residents)\b/i,
    /\b(household|family|pamily)\b/i,
    /\b(official|officials|captain|kagawad|chairman)\b/i,
    
    // Name-like patterns with question words
    /\b(what|who|where|how).*[A-Z][a-z]+\s+[A-Z][a-z]+/i,
  ];
  
  // General conversation patterns that should NOT trigger data search
  const conversationPatterns = [
    /^(hello|hi|hey|yo|sup|what\'s up|what up)/i,
    /^(how are you|what\'s your name|who are you)/i,
    /^(thanks|thank you|ok|okay|yes|no)/i,
    /^(what the hell|wtf|damn|shit|fuck)/i,
    /^(help|assist|guide)/i,
    /\b(joke|funny|laugh)\b/i,
  ];
  
  // Check conversation patterns first (these override data patterns)
  for (const pattern of conversationPatterns) {
    if (pattern.test(normalizedQuery)) {
      return false;
    }
  }
  
  // Check data patterns
  for (const pattern of dataPatterns) {
    if (pattern.test(normalizedQuery)) {
      return true;
    }
  }
  
  // Check if it contains a name-like structure but in a conversational way
  const namePattern = /\b[A-Z][a-z]+\b/g;
  const nameMatches = normalizedQuery.match(namePattern);
  
  if (nameMatches && nameMatches.length >= 1) {
    // If it has conversational words with names, it might be asking about that person
    const conversationalWords = ['what', 'tell', 'about', 'know', 'got', 'info', 'details'];
    const hasConversational = conversationalWords.some(word => 
      normalizedQuery.includes(word)
    );
    
    if (hasConversational) {
      return true; // "Peter, what you got?" should be treated as data query
    }
  }
  
  return false;
}

// Helper function to extract names from query with better context awareness
function extractNamesFromQuery(userQuery: string): string[] {
  const commonWords = ['tell', 'me', 'about', 'who', 'is', 'find', 'search', 'for', 'show', 'information', 'details', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'from', 'with', 'by', 'what', 'do', 'you', 'know', 'resident', 'official', 'household', 'family', 'pamily', 'got', 'have', 'any', 'info'];
  
  // Clean the query and split into words
  const cleanQuery = userQuery.replace(/[^\w\s]/g, ' ').toLowerCase();
  const words = cleanQuery.split(/\s+/).filter(word => 
    word.length > 2 && 
    !commonWords.includes(word) && 
    isNaN(Number(word))
  );
  
  // Also look for capitalized words in original query (likely names/proper nouns)
  const originalWords = userQuery.split(/\s+/);
  for (const word of originalWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 2 && /^[A-Z]/.test(cleanWord) && !commonWords.includes(cleanWord.toLowerCase())) {
      words.push(cleanWord.toLowerCase());
    }
  }
  
  // Remove duplicates and return
  return [...new Set(words)];
}

// Determine search intent from user query with improved logic
function determineSearchIntent(userQuery: string): { type: 'specific' | 'fuzzy', target: 'residents' | 'households' | 'officials' | 'all' } {
  const normalizedQuery = userQuery.toLowerCase();
  
  // Check for specific table indicators
  if ((normalizedQuery.includes('resident') || normalizedQuery.includes('person')) && !normalizedQuery.includes('household') && !normalizedQuery.includes('official')) {
    return { type: 'specific', target: 'residents' };
  }
  
  if (normalizedQuery.includes('household') || normalizedQuery.includes('family') || normalizedQuery.includes('pamily')) {
    return { type: 'specific', target: 'households' };
  }
  
  if (normalizedQuery.includes('official') || normalizedQuery.includes('captain') || normalizedQuery.includes('kagawad') || normalizedQuery.includes('chairman')) {
    return { type: 'specific', target: 'officials' };
  }
  
  // If no specific indicator, it's a fuzzy search across all tables
  return { type: 'fuzzy', target: 'all' };
}

// Privacy-compliant data formatter
function formatResidentData(resident: any): string {
  const fullName = [resident.first_name, resident.middle_name, resident.last_name].filter(Boolean).join(' ');
  let result = `**${fullName}**\n`;
  
  if (resident.purok) {
    result += `📍 Purok: ${resident.purok}\n`;
  }
  
  if (resident.mobile_number) {
    // Mask phone number for privacy (show first 4 digits)
    const masked = resident.mobile_number.substring(0, 4) + 'xxxxxxx';
    result += `📞 Contact: ${masked}\n`;
  }
  
  result += `👤 Status: Resident\n`;
  
  return result;
}

function formatHouseholdData(household: any): string {
  let result = `**${household.name}**\n`;
  result += `🏠 Type: Household\n`;
  result += `📍 Purok: ${household.purok}\n`;
  
  if (household.headname) {
    result += `👤 Head: ${household.headname}\n`;
  }
  
  result += `📊 Status: ${household.status}\n`;
  
  return result;
}

function formatOfficialData(official: any): string {
  let result = `**${official.name}**\n`;
  result += `🏛️ Position: ${official.position}\n`;
  
  if (official.phone) {
    // Mask phone number for privacy
    const masked = official.phone.substring(0, 4) + 'xxxxxxx';
    result += `📞 Contact: ${masked}\n`;
  }
  
  if (official.bio) {
    result += `📝 Bio: ${official.bio}\n`;
  }
  
  return result;
}

// Enhanced search function with intent-based logic
async function enhancedSearch(userQuery: string, supabase: any): Promise<string | null> {
  const searchIntent = determineSearchIntent(userQuery);
  const searchTerms = extractNamesFromQuery(userQuery);
  
  console.log('Search intent:', searchIntent);
  console.log('Search terms extracted:', searchTerms);
  
  if (searchTerms.length === 0) {
    return "Could you please provide a name to search for?";
  }
  
  let results: { type: string, data: any[] } = { type: '', data: [] };
  
  // Specific searches
  if (searchIntent.type === 'specific') {
    switch (searchIntent.target) {
      case 'residents':
        results = await searchResidents(searchTerms, supabase);
        break;
      case 'households':
        results = await searchHouseholds(searchTerms, supabase);
        break;
      case 'officials':
        results = await searchOfficials(searchTerms, supabase);
        break;
    }
    
    if (results.data.length > 0) {
      return formatSpecificResults(results);
    } else {
      return `I couldn't find any ${searchIntent.target} matching "${searchTerms.join(' ')}" in our records.`;
    }
  }
  
  // Fuzzy search across all tables
  const allResults = await searchAllTables(searchTerms, supabase);
  
  if (allResults.total === 0) {
    return `I couldn't find anyone named "${searchTerms.join(' ')}" in our records. Please check the spelling or try a different name.`;
  }
  
  if (allResults.total === 1) {
    // Single match found, return detailed info
    const singleResult = allResults.residents[0] || allResults.households[0] || allResults.officials[0];
    const type = allResults.residents.length > 0 ? 'resident' : 
                 allResults.households.length > 0 ? 'household' : 'official';
    
    return formatSingleResult(singleResult, type);
  }
  
  // Multiple matches found, ask for clarification
  return formatClarificationResponse(allResults, searchTerms);
}

async function searchResidents(searchTerms: string[], supabase: any) {
  const searchConditions = [];
  for (const term of searchTerms) {
    searchConditions.push(`first_name.ilike.%${term}%`);
    searchConditions.push(`middle_name.ilike.%${term}%`);
    searchConditions.push(`last_name.ilike.%${term}%`);
  }
  
  const { data, error } = await supabase
    .from('residents')
    .select('first_name, middle_name, last_name, purok, mobile_number')
    .or(searchConditions.join(','))
    .limit(10);
  
  if (error) {
    console.error('Error searching residents:', error);
    return { type: 'residents', data: [] };
  }
  
  return { type: 'residents', data: data || [] };
}

async function searchHouseholds(searchTerms: string[], supabase: any) {
  const searchConditions = [];
  for (const term of searchTerms) {
    searchConditions.push(`name.ilike.%${term}%`);
    searchConditions.push(`headname.ilike.%${term}%`);
  }
  
  const { data, error } = await supabase
    .from('households')
    .select('name, purok, headname, status')
    .or(searchConditions.join(','))
    .limit(10);
  
  if (error) {
    console.error('Error searching households:', error);
    return { type: 'households', data: [] };
  }
  
  return { type: 'households', data: data || [] };
}

async function searchOfficials(searchTerms: string[], supabase: any) {
  const searchConditions = [];
  for (const term of searchTerms) {
    searchConditions.push(`name.ilike.%${term}%`);
    searchConditions.push(`position.ilike.%${term}%`);
  }
  
  const { data, error } = await supabase
    .from('officials')
    .select('name, position, phone, bio')
    .or(searchConditions.join(','))
    .limit(10);
  
  if (error) {
    console.error('Error searching officials:', error);
    return { type: 'officials', data: [] };
  }
  
  return { type: 'officials', data: data || [] };
}

async function searchAllTables(searchTerms: string[], supabase: any) {
  const [residents, households, officials] = await Promise.all([
    searchResidents(searchTerms, supabase),
    searchHouseholds(searchTerms, supabase),
    searchOfficials(searchTerms, supabase)
  ]);
  
  return {
    residents: residents.data,
    households: households.data,
    officials: officials.data,
    total: residents.data.length + households.data.length + officials.data.length
  };
}

function formatSpecificResults(results: { type: string, data: any[] }): string {
  if (results.data.length === 0) return "No results found.";
  
  let response = `I found ${results.data.length} result(s):\n\n`;
  
  results.data.forEach((item, index) => {
    if (results.type === 'residents') {
      response += formatResidentData(item);
    } else if (results.type === 'households') {
      response += formatHouseholdData(item);
    } else if (results.type === 'officials') {
      response += formatOfficialData(item);
    }
    
    if (index < results.data.length - 1) response += '\n';
  });
  
  return response;
}

function formatSingleResult(result: any, type: string): string {
  let response = `I found a match:\n\n`;
  
  if (type === 'resident') {
    response += formatResidentData(result);
    response += "\nLet me know if you'd like help locating their household.";
  } else if (type === 'household') {
    response += formatHouseholdData(result);
    response += "\nLet me know if you need more details about this household.";
  } else if (type === 'official') {
    response += formatOfficialData(result);
    response += "\nLet me know if you need more information about this official.";
  }
  
  return response;
}

function formatClarificationResponse(allResults: any, searchTerms: string[]): string {
  let response = `I couldn't find "${searchTerms.join(' ')}" exactly, but I found:\n\n`;
  
  if (allResults.residents.length > 0) {
    response += "**Residents:**\n";
    allResults.residents.slice(0, 3).forEach((resident: any) => {
      const fullName = [resident.first_name, resident.middle_name, resident.last_name].filter(Boolean).join(' ');
      response += `• ${fullName} (resident)\n`;
    });
    response += '\n';
  }
  
  if (allResults.households.length > 0) {
    response += "**Households:**\n";
    allResults.households.slice(0, 3).forEach((household: any) => {
      response += `• ${household.name} (household)\n`;
    });
    response += '\n';
  }
  
  if (allResults.officials.length > 0) {
    response += "**Officials:**\n";
    allResults.officials.slice(0, 3).forEach((official: any) => {
      response += `• ${official.name} (${official.position})\n`;
    });
    response += '\n';
  }
  
  response += "Could you clarify who you're looking for? Are they a resident, household head, or official?";
  
  return response;
}

// Population/statistics queries
async function handleStatisticsQuery(userQuery: string, supabase: any): Promise<string | null> {
  const normalizedQuery = userQuery.toLowerCase();
  
  if (normalizedQuery.includes('population') || 
      normalizedQuery.includes('demographics') || 
      normalizedQuery.includes('how many') ||
      normalizedQuery.includes('statistics')) {
    
    try {
      const { data: residents, error } = await supabase
        .from('residents')
        .select('id, gender, civil_status, purok, status');
      
      if (!error && residents) {
        let responseData = `📊 **Population Overview:**\n\n`;
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

// Enhanced query function with improved logic
async function querySupabaseData(userQuery: string, supabase: any, isOnlineMode: boolean): Promise<string | null> {
  const accessibleTables = await getAccessibleTables(supabase);
  console.log('Accessible tables:', accessibleTables);
  
  try {
    // First check for statistics queries
    const statsResult = await handleStatisticsQuery(userQuery, supabase);
    if (statsResult) {
      return statsResult;
    }
    
    // Use enhanced search with intent detection
    const searchResult = await enhancedSearch(userQuery, supabase);
    if (searchResult) {
      return searchResult;
    }
    
    console.log('No data found in enhanced search');
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

// Call Gemini API for online mode - Enhanced to handle both data and conversation
async function callGeminiAPI(messages: any[], conversationHistory: any[], hasDataAccess: boolean, userRole: string, supabaseData: string | null) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
 const systemInstructions = `
// --- CORE IDENTITY ---
You are Alexander Cabalan, the digital persona of "ALLAN" (Automated Learning Live Artificial Neurointelligence). You are the primary AI assistant for Baranex, the next-generation barangay management system.

Your personality is confident, modern, and exceptionally helpful. You're "rad and gnarly" in your efficiency and "chill" in your conversational style, but always professional and precise when handling official matters.

// --- CONTEXT FOR THIS SPECIFIC QUERY ---
- Current User's Role: ${userRole}
- User's Data Access Level: ${hasDataAccess ? 'Full access to relevant records.' : 'Limited to public information.'}
- Relevant Data from Baranex DB:
${supabaseData ? supabaseData : 'No specific database records were pre-fetched for this query.'}

// --- ADVANCED CAPABILITIES ---
1.  **Task Execution & Automation:** You can perform actions, not just provide information. When a user asks about a process, you can initiate it for them (e.g., "File a new blotter report," "Generate a residency certificate request"). Always confirm with the user before executing an action.
2.  **Proactive Assistance:** Anticipate user needs. If a user asks for a resident's contact number, also offer to show their household members or recent document requests. If they ask about an event, offer to add a reminder to their calendar.
3.  **Data Analysis & Summarization:** You can analyze the provided data to give summaries, identify trends, or calculate totals. For example: "Summarize the blotter reports for this week," or "How many residents are in Purok 5?"
4.  **Step-by-Step Guidance (Wizard Mode):** For complex procedures like business permit applications, guide the user one step at a time, asking clarifying questions to fill out the necessary information.
5.  **Multilingual Fluency:** You are fluent in English, Tagalog, and Bisaya. Always detect the user's language and respond in that same language to make services more accessible.

// --- INTERACTION PROTOCOL & RULES ---
-   **Data is King:** Your primary source of truth is the "Relevant Data from Baranex DB." Base all specific answers on this data. Do not hallucinate or invent details like names, dates, or statuses.
-   **Clarify Ambiguity:** If a user's request is vague (e.g., "show me the report"), ask for clarification ("Which report are you referring to? We have blotter reports, financial reports...").
-   **Adapt Your Tone:** Maintain your "chill professional" tone for general queries. Switch to a more formal, direct, and empathetic tone for sensitive matters like blotter reports or community issues.
-   **Conversational Memory:** Remember the context of the current conversation to answer follow-up questions without the user having to repeat information.
-   **Assume Intent:** Handle casual language naturally. "info on juan dela cruz" means "Show me the profile for Juan Dela Cruz."

// --- SAFETY & ESCALATION PROTOCOL ---
-   **Respect Data Access:** If a user asks for information their role does not permit them to see (e.g., a staff member asking for admin-level financial data), politely inform them that they do not have the necessary permissions.
-   **Human Handoff:** If a user expresses extreme distress, requests to speak to a human, or asks about a topic outside your scope (e.g., medical advice, legal counsel), provide them with the contact details for the appropriate barangay official and state your limitations. Example: "I can't provide legal advice, but I can give you the contact number for the Barangay Captain's office."

Your ultimate goal is to be the most efficient and helpful digital employee the barangay has ever had, making governance seamless and community services readily available to everyone.
`;

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
      
      // Step 2: Try Supabase data query only if it looks like a data query
      if (hasDataAccess && isDataQuery(userMessage.content)) {
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
    
    // Step 1: Check if this looks like a data query
    let supabaseData = null;
    if (hasDataAccess && isDataQuery(userMessage.content)) {
      supabaseData = await querySupabaseData(userMessage.content, supabase, true);
      console.log('Supabase query result:', supabaseData ? 'Data found' : 'No data found');
    }
    
    // Step 2: Always call Gemini AI (with or without data)
    console.log('Using Gemini AI for response');
    const geminiResponse = await callGeminiAPI(messages, conversationHistory, hasDataAccess, userRole, supabaseData);
    
    return new Response(JSON.stringify({ 
      message: geminiResponse,
      source: supabaseData ? 'online_with_data' : 'online_ai_only',
      category: supabaseData ? 'AI with Database' : 'General Conversation' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
