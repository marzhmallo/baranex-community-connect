
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { messages, conversationHistory = [] } = await req.json();
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || !userMessage.content) {
      throw new Error('No user message provided');
    }

    console.log('User query:', userMessage.content);
    
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

    // Step 2: Fallback to Gemini AI
    console.log('No FAQ match, using Gemini AI');
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
    
    // Fallback message when both systems fail
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
