# Phase 2: Backend API Development

## Overview
Create NestJS API endpoints for MBS search, item lookup, and AI-powered billing suggestions. Focus on performance, accuracy, and proper error handling. Timeline: Week 2.

## 1. API Architecture

### 1.1 Module Structure
**NestJS Module**: Create dedicated `mbs.module.ts` with proper dependency injection
**Service Layer**: Separate concerns - search, suggestions, data access
**Controller Layer**: REST endpoints with proper validation and documentation
**Integration Layer**: tRPC router for frontend consumption

### 1.2 Core Services Design

**MbsSearchService**:
- Handle text, semantic, and hybrid search modes
- Implement result ranking and relevance scoring
- Manage search filters (provider type, category, active status)
- Cache frequently searched terms

**MbsSuggestionService**:
- Orchestrate AI-powered suggestion pipeline
- Extract medical context from SOAP notes
- Apply business rules and compliance filters
- Generate confidence scores and explanations

**MbsDataService**:
- Direct database access layer
- Handle complex queries with raw SQL where needed
- Manage vector similarity operations
- Provide data validation utilities

## 2. Search Implementation

### 2.1 Search Types
**Text Search**:
- Use PostgreSQL full-text search with `tsvector`
- Rank results by `ts_rank` for relevance
- Support phrase queries and term highlighting
- Handle medical terminology and synonyms

**Semantic Search**:
- Generate query embeddings via OpenAI API
- Use pgvector cosine similarity for matching
- Return similarity scores as relevance metrics
- Optimize for medical context understanding

**Hybrid Search**:
- Combine text and semantic results with weighted scoring
- Deduplicate items found by both methods
- Boost scores for items found by multiple methods
- Provide best of both search approaches

### 2.2 Search Filters
**Provider Type Filtering**: GP, Specialist, or All providers
**Category Filtering**: By MBS category codes
**Status Filtering**: Active vs inactive items
**Fee Range Filtering**: Min/max schedule fee amounts

### 2.3 Performance Optimization
**Caching Strategy**: Cache search results for 30 seconds
**Pagination**: Limit results to prevent large response payloads  
**Query Optimization**: Use indexes effectively, avoid N+1 queries
**Rate Limiting**: 30 requests per minute per user

## 3. AI Suggestion Engine

### 3.1 Pipeline Architecture
**Step 1**: Extract medical context from SOAP note using OpenAI function calling
**Step 2**: Find candidate MBS items using hybrid search
**Step 3**: Apply business rules and compliance filters
**Step 4**: Generate explanations and confidence scores
**Step 5**: Rank and return top suggestions

### 3.2 Medical Context Extraction
**OpenAI Function Calling**:
- Define structured schema for medical concepts
- Extract: consultation type, procedures, conditions, complexity
- Handle: time spent, patient demographics, chronic conditions
- Classify: mental health elements, preventive care aspects

**Context Schema**:
```typescript
interface ExtractedContext {
  consultationType: 'routine' | 'urgent' | 'complex' | 'procedure' | 'mental_health'
  proceduresPerformed: string[]
  conditionsDiscussed: string[]
  complexityLevel: 'simple' | 'standard' | 'complex' | 'comprehensive'
  timeSpent?: number
  chronicConditions: string[]
  mentalHealthElements: string[]
  preventiveElements: string[]
}
```

### 3.3 Business Rules Engine
**Provider Restrictions**: Ensure GP items for GP consultations
**Complexity Matching**: Don't suggest expensive items for simple consultations
**Specialty Rules**: Mental health items only for appropriate consultations
**CDM Rules**: Chronic disease management items require chronic conditions
**Time-based Rules**: Consider consultation duration for item appropriateness

### 3.4 Confidence Scoring
**High Confidence (0.8+)**: Strong semantic match + business rules pass
**Medium Confidence (0.6-0.8)**: Good match with some uncertainty
**Low Confidence (<0.6)**: Possible match, needs human review
**Explanation Generation**: Use GPT to explain why each item was suggested

## 4. API Endpoints

### 4.1 Search Endpoint
**Route**: `GET /api/mbs/search`
**Parameters**: query, limit, searchType, providerType, category, includeInactive
**Response**: Array of search results with relevance scores
**Caching**: 30-second response cache
**Rate Limit**: 30 requests/minute

### 4.2 Item Detail Endpoint  
**Route**: `GET /api/mbs/item/:itemNumber`
**Response**: Complete MBS item information
**Caching**: 5-minute response cache
**Rate Limit**: 60 requests/minute

### 4.3 Suggestion Endpoint
**Route**: `POST /api/mbs/suggest`
**Body**: soapNote, consultationType, providerType, includeLowConfidence  
**Response**: Ranked suggestions with explanations and metadata
**No Caching**: Always generate fresh suggestions
**Rate Limit**: 10 requests/minute (more expensive)

### 4.4 Health Check Endpoint
**Route**: `GET /api/mbs/health`
**Response**: Service status and basic metrics
**Monitoring**: Used by load balancers and monitoring systems

## 5. Data Transfer Objects (DTOs)

### 5.1 Input Validation
**Search DTO**: Query length, enum validation, numeric limits
**Suggestion DTO**: SOAP note length (20-4000 chars), consultation type validation
**Parameter Validation**: Use class-validator decorators for automatic validation

### 5.2 Response Formatting
**Consistent Structure**: Standard response format with metadata
**Error Handling**: Proper HTTP status codes and error messages
**Currency Formatting**: Consistent decimal precision for fees
**Date Formatting**: ISO strings for all date fields

## 6. Error Handling & Resilience

### 6.1 Error Classification
**Validation Errors**: 400 status with field-specific messages
**Authentication Errors**: 401 status with clear messages
**Rate Limit Errors**: 429 status with retry information
**Service Errors**: 503 status for external service failures

### 6.2 Fallback Strategies
**OpenAI Failures**: Fall back to semantic search only
**Database Failures**: Return cached results if available
**Search Failures**: Provide manual search alternatives
**Partial Failures**: Return partial results with warnings

### 6.3 Circuit Breaker Pattern
**OpenAI API**: Break circuit after 5 consecutive failures
**Database**: Break circuit for connection failures
**Recovery**: Automatic recovery with exponential backoff

## 7. Integration Points

### 7.1 tRPC Router
**Type Safety**: Full TypeScript type inference from backend to frontend
**Query/Mutation Mapping**: Map REST endpoints to tRPC procedures
**Error Handling**: Proper TRPC error codes and messages
**Middleware**: Authentication and rate limiting middleware

### 7.2 Authentication Integration
**Better Auth**: Use existing JWT middleware
**User Context**: Extract user ID and tenant ID from tokens
**Row Level Security**: Ensure suggestion logs are tenant-isolated
**Permission Checks**: Validate user permissions for admin endpoints

### 7.3 Monitoring Integration
**Prometheus Metrics**: Request counts, durations, error rates
**Structured Logging**: Consistent log format for parsing
**Tracing**: Request tracing through the suggestion pipeline
**Health Metrics**: Service health and dependency status

## 8. Performance Optimization

### 8.1 Database Optimization
**Connection Pooling**: Proper pool sizing for concurrent requests
**Query Optimization**: Use EXPLAIN ANALYZE to optimize slow queries
**Index Usage**: Monitor index usage and add missing indexes
**Raw SQL**: Use raw SQL for complex vector operations

### 8.2 Caching Strategy
**Response Caching**: Cache search results and item details
**Query Caching**: Cache expensive database queries
**Embedding Caching**: Cache generated embeddings to avoid regeneration
**Cache Invalidation**: Clear cache when data updates

### 8.3 API Performance
**Response Compression**: Enable gzip compression
**Pagination**: Implement cursor-based pagination for large result sets
**Async Processing**: Use async/await throughout the pipeline
**Memory Management**: Monitor memory usage during suggestion generation

## 9. Security Considerations

### 9.1 Input Sanitization
**SQL Injection**: Use parameterized queries exclusively
**XSS Prevention**: Sanitize all user inputs
**SOAP Note Validation**: Check for malicious content
**File Upload Security**: Validate XML file uploads

### 9.2 Rate Limiting
**Per-User Limits**: Different limits for search vs suggestions
**Per-Tenant Limits**: Additional limits at tenant level
**IP-based Limits**: Prevent abuse from single IP addresses
**Graceful Degradation**: Queue requests when limits reached

### 9.3 Data Protection
**SOAP Note Handling**: Process in memory only, don't store full content
**Audit Logging**: Log only necessary information for compliance
**API Key Security**: Secure storage and rotation of OpenAI keys
**HTTPS Enforcement**: All endpoints require HTTPS

## 10. Testing Strategy

### 10.1 Unit Testing
**Service Tests**: Mock external dependencies, test business logic
**Controller Tests**: Test endpoint behavior and validation
**Error Handling**: Test all error scenarios and edge cases
**Performance Tests**: Test under various load conditions

### 10.2 Integration Testing
**Database Integration**: Test with real database operations
**OpenAI Integration**: Test with mock OpenAI responses
**Full Pipeline**: Test complete suggestion generation flow
**Authentication**: Test JWT validation and user context

### 10.3 Load Testing
**Concurrent Users**: Test 100+ simultaneous suggestion requests
**Database Load**: Test vector search under concurrent load
**Memory Usage**: Monitor memory usage during peak load
**Response Times**: Ensure P95 < 2 seconds for suggestions

## 11. Phase 2 Success Criteria

**Functional Success**:
- All API endpoints return accurate, relevant results
- AI suggestions show clear reasoning and appropriate confidence scores
- Search results match doctor expectations for medical terminology
- Error handling provides clear guidance for resolution

**Performance Success**:
- Search endpoints respond in <300ms P95
- Suggestion endpoint responds in <2000ms P95
- System handles 100 concurrent users without degradation
- Database queries optimized with proper index usage

**Quality Success**:
- Suggestion acceptance rate >25% in testing
- Search results ranked appropriately by relevance
- No false positives in business rule filtering
- Comprehensive test coverage >90% for core logic