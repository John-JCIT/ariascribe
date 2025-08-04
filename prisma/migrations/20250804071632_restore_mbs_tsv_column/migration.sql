-- Restore TSV column and trigger that were incorrectly removed
-- The TSV column is essential for full-text search functionality

-- Add back the TSV column to the items table
ALTER TABLE "mbs"."items" ADD COLUMN "tsv" TSVECTOR;

-- Recreate the trigger function for automatic TSV updates
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

-- Recreate the trigger
CREATE TRIGGER update_item_tsv_trigger
    BEFORE INSERT OR UPDATE ON mbs.items
    FOR EACH ROW
    EXECUTE FUNCTION mbs.update_item_tsv();

-- Create index for TSV search performance
CREATE INDEX IF NOT EXISTS idx_mbs_items_tsv ON mbs.items USING GIN(tsv);