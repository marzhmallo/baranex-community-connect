-- Fix search path security for the trigger function
CREATE OR REPLACE FUNCTION trigger_generate_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  -- Make an HTTP POST request to the generate-embeddings Edge Function
  -- Only process the specific record that was inserted/updated
  PERFORM net.http_post(
    url := 'https://dssjspakagyerrmtaakm.supabase.co/functions/v1/generate-embeddings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR1cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2pzcGFrYWd5ZXJybXRhYWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjYzMDgsImV4cCI6MjA2MzMwMjMwOH0.hObNRlCNKw18XZm6xq7dyubSpBSK9I4mHT1W6lGU5ys"}'::jsonb,
    body := jsonb_build_object(
      'tableName', TG_TABLE_NAME,
      'recordId', NEW.id,
      'brgyid', NEW.brgyid
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;