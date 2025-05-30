
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `You are BaranexBot, an AI assistant for the Baranex barangay management system. You help residents and officials with:

1. BARANGAY SERVICES & PROCEDURES:
   - Document requests (certificates, clearances, permits)
   - Household registration and resident information
   - Official positions and contact information
   - Event schedules and announcements
   - Blotter reports and emergency procedures

2. SYSTEM GUIDANCE:
   - How to navigate the dashboard
   - Using different features and modules
   - Understanding resident classifications
   - Document issuance process
   - Emergency response protocols

3. GENERAL BARANGAY INFORMATION:
   - Local government structure
   - Community programs and services
   - Requirements for various transactions
   - Office hours and contact details

Keep responses helpful, concise, and professional. If you don't know specific details about the barangay, provide general guidance and suggest contacting the barangay office. Always be respectful and courteous.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baranex.lovable.app',
        'X-Title': 'Baranex Chatbot'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-zero',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
