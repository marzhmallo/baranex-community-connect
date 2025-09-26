import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Validate environment variables on startup
const validateEnvironment = () => {
  const missing = [];
  if (!GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Test Gemini API key validity
const testGeminiApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  try {
    console.log('Testing Gemini API key...');
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: "test" }] }
      }),
    });

    if (response.ok) {
      console.log('✓ Gemini API key is valid');
      return { valid: true };
    } else {
      const errorText = await response.text();
      console.error('✗ Gemini API key test failed:', response.status, errorText);
      return { valid: false, error: `API returned ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('✗ Gemini API key test error:', error);
    return { valid: false, error: (error as Error).message };
  }
};

// Generate embedding with timeout and retry logic
const generateEmbeddingWithRetry = async (inputText: string, recordId: string, maxRetries = 2): Promise<number[] | null> => {
  const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating embedding for record ${recordId}, attempt ${attempt + 1}`);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(EMBEDDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: inputText }] }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        
        // Don't retry on authentication errors
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        
        // Retry on other errors
        if (attempt < maxRetries) {
          console.log(`Retrying after ${(attempt + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
          continue;
        }
        return null;
      }
      
      const data = await response.json();
      const embedding = data.embedding?.values;
      
      if (!embedding || !Array.isArray(embedding)) {
        console.error(`Invalid embedding response for record ${recordId}:`, data);
        return null;
      }
      
      console.log(`✓ Successfully generated embedding for record ${recordId}`);
      return embedding;
      
    } catch (error: any) {
      console.error(`Error generating embedding for record ${recordId}, attempt ${attempt + 1}:`, error.message);
      
      if (error.name === 'AbortError') {
        console.error('Request timed out');
      }
      
      if (attempt < maxRetries) {
        console.log(`Retrying after ${(attempt + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
        continue;
      }
      return null;
    }
  }
  
  return null;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    validateEnvironment();
    
    const body = await req.json();
    const { tableName, brgyid, testMode, testApiKey } = body;
    
    // Handle API key test request
    if (testApiKey) {
      const testResult = await testGeminiApiKey();
      return new Response(JSON.stringify(testResult), {
        status: testResult.valid ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!tableName) {
      return new Response(JSON.stringify({ error: "tableName is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`=== Starting embedding generation for table: ${tableName} ===`);
    console.log(`Barangay ID: ${brgyid || 'All barangays'}`);
    console.log(`Test mode: ${testMode ? 'Yes' : 'No'}`);

    // Test API key before processing
    const apiKeyTest = await testGeminiApiKey();
    if (!apiKeyTest.valid) {
      return new Response(JSON.stringify({ 
        error: `Gemini API key is invalid: ${apiKeyTest.error}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Build query based on table and brgyid
    let query = supabaseAdmin
      .from(tableName)
      .select('*')
      .is('embedding', null);

    if (brgyid) {
      query = query.eq('brgyid', brgyid);
    }
    
    // In test mode, limit to 1 record
    if (testMode) {
      query = query.limit(1);
    }

    console.log('Fetching records from database...');
    const { data: records, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      return new Response(JSON.stringify({ 
        error: `Database error: ${error.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${records?.length || 0} records to process`);

    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        processed: 0,
        errors: 0,
        message: 'No records found that need embeddings'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const record of records) {
      try {
        let inputText = '';
        
        // Create optimized text for semantic search
        switch (tableName) {
          case 'residents':
            inputText = `Resident: ${record.first_name || ''} ${record.last_name || ''}. 
                        Nickname: ${record.nickname || 'None'}. 
                        Purok: ${record.purok || 'Unknown'}. 
                        Address: ${record.address || 'Unknown'}. 
                        Contact: ${record.mobile_number || 'None'}. 
                        Birthdate: ${record.birthdate || 'Unknown'}.`;
            break;
            
          case 'announcements':
            inputText = `Announcement: ${record.title || 'No title'}. 
                        Content: ${record.content || 'No content'}. 
                        Category: ${record.category || 'General'}. 
                        Visibility: ${record.visibility || 'Public'}.`;
            break;
            
          case 'docrequests':
            inputText = `Document Request: ${record.type || 'Unknown type'}. 
                        Number: ${record.docnumber || 'No number'}. 
                        Status: ${record.status || 'Unknown'}. 
                        Purpose: ${record.purpose || 'Unknown'}. 
                        Receiver: ${record.receiver?.name || 'Unknown'}.`;
            break;
            
          case 'events':
            inputText = `Event: ${record.title || 'No title'}. 
                        Date: ${record.start_time || 'Unknown'}. 
                        Location: ${record.location || 'Unknown'}. 
                        Description: ${record.description || 'No description'}. 
                        Type: ${record.event_type || 'Unknown'}.`;
            break;
            
          case 'households':
            inputText = `Household: ${record.name || 'Unknown'}. 
                        Address: ${record.address || 'Unknown'}. 
                        Purok: ${record.purok || 'Unknown'}. 
                        Head of Family: ${record.headname || 'Unknown'}.`;
            break;
            
          default:
            console.log(`Skipping unconfigured table: ${tableName}`);
            errorDetails.push(`Table ${tableName} is not configured for embeddings`);
            errors++;
            continue;
        }

        // Generate embedding with retry logic
        const embedding = await generateEmbeddingWithRetry(inputText, record.id);
        
        if (!embedding) {
          errorDetails.push(`Failed to generate embedding for record ${record.id}`);
          errors++;
          continue;
        }

        // Update record with embedding
        const { error: updateError } = await supabaseAdmin
          .from(tableName)
          .update({ embedding: embedding })
          .eq('id', record.id);

        if (updateError) {
          console.error(`Database update failed for record ${record.id}:`, updateError);
          errorDetails.push(`Database update failed for record ${record.id}: ${updateError.message}`);
          errors++;
        } else {
          processed++;
        }

        // Rate limiting delay (smaller for test mode)
        await new Promise(resolve => setTimeout(resolve, testMode ? 50 : 200));
        
      } catch (recordError: any) {
        console.error(`Error processing record ${record.id}:`, recordError);
        errorDetails.push(`Record ${record.id}: ${recordError.message}`);
        errors++;
      }
    }

    const result = { 
      success: true, 
      processed, 
      errors,
      total: records.length,
      table: tableName,
      brgyid: brgyid || 'all',
      testMode: testMode || false,
      errorDetails: errorDetails.slice(0, 5), // Limit error details to first 5
      message: `Processed ${processed}/${records.length} records successfully${errors > 0 ? ` with ${errors} errors` : ''}`
    };

    console.log(`=== Completed embedding generation ===`);
    console.log(`Processed: ${processed}, Errors: ${errors}, Total: ${records.length}`);

    return new Response(JSON.stringify(result), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (e: any) {
    console.error('Generate embeddings function error:', e);
    return new Response(JSON.stringify({ 
      error: e.message,
      details: 'Check the function logs for more information'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});