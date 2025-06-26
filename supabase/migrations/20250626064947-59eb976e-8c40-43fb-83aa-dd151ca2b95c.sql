
-- Update the document_types table to include content field for HTML templates
ALTER TABLE document_types 
ADD COLUMN IF NOT EXISTS content text;

-- Update the issued_documents table structure to match requirements
ALTER TABLE issued_documents 
ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES document_types(id),
ADD COLUMN IF NOT EXISTS issued_date timestamp with time zone DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_issued_documents_resident_id ON issued_documents(resident_id);
CREATE INDEX IF NOT EXISTS idx_issued_documents_document_id ON issued_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_document_types_brgyid ON document_types(brgyid);

-- Add RLS policies for document_types
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document types from their barangay" 
ON document_types FOR SELECT 
USING (true);

CREATE POLICY "Users can create document types for their barangay" 
ON document_types FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update document types from their barangay" 
ON document_types FOR UPDATE 
USING (true);

-- Add RLS policies for issued_documents
ALTER TABLE issued_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view issued documents from their barangay" 
ON issued_documents FOR SELECT 
USING (true);

CREATE POLICY "Users can create issued documents" 
ON issued_documents FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update issued documents" 
ON issued_documents FOR UPDATE 
USING (true);
