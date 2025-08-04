-- Fix MBS schema by adding back the critical search columns that were dropped

-- First, let's try to install pgvector (may fail if not available)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Add back the tsv column for full-text search (if it doesn't exist)
ALTER TABLE mbs.items ADD COLUMN IF NOT EXISTS tsv TSVECTOR;

-- Add back the embedding column (using JSONB for now, will upgrade to vector type later)
ALTER TABLE mbs.items ADD COLUMN IF NOT EXISTS embedding JSONB;

-- Recreate the full-text search index (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_mbs_items_tsv ON mbs.items USING GIN(tsv);

-- Create index for embedding (GIN for JSONB, will upgrade to ivfflat later)
CREATE INDEX IF NOT EXISTS idx_mbs_items_embedding ON mbs.items USING GIN(embedding);

-- Recreate other important indexes that were dropped
CREATE INDEX IF NOT EXISTS idx_mbs_items_item_number ON mbs.items(item_number);
CREATE INDEX IF NOT EXISTS idx_mbs_items_category ON mbs.items(category);
CREATE INDEX IF NOT EXISTS idx_mbs_items_provider_type ON mbs.items(provider_type);
CREATE INDEX IF NOT EXISTS idx_mbs_items_active ON mbs.items(is_active);
CREATE INDEX IF NOT EXISTS idx_mbs_items_provider_active ON mbs.items(provider_type, is_active);
CREATE INDEX IF NOT EXISTS idx_mbs_items_category_active ON mbs.items(category, is_active);

-- Recreate ingestion log indexes
CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_file_hash ON mbs.ingestion_log(file_hash);
CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_status ON mbs.ingestion_log(status);
CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_started_at ON mbs.ingestion_log(started_at);

-- Recreate suggestions indexes
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_tenant_id ON mbs.suggestions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_user_id ON mbs.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_item_number ON mbs.suggestions(item_number);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_status ON mbs.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_created_at ON mbs.suggestions(created_at);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_tenant_status ON mbs.suggestions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_user_status ON mbs.suggestions(user_id, status);

-- Recreate the function to update tsv automatically
CREATE OR REPLACE FUNCTION mbs.update_item_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tsv := to_tsvector('english', 
        COALESCE(NEW.item_number::text, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.short_description, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.group_name, '') || ' ' ||
        COALESCE(NEW.service_type, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to automatically update tsv on insert/update
DROP TRIGGER IF EXISTS trigger_mbs_items_update_tsv ON mbs.items;
CREATE TRIGGER trigger_mbs_items_update_tsv
    BEFORE INSERT OR UPDATE ON mbs.items
    FOR EACH ROW
    EXECUTE FUNCTION mbs.update_item_tsv();

-- Update existing rows to populate tsv column
UPDATE mbs.items SET tsv = to_tsvector('english', 
    COALESCE(item_number::text, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(short_description, '') || ' ' ||
    COALESCE(category, '') || ' ' ||
    COALESCE(group_name, '') || ' ' ||
    COALESCE(service_type, '')
) WHERE tsv IS NULL;