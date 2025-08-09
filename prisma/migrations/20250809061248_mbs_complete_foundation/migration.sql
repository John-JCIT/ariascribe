-- ============================================================================
-- MBS Complete Foundation Migration
-- ============================================================================
-- This migration creates the complete MBS (Medicare Benefits Schedule) schema
-- with all tables, indexes, triggers, and security policies.
-- 
-- Features:
-- - Full-text search with TSVECTOR and automatic trigger updates
-- - Vector embeddings support (JSONB for now, upgradeable to pgvector)
-- - Row-level security for multi-tenant isolation
-- - Comprehensive indexing for performance
-- - Audit trail for data ingestion
-- ============================================================================

-- Create MBS schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS mbs;

-- Enable necessary extensions (commented out - install separately if needed)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- MBS TABLES - Create all MBS tables
-- ============================================================================

-- Create MBS Items table
CREATE TABLE IF NOT EXISTS mbs.items (
    id SERIAL PRIMARY KEY,
    item_number INTEGER NOT NULL UNIQUE,
    
    -- Basic item information
    description TEXT NOT NULL,
    short_description TEXT,
    category VARCHAR(10),
    sub_category VARCHAR(10),
    group_name TEXT,
    sub_group TEXT,
    
    -- Provider and service type
    provider_type VARCHAR(10), -- G=GP, S=Specialist, AD=Dental, etc.
    service_type VARCHAR(50),
    
    -- Fee information
    schedule_fee DECIMAL(10,2),
    benefit_75 DECIMAL(10,2),
    benefit_85 DECIMAL(10,2),
    benefit_100 DECIMAL(10,2),
    
    -- Anaesthetic information
    has_anaesthetic BOOLEAN NOT NULL DEFAULT FALSE,
    anaesthetic_basic_units INTEGER,
    
    -- Derived fee information
    derived_fee_description TEXT,
    
    -- Status and validity
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_new_item BOOLEAN NOT NULL DEFAULT FALSE,
    item_start_date DATE,
    item_end_date DATE,
    
    -- Search and AI fields
    tsv TSVECTOR, -- Full-text search vector
    embedding JSONB, -- OpenAI text-embedding-3-large dimensions
    
    -- Metadata
    raw_xml_data JSONB, -- Store original XML for reprocessing
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create MBS Ingestion Log table
CREATE TABLE IF NOT EXISTS mbs.ingestion_log (
    id SERIAL PRIMARY KEY,
    
    -- File information
    file_name TEXT,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for change detection
    file_size_bytes BIGINT,
    
    -- Processing information
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'processing', -- processing, completed, failed
    
    -- Results
    items_processed INTEGER NOT NULL DEFAULT 0,
    items_inserted INTEGER NOT NULL DEFAULT 0,
    items_updated INTEGER NOT NULL DEFAULT 0,
    items_failed INTEGER NOT NULL DEFAULT 0,
    
    -- Performance metrics
    processing_time_ms INTEGER,
    embedding_time_ms INTEGER,
    
    -- Error information
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    processor_version VARCHAR(50),
    openai_model VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-large'
);

-- Create MBS Suggestions table
CREATE TABLE IF NOT EXISTS mbs.suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant isolation (RLS will be applied)
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    consultation_id TEXT, -- Link to consultation if available
    
    -- Suggestion context
    soap_excerpt TEXT, -- First 500 chars for audit (no PHI)
    consultation_type VARCHAR(50), -- standard, complex, mental_health, etc.
    
    -- Suggested item
    item_number INTEGER NOT NULL,
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    reasoning TEXT,
    matched_concepts TEXT[], -- Array of medical concepts matched
    
    -- User interaction
    status VARCHAR(20) NOT NULL DEFAULT 'suggested', -- suggested, accepted, dismissed, viewed
    user_action_at TIMESTAMP WITH TIME ZONE,
    
    -- AI metadata
    model_used VARCHAR(50),
    processing_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE mbs.suggestions ADD CONSTRAINT suggestions_item_number_fkey 
    FOREIGN KEY (item_number) REFERENCES mbs.items(item_number) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- FULL-TEXT SEARCH TRIGGER FUNCTION
-- ============================================================================

-- Create or replace the TSV update function
CREATE OR REPLACE FUNCTION mbs.update_item_tsv()
RETURNS TRIGGER AS $$
BEGIN
    -- Build full-text search vector from key fields
    NEW.tsv := to_tsvector('english', 
        COALESCE(NEW.item_number::text, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.short_description, '') || ' ' ||
        COALESCE(NEW.category, '') || ' ' ||
        COALESCE(NEW.sub_category, '') || ' ' ||
        COALESCE(NEW.group_name, '') || ' ' ||
        COALESCE(NEW.sub_group, '') || ' ' ||
        COALESCE(NEW.provider_type, '') || ' ' ||
        COALESCE(NEW.service_type, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic TSV updates
DROP TRIGGER IF EXISTS update_item_tsv_trigger ON mbs.items;
CREATE TRIGGER update_item_tsv_trigger
    BEFORE INSERT OR UPDATE ON mbs.items
    FOR EACH ROW
    EXECUTE FUNCTION mbs.update_item_tsv();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search index (GIN for TSVECTOR)
CREATE INDEX IF NOT EXISTS idx_mbs_items_tsv ON mbs.items USING GIN(tsv);

-- Vector embedding index (GIN for JSONB, will upgrade to IVFFlat later)
CREATE INDEX IF NOT EXISTS idx_mbs_items_embedding ON mbs.items USING GIN(embedding);

-- Primary business logic indexes
CREATE INDEX IF NOT EXISTS idx_mbs_items_item_number ON mbs.items(item_number);
CREATE INDEX IF NOT EXISTS idx_mbs_items_category ON mbs.items(category);
CREATE INDEX IF NOT EXISTS idx_mbs_items_provider_type ON mbs.items(provider_type);
CREATE INDEX IF NOT EXISTS idx_mbs_items_active ON mbs.items(is_active);
CREATE INDEX IF NOT EXISTS idx_mbs_items_service_type ON mbs.items(service_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_mbs_items_provider_active ON mbs.items(provider_type, is_active);
CREATE INDEX IF NOT EXISTS idx_mbs_items_category_active ON mbs.items(category, is_active);
CREATE INDEX IF NOT EXISTS idx_mbs_items_category_provider ON mbs.items(category, provider_type);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_mbs_items_dates ON mbs.items(item_start_date, item_end_date);

-- ============================================================================
-- INGESTION LOG INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_file_hash ON mbs.ingestion_log(file_hash);
CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_status ON mbs.ingestion_log(status);
CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_started_at ON mbs.ingestion_log(started_at);
CREATE INDEX IF NOT EXISTS idx_mbs_ingestion_log_completed_at ON mbs.ingestion_log(completed_at);

-- ============================================================================
-- SUGGESTIONS INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_tenant_id ON mbs.suggestions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_user_id ON mbs.suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_item_number ON mbs.suggestions(item_number);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_status ON mbs.suggestions(status);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_created_at ON mbs.suggestions(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_tenant_status ON mbs.suggestions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_user_status ON mbs.suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mbs_suggestions_tenant_created ON mbs.suggestions(tenant_id, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on suggestions table for multi-tenant isolation
ALTER TABLE mbs.suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
DROP POLICY IF EXISTS mbs_suggestions_tenant_isolation ON mbs.suggestions;
CREATE POLICY mbs_suggestions_tenant_isolation ON mbs.suggestions
    FOR ALL
    TO PUBLIC
    USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- SECURITY GRANTS
-- ============================================================================

-- Grant appropriate permissions to application role (if it exists)
-- Note: This assumes an 'ariascribe' role exists, adjust as needed
DO $$
BEGIN
    -- Check if role exists before granting permissions
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ariascribe') THEN
        GRANT USAGE ON SCHEMA mbs TO ariascribe;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mbs TO ariascribe;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mbs TO ariascribe;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA mbs TO ariascribe;
    END IF;
END $$;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to search MBS items by text
CREATE OR REPLACE FUNCTION mbs.search_items(
    search_query text,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    item_number integer,
    description text,
    short_description text,
    category varchar(10),
    provider_type varchar(10),
    schedule_fee decimal(10,2),
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.item_number,
        i.description,
        i.short_description,
        i.category,
        i.provider_type,
        i.schedule_fee,
        ts_rank(i.tsv, plainto_tsquery('english', search_query)) as rank
    FROM mbs.items i
    WHERE i.tsv @@ plainto_tsquery('english', search_query)
      AND i.is_active = true
    ORDER BY rank DESC, i.item_number
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get item suggestions for a tenant
CREATE OR REPLACE FUNCTION mbs.get_tenant_suggestions(
    p_tenant_id text,
    p_status text DEFAULT 'suggested',
    p_limit integer DEFAULT 50
)
RETURNS TABLE(
    suggestion_id uuid,
    item_number integer,
    confidence decimal(3,2),
    reasoning text,
    created_at timestamptz,
    item_description text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as suggestion_id,
        s.item_number,
        s.confidence,
        s.reasoning,
        s.created_at,
        i.description as item_description
    FROM mbs.suggestions s
    JOIN mbs.items i ON s.item_number = i.item_number
    WHERE s.tenant_id = p_tenant_id
      AND (p_status IS NULL OR s.status = p_status)
    ORDER BY s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE EXISTING DATA
-- ============================================================================

-- Update TSV for any existing items (if any)
UPDATE mbs.items SET last_updated = last_updated WHERE true;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration completion
COMMENT ON SCHEMA mbs IS 'MBS (Medicare Benefits Schedule) schema - Complete foundation with search, embeddings, and security. Created by migration 20250809061248_mbs_complete_foundation';
