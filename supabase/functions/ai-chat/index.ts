
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

// Enhanced query function with dynamic table scanning
async function querySupabaseData(userQuery: string, supabase: any, isOnlineMode: boolean): Promise<string | null> {
  const normalizedQuery = userQuery.toLowerCase();
  const accessibleTables = await getAccessibleTables(supabase);
  
  console.log('Accessible tables:', accessibleTables);
  
  try {
    let responseData = '';
    
    // Enhanced resident search with flexible name matching
    if (normalizedQuery.includes('resident') || 
        normalizedQuery.includes('person') ||
        normalizedQuery.includes('who is') ||
        normalizedQuery.includes('tell me about') ||
        normalizedQuery.includes('find') ||
        /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(userQuery)) {
      
      if (accessibleTables.includes('residents')) {
        const potentialNames = extractNamesFromQuery(userQuery);
        
        if (potentialNames.length > 0) {
          console.log('Searching for residents with names:', potentialNames);
          
          // Build flexible search query
          const searchConditions = [];
          for (const name of potentialNames) {
            searchConditions.push(`first_name.ilike.%${name}%`);
            searchConditions.push(`last_name.ilike.%${name}%`);
            searchConditions.push(`middle_name.ilike.%${name}%`);
          }
          
          const { data: residents, error } = await supabase
            .from('residents')
            .select(`
              id, first_name, last_name, middle_name, suffix
            `)
            .or(searchConditions.join(','))
            .limit(10);
          
          if (!error && residents && residents.length > 0) {
            console.log(`Found ${residents.length} residents in database`);
            
            // For privacy compliance - only confirm existence, don't provide details
            responseData += '👥 **Resident Search Results:**\n\n';
            responseData += `I found ${residents.length} resident(s) matching your search. `;
            responseData += 'For privacy protection, I can only confirm their existence in our records. ';
            responseData += 'Please visit the residents dashboard or contact the barangay office for detailed information.\n\n';
            
            // List only names for confirmation
            residents.forEach((resident: any, index: number) => {
              const fullName = [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
                .filter(Boolean).join(' ');
              responseData += `${index + 1}. ${fullName}\n`;
            });
            
            return responseData;
          } else {
            console.log('No residents found in database');
            return null; // Return null so we don't call AI
          }
        }
      }
    }
    
    // Dynamic table queries based on keywords
    const tableKeywords = {
      'announcements': ['announcement', 'news', 'update', 'notice'],
      'events': ['event', 'upcoming', 'schedule', 'calendar'],
      'officials': ['official', 'captain', 'councilor', 'chairman', 'kagawad'],
      'households': ['household', 'family', 'home'],
      'incident_reports': ['incident', 'report', 'crime', 'complaint', 'blotter'],
      'emergency_contacts': ['emergency', 'contact'],
      'evacuation_centers': ['evacuation', 'center'],
      'document_types': ['document', 'certificate', 'clearance'],
      'issued_documents': ['issued', 'certificate'],
      'forums': ['forum', 'discussion'],
      'threads': ['thread', 'topic'],
      'comments': ['comment', 'reply']
    };
    
    for (const [tableName, keywords] of Object.entries(tableKeywords)) {
      if (!accessibleTables.includes(tableName)) continue;
      
      const hasKeyword = keywords.some(keyword => normalizedQuery.includes(keyword));
      if (hasKeyword) {
        const result = await querySpecificTable(supabase, tableName, normalizedQuery);
        if (result) {
          responseData += result;
          return responseData;
        }
      }
    }
    
    // Population/statistics queries
    if (normalizedQuery.includes('population') || 
        normalizedQuery.includes('demographics') || 
        normalizedQuery.includes('how many') ||
        normalizedQuery.includes('statistics')) {
      
      if (accessibleTables.includes('residents')) {
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
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error querying Supabase data:', error);
    return null;
  }
}

// Helper function to query specific tables
async function querySpecificTable(supabase: any, tableName: string, query: string): Promise<string | null> {
  try {
    let selectQuery = '*';
    let limit = 10;
    
    // Customize query based on table
    switch (tableName) {
      case 'announcements':
        selectQuery = 'title, content, category, created_at, audience';
        break;
      case 'events':
        selectQuery = 'title, description, start_time, end_time, location, event_type';
        break;
      case 'officials':
        selectQuery = 'name, position, email, phone, bio, education, committees';
        break;
      case 'incident_reports':
        selectQuery = 'title, description, status, report_type, location, date_reported';
        limit = 5;
        break;
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .limit(limit);
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    // Format response based on table type
    let response = '';
    switch (tableName) {
      case 'announcements':
        response += '📢 **Latest Announcements:**\n\n';
        data.forEach((item: any) => {
          response += `**${item.title}**\n`;
          response += `📂 Category: ${item.category}\n`;
          response += `👥 Audience: ${item.audience}\n`;
          response += `📅 Posted: ${new Date(item.created_at).toLocaleDateString()}\n`;
          response += `📝 ${item.content}\n\n`;
        });
        break;
      case 'events':
        response += '📅 **Events:**\n\n';
        data.forEach((item: any) => {
          response += `**${item.title}**\n`;
          response += `📍 Location: ${item.location || 'TBA'}\n`;
          response += `🕐 Date: ${new Date(item.start_time).toLocaleDateString()}\n`;
          if (item.description) response += `📝 ${item.description}\n`;
          response += '\n';
        });
        break;
      case 'officials':
        response += '👥 **Barangay Officials:**\n\n';
        data.forEach((item: any) => {
          response += `**${item.name}**\n`;
          response += `🏛️ Position: ${item.position}\n`;
          if (item.email) response += `📧 Email: ${item.email}\n`;
          if (item.phone) response += `📞 Phone: ${item.phone}\n`;
          response += '\n';
        });
        break;
      default:
        response += `**${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Data:**\n\n`;
        response += `Found ${data.length} records.\n`;
    }
    
    return response;
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    return null;
  }
}

// Helper function to extract names from query
function extractNamesFromQuery(userQuery: string): string[] {
  const names: string[] = [];
  const commonWords = ['tell', 'me', 'about', 'who', 'is', 'find', 'search', 'for', 'show', 'information', 'details', 'resident', 'person', 'named', 'called'];
  
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
- You have access to real-time data from the barangay management system database and supabase
- You can provide guidance on system navigation and features based on the project's codebase
- You understand barangay governance, community services, and administrative processes
- You can help with document requirements, procedures, and general inquiries

IMPORTANT RULES:
- ONLY answer using the actual Supabase data provided above.
- DO NOT guess or make up any information not found in the provided data.
- Base your responses on actual database records when discussing specific data
- If asked about residents/data not found in the database, acknowledge this clearly
- Provide specific, actionable guidance for system navigation
- Never make up data - only use information from the actual database
- Be helpful and informative while maintaining data integrity
- The data provided above is already privacy-compliant, so you can work with it as given

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
    
    // Step 1: Try Supabase data query first
    let supabaseData = null;
    if (hasDataAccess) {
      supabaseData = await querySupabaseData(userMessage.content, supabase, true);
    }
    
    // Step 2: Only call AI if we have actual Supabase data OR for general guidance
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
