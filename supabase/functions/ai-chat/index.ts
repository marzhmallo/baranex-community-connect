
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

// Service role client for data queries
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
// Anon client for auth verification
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize text for keyword matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Search FAQ database for matching entries
async function searchFAQ(userQuery: string) {
  const normalizedQuery = normalizeText(userQuery);
  const queryWords = normalizedQuery.split(' ');
  
  try {
    const { data: faqs, error } = await supabaseService
      .from('chatbot_faq')
      .select('*');
    
    if (error) {
      console.error('FAQ search error:', error);
      return null;
    }
    
    let bestMatch = null;
    let maxScore = 0;
    
    for (const faq of faqs) {
      const keywords = faq.question_keywords || [];
      let score = 0;
      
      // Check for exact phrase matches first
      for (const keyword of keywords) {
        if (normalizedQuery.includes(normalizeText(keyword))) {
          score += keyword.length; // Longer matches get higher scores
        }
      }
      
      // Check for individual word matches
      for (const keyword of keywords) {
        const keywordWords = normalizeText(keyword).split(' ');
        for (const keywordWord of keywordWords) {
          if (queryWords.includes(keywordWord) && keywordWord.length > 2) {
            score += 1;
          }
        }
      }
      
      if (score > maxScore && score >= 2) { // Minimum threshold for match
        maxScore = score;
        bestMatch = faq;
      }
    }
    
    return bestMatch;
  } catch (error) {
    console.error('FAQ search failed:', error);
    return null;
  }
}

// Check if user is authenticated and get their role
async function getUserRole(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return null;
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return null;
    }

    return { userId: user.id, role: profile.role };
  } catch (error) {
    console.error('User verification failed:', error);
    return null;
  }
}

// Query Supabase for real-time data
async function querySupabaseData(query: string, userRole: string) {
  const normalizedQuery = normalizeText(query);
  console.log('Querying Supabase data for:', normalizedQuery);

  // Only allow admin and staff to access real data
  if (!['admin', 'staff'].includes(userRole)) {
    return {
      hasData: false,
      message: "I can only provide real-time barangay data to authenticated administrators and staff members. Please contact your barangay admin for assistance."
    };
  }

  try {
    let results = [];

    // Query events
    if (normalizedQuery.includes('event') || normalizedQuery.includes('activity') || normalizedQuery.includes('schedule')) {
      const { data: events, error } = await supabaseService
        .from('events')
        .select('title, description, start_time, end_time, location, event_type')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (!error && events && events.length > 0) {
        results.push({
          type: 'events',
          data: events,
          message: `Here are the upcoming events:`
        });
      }
    }

    // Query announcements
    if (normalizedQuery.includes('announcement') || normalizedQuery.includes('news') || normalizedQuery.includes('update')) {
      const { data: announcements, error } = await supabaseService
        .from('announcements')
        .select('title, content, category, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && announcements && announcements.length > 0) {
        results.push({
          type: 'announcements',
          data: announcements,
          message: `Here are the latest announcements:`
        });
      }
    }

    // Query officials
    if (normalizedQuery.includes('official') || normalizedQuery.includes('captain') || normalizedQuery.includes('kagawad') || normalizedQuery.includes('leader')) {
      const { data: officials, error } = await supabaseService
        .from('officials')
        .select('name, position, email, phone')
        .order('position', { ascending: true });

      if (!error && officials && officials.length > 0) {
        results.push({
          type: 'officials',
          data: officials,
          message: `Here are the barangay officials:`
        });
      }
    }

    if (results.length > 0) {
      return {
        hasData: true,
        results: results
      };
    }

    return { hasData: false };
  } catch (error) {
    console.error('Supabase query error:', error);
    return { hasData: false };
  }
}

// Format Supabase data into readable response
function formatSupabaseResponse(results: any[]) {
  let response = "";

  for (const result of results) {
    response += result.message + "\n\n";

    if (result.type === 'events') {
      result.data.forEach((event: any, index: number) => {
        const startDate = new Date(event.start_time).toLocaleDateString();
        const startTime = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        response += `${index + 1}. **${event.title}**\n`;
        response += `   📅 ${startDate} at ${startTime}\n`;
        if (event.location) response += `   📍 ${event.location}\n`;
        if (event.description) response += `   📝 ${event.description}\n`;
        response += "\n";
      });
    }

    if (result.type === 'announcements') {
      result.data.forEach((announcement: any, index: number) => {
        const date = new Date(announcement.created_at).toLocaleDateString();
        response += `${index + 1}. **${announcement.title}**\n`;
        response += `   📅 Posted on ${date}\n`;
        response += `   📂 Category: ${announcement.category}\n`;
        response += `   📝 ${announcement.content.substring(0, 200)}${announcement.content.length > 200 ? '...' : ''}\n\n`;
      });
    }

    if (result.type === 'officials') {
      result.data.forEach((official: any, index: number) => {
        response += `${index + 1}. **${official.name}** - ${official.position}\n`;
        if (official.email) response += `   📧 ${official.email}\n`;
        if (official.phone) response += `   📞 ${official.phone}\n`;
        response += "\n";
      });
    }
  }

  return response.trim();
}

// Call Gemini API for conversational responses
async function callGeminiAPI(messages: any[], conversationHistory: any[], userData: any = null) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  let systemContext = `You are Alex, a friendly and helpful assistant for the Baranex Barangay Management System.
Your purpose is to provide general assistance, polite greetings, and guide users through common system interactions.
You do NOT have access to real-time data from the Baranex system, specific database entries, or personal user information unless specifically provided.
If a user asks for specific details about barangay services, politely suggest they check the relevant sections of the Baranex system or consult a barangay official for accurate information.
Do not make up information about barangay processes or personal user data.
Keep your answers concise, professional, and maintain a consistent persona as Alex, the Barangay assistant.
Always maintain a helpful and positive tone. Your primary function is system guidance and general assistance.`;

  if (userData) {
    systemContext += `\n\nAdditional context: The user is an authenticated ${userData.role} with access to real-time barangay data.`;
  }

  // Combine conversation history with current messages
  const allMessages = [
    { role: 'model', parts: [{ text: systemContext }] },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    ...messages.slice(-1).map(msg => ({
      role: 'user',
      parts: [{ text: msg.content }]
    }))
  ];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: allMessages.filter(msg => msg.role !== 'model' || msg.parts[0].text !== systemContext),
      systemInstruction: {
        parts: [{ text: systemContext }]
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
    const { messages, conversationHistory = [] } = await req.json();
    const userMessage = messages[messages.length - 1];
    const authHeader = req.headers.get('authorization');
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    
    // Check user authentication and role
    const userData = await getUserRole(authHeader);
    console.log('User data:', userData);

    // Step 1: Try FAQ lookup first
    const faqMatch = await searchFAQ(userMessage.content);
    
    if (faqMatch) {
      console.log('FAQ match found:', faqMatch.category);
      return new Response(JSON.stringify({ 
        message: faqMatch.answer_text,
        source: 'faq',
        category: faqMatch.category 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Try Supabase data query for authenticated users
    if (userData) {
      const supabaseResult = await querySupabaseData(userMessage.content, userData.role);
      
      if (supabaseResult.hasData && supabaseResult.results) {
        const formattedResponse = formatSupabaseResponse(supabaseResult.results);
        console.log('Supabase data found, returning formatted response');
        return new Response(JSON.stringify({ 
          message: formattedResponse,
          source: 'supabase',
          category: 'Real-time Data' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (!supabaseResult.hasData && supabaseResult.message) {
        // User doesn't have permission for real data
        return new Response(JSON.stringify({ 
          message: supabaseResult.message,
          source: 'auth_error',
          category: 'Access Control' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 3: Check if user is asking for data but not authenticated
    const dataKeywords = ['event', 'announcement', 'official', 'schedule', 'news', 'update', 'captain', 'kagawad'];
    const isDataQuery = dataKeywords.some(keyword => 
      normalizeText(userMessage.content).includes(keyword)
    );

    if (isDataQuery && !userData) {
      const authMessage = "Oops, I may not have access to that data or it doesn't exist. To access real-time barangay data, please log in to your Baranex account. Perhaps you can check the Baranex system or contact your barangay admin for assistance.";
      return new Response(JSON.stringify({ 
        message: authMessage,
        source: 'auth_required',
        category: 'Authentication Required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Fallback to Gemini AI
    console.log('No FAQ or Supabase match, using Gemini AI');
    const geminiResponse = await callGeminiAPI(messages, conversationHistory, userData);

    return new Response(JSON.stringify({ 
      message: geminiResponse,
      source: 'ai',
      category: 'Conversational' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    
    // Fallback message when all systems fail
    const fallbackMessage = "Oops, I may not have access to that data or it doesn't exist. Please try again later or contact your barangay admin for assistance.";
    
    return new Response(JSON.stringify({ 
      message: fallbackMessage,
      source: 'fallback',
      error: error.message 
    }), {
      status: 200, // Return 200 to avoid breaking the UI
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
