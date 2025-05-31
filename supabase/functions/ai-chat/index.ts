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

// Normalize text for keyword matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Search FAQ database for matching entries
async function searchFAQ(userQuery: string, supabase: any) {
  const normalizedQuery = normalizeText(userQuery);
  const queryWords = normalizedQuery.split(' ');
  
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

// Check if user has admin role and get their brgyid
async function checkUserRole(supabase: any): Promise<{ isAdmin: boolean, userProfile: any, brgyid: string | null }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found');
      return { isAdmin: false, userProfile: null, brgyid: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, firstname, lastname, brgyid')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('No profile found for user');
      return { isAdmin: false, userProfile: null, brgyid: null };
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'staff';
    console.log(`User role: ${profile.role}, isAdmin: ${isAdmin}, brgyid: ${profile.brgyid}`);
    
    return { isAdmin, userProfile: profile, brgyid: profile.brgyid };
  } catch (error) {
    console.error('Error checking user role:', error);
    return { isAdmin: false, userProfile: null, brgyid: null };
  }
}

// Query Supabase data for admin users with brgyid filtering
async function querySupabaseData(userQuery: string, supabase: any, brgyid: string): Promise<string | null> {
  const normalizedQuery = normalizeText(userQuery);
  
  try {
    let responseData = '';
    
    // Check for events-related queries
    if (normalizedQuery.includes('event') || normalizedQuery.includes('upcoming') || normalizedQuery.includes('schedule')) {
      const { data: events, error } = await supabase
        .from('events')
        .select('title, description, start_time, end_time, location')
        .eq('brgyid', brgyid)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);
      
      if (!error && events && events.length > 0) {
        responseData += 'Here are the upcoming events:\n\n';
        events.forEach((event: any) => {
          const startDate = new Date(event.start_time).toLocaleDateString();
          const startTime = new Date(event.start_time).toLocaleTimeString();
          responseData += `📅 **${event.title}**\n`;
          responseData += `📍 ${event.location || 'Location TBA'}\n`;
          responseData += `🕐 ${startDate} at ${startTime}\n`;
          if (event.description) {
            responseData += `📝 ${event.description}\n`;
          }
          responseData += '\n';
        });
        return responseData;
      }
    }
    
    // Check for announcements-related queries
    if (normalizedQuery.includes('announcement') || normalizedQuery.includes('news') || normalizedQuery.includes('update')) {
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select('title, content, category, created_at')
        .eq('brgyid', brgyid)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error && announcements && announcements.length > 0) {
        responseData += 'Here are the latest announcements:\n\n';
        announcements.forEach((announcement: any) => {
          const datePosted = new Date(announcement.created_at).toLocaleDateString();
          responseData += `📢 **${announcement.title}**\n`;
          responseData += `📂 Category: ${announcement.category}\n`;
          responseData += `📅 Posted: ${datePosted}\n`;
          responseData += `📝 ${announcement.content}\n\n`;
        });
        return responseData;
      }
    }
    
    // Check for officials-related queries
    if (normalizedQuery.includes('official') || normalizedQuery.includes('barangay captain') || normalizedQuery.includes('councilor')) {
      // Query officials with their current positions from official_positions table
      const { data: officials, error } = await supabase
        .from('officials')
        .select(`
          name, 
          email, 
          phone,
          official_positions!inner(
            position,
            committee,
            is_current
          )
        `)
        .eq('brgyid', brgyid)
        .eq('official_positions.is_current', true)
        .order('name');
      
      if (!error && officials && officials.length > 0) {
        responseData += 'Here are the barangay officials:\n\n';
        officials.forEach((official: any) => {
          responseData += `👤 **${official.name}**\n`;
          
          // Display current positions
          if (official.official_positions && official.official_positions.length > 0) {
            official.official_positions.forEach((pos: any) => {
              responseData += `🏛️ Position: ${pos.position}\n`;
              if (pos.committee) {
                responseData += `📋 Committee: ${pos.committee}\n`;
              }
            });
          }
          
          if (official.email) {
            responseData += `📧 Email: ${official.email}\n`;
          }
          if (official.phone) {
            responseData += `📞 Phone: ${official.phone}\n`;
          }
          responseData += '\n';
        });
        return responseData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error querying Supabase data:', error);
    return null;
  }
}

// Call Gemini API for conversational responses
async function callGeminiAPI(messages: any[], conversationHistory: any[]) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const modelInstructions = `You are Alex, a friendly and helpful assistant for the Baranex Barangay Management System.
Your purpose is to provide general assistance, polite greetings, and guide users through common system interactions.
You do NOT have access to real-time data from the Baranex system, specific database entries, or personal user information.
If a user asks for specific details about barangay services (like "certificate of residency", "barangay clearance", "community events"),
politely suggest they check the relevant sections of the Baranex system or consult a barangay official for accurate information.
Do not make up information about barangay processes or personal user data.
Keep your answers concise, professional, and maintain a consistent persona as Alex, the Barangay assistant.
Always maintain a helpful and positive tone. Your primary function is system guidance and general assistance.`;

  // Combine conversation history with current messages
  const allMessages = [
    { role: 'model', parts: [{ text: modelInstructions }] },
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
      contents: allMessages.filter(msg => msg.role !== 'model' || msg.parts[0].text !== modelInstructions),
      systemInstruction: {
        parts: [{ text: modelInstructions }]
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

    const { messages, conversationHistory = [], authToken } = JSON.parse(requestBody);
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    
    // Create Supabase client with auth token if provided
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      }
    });
    
    // Step 1: Try FAQ lookup first
    const faqMatch = await searchFAQ(userMessage.content, supabase);
    
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

    // Step 2: Check if user is admin and try Supabase data query
    if (authToken) {
      const { isAdmin, userProfile, brgyid } = await checkUserRole(supabase);
      
      if (isAdmin && brgyid) {
        console.log('Admin user detected, checking Supabase data for brgyid:', brgyid);
        const supabaseResponse = await querySupabaseData(userMessage.content, supabase, brgyid);
        
        if (supabaseResponse) {
          console.log('Supabase data found and returned');
          return new Response(JSON.stringify({ 
            message: supabaseResponse,
            source: 'supabase',
            category: 'Live Data' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        console.log('Non-admin user or missing brgyid, skipping Supabase data query');
      }
    }

    // Step 3: Fallback to Gemini AI
    console.log('No FAQ or Supabase match, using Gemini AI');
    const geminiResponse = await callGeminiAPI(messages, conversationHistory);

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
    const fallbackMessage = "I apologize, but I'm having trouble processing your request right now. Please try again later or contact the barangay office directly for assistance.";
    
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
