-- Enable pgvector extension for semantic search
-- Note: pgvector extension will be installed separately
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create dedicated MBS schema
CREATE SCHEMA IF NOT EXISTS mbs;

-- Set search path to include mbs schema
-- ALTER DATABASE ariascribedev SET search_path TO public, mbs;

-- MBS Items table - Primary table for all MBS item data
CREATE TABLE mbs.items (
    id SERIAL PRIMARY KEY,
    item_number INTEGER NOT NULL UNIQUE,
    
    -- Basic item information
    description TEXT NOT NULL,
    short_description TEXT,
    category VARCHAR(10),
    sub_category VARCHAR(10),
    group_name VARCHAR(255),
    sub_group VARCHAR(255),
    
    -- Provider and service type
    provider_type VARCHAR(10), -- G=GP, S=Specialist, AD=Dental, etc.
    service_type VARCHAR(50),
    
    -- Fee information
    schedule_fee DECIMAL(10,2),
    benefit_75 DECIMAL(10,2),
    benefit_85 DECIMAL(10,2),
    benefit_100 DECIMAL(10,2),
    
    -- Anaesthetic information
    has_anaesthetic BOOLEAN DEFAULT FALSE,
    anaesthetic_basic_units INTEGER,
    
    -- Derived fee information
    derived_fee_description TEXT,
    
    -- Status and validity
    is_active BOOLEAN DEFAULT TRUE,
    is_new_item BOOLEAN DEFAULT FALSE,
    item_start_date DATE,
    item_end_date DATE,
    
    -- Search and AI fields
    tsv TSVECTOR, -- Full-text search vector
    embedding JSONB, -- OpenAI text-embedding-3-large dimensions (stored as JSON for now)
    
    -- Metadata
    raw_xml_data JSONB, -- Store original XML for reprocessing
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MBS Ingestion Log - Audit trail for XML processing
CREATE TABLE mbs.ingestion_log (
    id SERIAL PRIMARY KEY,
    
    -- File information
    file_name VARCHAR(255),
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for change detection
    file_size_bytes BIGINT,
    
    -- Processing information
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
    
    -- Results
    items_processed INTEGER DEFAULT 0,
    items_inserted INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    
    -- Performance metrics
    processing_time_ms INTEGER,
    embedding_time_ms INTEGER,
    
    -- Error information
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    processor_version VARCHAR(50),
    openai_model VARCHAR(50) DEFAULT 'text-embedding-3-large'
);

-- MBS Suggestions - User interactions and AI suggestions
CREATE TABLE mbs.suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant isolation (RLS will be applied)
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    consultation_id TEXT, -- Link to consultation if available
    
    -- Suggestion context
    soap_excerpt TEXT, -- First 500 chars for audit (no PHI)
    consultation_type VARCHAR(50), -- standard, complex, mental_health, etc.
    
    -- Suggested item
    item_number INTEGER NOT NULL REFERENCES mbs.items(item_number),
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    reasoning TEXT,
    matched_concepts TEXT[], -- Array of medical concepts matched
    
    -- User interaction
    status VARCHAR(20) DEFAULT 'suggested', -- suggested, accepted, dismissed, viewed
    user_action_at TIMESTAMP WITH TIME ZONE,
    
    -- AI metadata
    model_used VARCHAR(50),
    processing_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance

-- Primary search indexes
CREATE INDEX idx_mbs_items_item_number ON mbs.items(item_number);
CREATE INDEX idx_mbs_items_category ON mbs.items(category);
CREATE INDEX idx_mbs_items_provider_type ON mbs.items(provider_type);
CREATE INDEX idx_mbs_items_active ON mbs.items(is_active);

-- Composite indexes for common queries
CREATE INDEX idx_mbs_items_provider_active ON mbs.items(provider_type, is_active);
CREATE INDEX idx_mbs_items_category_active ON mbs.items(category, is_active);

-- Full-text search index
CREATE INDEX idx_mbs_items_tsv ON mbs.items USING GIN(tsv);

-- Vector similarity index (will be added when pgvector is available)
-- CREATE INDEX idx_mbs_items_embedding ON mbs.items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_mbs_items_embedding ON mbs.items USING GIN(embedding);

-- Ingestion log indexes
CREATE INDEX idx_mbs_ingestion_log_file_hash ON mbs.ingestion_log(file_hash);
CREATE INDEX idx_mbs_ingestion_log_status ON mbs.ingestion_log(status);
CREATE INDEX idx_mbs_ingestion_log_started_at ON mbs.ingestion_log(started_at);

-- Suggestions indexes
CREATE INDEX idx_mbs_suggestions_tenant_id ON mbs.suggestions(tenant_id);
CREATE INDEX idx_mbs_suggestions_user_id ON mbs.suggestions(user_id);
CREATE INDEX idx_mbs_suggestions_item_number ON mbs.suggestions(item_number);
CREATE INDEX idx_mbs_suggestions_status ON mbs.suggestions(status);
CREATE INDEX idx_mbs_suggestions_created_at ON mbs.suggestions(created_at);

-- Composite indexes for suggestions
CREATE INDEX idx_mbs_suggestions_tenant_status ON mbs.suggestions(tenant_id, status);
CREATE INDEX idx_mbs_suggestions_user_status ON mbs.suggestions(user_id, status);

-- Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE mbs.suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access suggestions from their tenant
CREATE POLICY mbs_suggestions_tenant_isolation ON mbs.suggestions
    FOR ALL
    TO PUBLIC
    USING (tenant_id = current_setting('app.tenant_id', true));

-- Grant permissions to application role
-- Note: Adjust role name based on your database setup
GRANT USAGE ON SCHEMA mbs TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mbs TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mbs TO PUBLIC;

-- Function to update tsv automatically
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

-- Trigger to automatically update tsv on insert/update
CREATE TRIGGER trigger_mbs_items_update_tsv
    BEFORE INSERT OR UPDATE ON mbs.items
    FOR EACH ROW
    EXECUTE FUNCTION mbs.update_item_tsv();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION mbs.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for suggestions updated_at
CREATE TRIGGER trigger_mbs_suggestions_updated_at
    BEFORE UPDATE ON mbs.suggestions
    FOR EACH ROW
    EXECUTE FUNCTION mbs.update_updated_at();