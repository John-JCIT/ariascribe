# Phase 1: Database Foundation & Data Pipeline

## Overview
Establish PostgreSQL schema, XML ingestion pipeline, and embedding generation for the MBS Billing Assistant MVP. Focus on performance and data integrity. Timeline: Week 1.

## 1. Database Schema Design

### 1.1 Schema Strategy
**New Schema**: Create dedicated `mbs` schema to isolate MBS data from core application
**Extensions Required**: Enable `pgvector` extension for semantic search capabilities
**Multi-schema Prisma**: Update Prisma configuration to handle both `public` and `mbs` schemas

### 1.2 Core Tables Design

**mbs.items** (Primary table):
- Store all MBS item data with full XML field mapping
- Include computed fields: `tsv` (full-text search) and `embedding` (semantic search)
- Handle temporal data: validity dates, change tracking
- Store raw XML as JSONB backup for reprocessing
- Support both active and historical items

**mbs.ingestion_log** (Audit trail):
- Track each XML ingestion: file hash, processing time, item counts
- Enable change detection and rollback capability
- Monitor processing performance and failures

**mbs.suggestions** (User interactions):
- Log all AI suggestions made to users
- Track user actions: accepted, dismissed, viewed
- Enable compliance reporting and analytics
- Row-level security for multi-tenant isolation

### 1.3 Indexing Strategy
**Performance Indexes**:
- GIN index on `tsv` for full-text search
- IVFFlat index on `embedding` for vector similarity
- B-tree indexes on frequently queried fields (item_number, category, provider_type)
- Composite indexes for common filter combinations

**Index Configuration**:
- Vector index: Start with 100 lists (adjust based on data size)
- Consider cosine distance for medical terminology similarity
- Monitor index usage and optimize based on query patterns

## 2. XML Ingestion Pipeline

### 2.1 Worker Service Architecture
**New NestJS App**: Create `/apps/worker-mbs` for background processing
**BullMQ Integration**: Handle XML processing as background jobs
**Scheduled Jobs**: Set up cron-like scheduling for periodic updates

### 2.2 XML Processing Strategy
**File Handling**:
- Manual upload initially (XML location changes frequently)
- File hash comparison to detect changes
- Atomic processing with rollback capability

**Data Transformation**:
- Map XML fields to database schema (handle all field types per MBS documentation)
- Date parsing: Convert DD.MM.YYYY format to PostgreSQL dates
- Decimal handling: Parse fee amounts with proper precision
- Boolean conversion: Y/N to proper boolean values

**Error Handling**:
- Validate XML structure before processing
- Skip malformed items with detailed logging
- Continue processing despite individual item failures
- Comprehensive error reporting for debugging

### 2.3 Embedding Generation
**OpenAI Integration**:
- Use `text-embedding-3-large` (3072 dimensions) for medical accuracy
- Embed combined text: "MBS Item {number}: {description}"
- Batch processing to optimize API calls
- Implement retry logic for API failures

**Performance Optimization**:
- Process in batches of 100 items
- Implement exponential backoff for rate limits
- Cache embeddings to avoid regeneration
- Monitor token usage and costs

## 3. Data Processing Workflow

### 3.1 Ingestion Process
**Step 1**: Validate XML file and generate hash
**Step 2**: Parse XML and validate required fields
**Step 3**: Transform data to database format
**Step 4**: Generate embeddings for descriptions
**Step 5**: Create full-text search vectors
**Step 6**: Upsert data with conflict resolution
**Step 7**: Log ingestion results and performance

### 3.2 Business Logic Rules
**Item Deduplication**: Use item_number as primary key, handle updates vs inserts
**Date Handling**: Respect validity periods, mark expired items
**Change Detection**: Compare with existing data to identify modifications
**Data Integrity**: Ensure referential integrity and constraint validation

### 3.3 Performance Considerations
**Bulk Operations**: Use batch inserts/updates for efficiency
**Transaction Management**: Wrap ingestion in database transactions
**Memory Management**: Process large XML files in streaming fashion
**Monitoring**: Track processing time, memory usage, success rates

## 4. Prisma Integration

### 4.1 Schema Configuration
**Multi-schema Setup**: Configure Prisma for both public and mbs schemas
**Vector Type Handling**: Use raw SQL for vector operations (Prisma limitation)
**Custom Field Mapping**: Map XML fields to appropriate Prisma model properties

### 4.2 Model Definitions
**Key Models**: MbsItem, MbsIngestionLog, MbsSuggestion
**Relationships**: Define foreign keys and relations where applicable
**Validation**: Add appropriate constraints and validation rules

### 4.3 Migration Strategy
**Version Control**: All schema changes through Prisma migrations
**Rollback Plan**: Ensure migrations can be safely reverted
**Data Migration**: Handle existing data during schema updates

## 5. Testing & Validation

### 5.1 Unit Testing Requirements
**XML Parser Tests**:
- Valid XML parsing with all field types
- Malformed XML handling
- Edge cases: missing fields, invalid dates, special characters

**Database Tests**:
- CRUD operations for all models
- Vector similarity search accuracy
- Full-text search relevance
- Performance under load

### 5.2 Integration Testing
**End-to-End Ingestion**: Test complete XML-to-database pipeline
**Performance Testing**: Measure ingestion time for full MBS dataset
**Error Recovery**: Test failure scenarios and recovery mechanisms

### 5.3 Data Validation
**Accuracy Checks**: Compare ingested data with source XML
**Completeness**: Ensure all items are processed
**Search Quality**: Validate search results relevance

## 6. Monitoring & Observability

### 6.1 Metrics Collection
**Processing Metrics**: Ingestion time, items processed, success/failure rates
**Performance Metrics**: Database query times, embedding generation speed
**Business Metrics**: Data freshness, search usage patterns

### 6.2 Logging Strategy
**Structured Logging**: Use consistent log format for parsing
**Error Tracking**: Detailed error information for debugging
**Audit Trail**: Track all data modifications for compliance

### 6.3 Health Checks
**Data Freshness**: Alert when XML data becomes stale
**Service Health**: Monitor worker service status
**Database Performance**: Track query performance degradation

## 7. Configuration & Environment

### 7.1 Environment Variables
**Database**: Connection strings, pool sizes
**OpenAI**: API keys, model configurations
**Processing**: Batch sizes, retry limits, timeouts

### 7.2 Feature Flags
**Ingestion Control**: Enable/disable automatic processing
**Model Selection**: Switch between embedding models
**Performance Tuning**: Adjust batch sizes and timeouts

## 8. Phase 1 Success Criteria

**Technical Success**:
- Complete MBS dataset (5,600+ items) ingested successfully
- Vector similarity search returns relevant results
- Full-text search performs under 100ms for common queries
- All database indexes optimized for expected query patterns

**Performance Success**:
- XML ingestion completes in under 5 minutes
- Embedding generation handles full dataset in under 30 minutes
- Database can handle 100+ concurrent search queries
- Memory usage remains stable during processing

**Quality Success**:
- Search results match manual MBS lookups
- No data corruption or loss during ingestion
- All edge cases handled gracefully
- Comprehensive logging and monitoring in place