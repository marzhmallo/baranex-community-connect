-- Create a function that calls the generate-embeddings Edge Function for new records
CREATE OR REPLACE FUNCTION trigger_generate_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  -- Make an HTTP POST request to the generate-embeddings Edge Function
  -- Only process the specific record that was inserted/updated
  PERFORM net.http_post(
    url := 'https://dssjspakagyerrmtaakm.supabase.co/functions/v1/generate-embeddings',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzc2pzcGFrYWd5ZXJybXRhYWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjYzMDgsImV4cCI6MjA2MzMwMjMwOH0.hObNRlCNKw18XZm6xq7dyubSpBSK9I4mHT1W6lGU5ys"}'::jsonb,
    body := jsonb_build_object(
      'tableName', TG_TABLE_NAME,
      'recordId', NEW.id,
      'brgyid', NEW.brgyid
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Residents table triggers
CREATE OR REPLACE TRIGGER on_resident_insert_embedding
  AFTER INSERT ON residents
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL)
  EXECUTE FUNCTION trigger_generate_embeddings();

CREATE OR REPLACE TRIGGER on_resident_update_embedding
  AFTER UPDATE ON residents
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL OR (
    OLD.first_name IS DISTINCT FROM NEW.first_name OR 
    OLD.last_name IS DISTINCT FROM NEW.last_name OR
    OLD.purok IS DISTINCT FROM NEW.purok OR
    OLD.address IS DISTINCT FROM NEW.address
  ))
  EXECUTE FUNCTION trigger_generate_embeddings();

-- Announcements table triggers
CREATE OR REPLACE TRIGGER on_announcement_insert_embedding
  AFTER INSERT ON announcements
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL)
  EXECUTE FUNCTION trigger_generate_embeddings();

CREATE OR REPLACE TRIGGER on_announcement_update_embedding
  AFTER UPDATE ON announcements
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL OR (
    OLD.title IS DISTINCT FROM NEW.title OR 
    OLD.content IS DISTINCT FROM NEW.content OR
    OLD.category IS DISTINCT FROM NEW.category
  ))
  EXECUTE FUNCTION trigger_generate_embeddings();

-- Document requests table triggers
CREATE OR REPLACE TRIGGER on_docrequests_insert_embedding
  AFTER INSERT ON docrequests
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL)
  EXECUTE FUNCTION trigger_generate_embeddings();

CREATE OR REPLACE TRIGGER on_docrequests_update_embedding
  AFTER UPDATE ON docrequests
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL OR (
    OLD.type IS DISTINCT FROM NEW.type OR 
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.purpose IS DISTINCT FROM NEW.purpose
  ))
  EXECUTE FUNCTION trigger_generate_embeddings();

-- Events table triggers
CREATE OR REPLACE TRIGGER on_events_insert_embedding
  AFTER INSERT ON events
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL)
  EXECUTE FUNCTION trigger_generate_embeddings();

CREATE OR REPLACE TRIGGER on_events_update_embedding
  AFTER UPDATE ON events
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL OR (
    OLD.title IS DISTINCT FROM NEW.title OR 
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.location IS DISTINCT FROM NEW.location
  ))
  EXECUTE FUNCTION trigger_generate_embeddings();

-- Households table triggers
CREATE OR REPLACE TRIGGER on_households_insert_embedding
  AFTER INSERT ON households
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL)
  EXECUTE FUNCTION trigger_generate_embeddings();

CREATE OR REPLACE TRIGGER on_households_update_embedding
  AFTER UPDATE ON households
  FOR EACH ROW
  WHEN (NEW.embedding IS NULL OR (
    OLD.name IS DISTINCT FROM NEW.name OR 
    OLD.address IS DISTINCT FROM NEW.address OR
    OLD.purok IS DISTINCT FROM NEW.purok
  ))
  EXECUTE FUNCTION trigger_generate_embeddings();