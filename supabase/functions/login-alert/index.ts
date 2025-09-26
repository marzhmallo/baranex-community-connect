import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
// Removed resend import to fix build error

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Login alert function called, but email sending is disabled');
    
    return new Response(JSON.stringify({ 
      message: "Login alert logged but email sending is disabled",
      status: "disabled"
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });

  } catch (err: any) {
    console.error('Login alert function error:', err);
    return new Response(JSON.stringify({ 
      error: err?.message ?? 'An unexpected error occurred' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

serve(handler);