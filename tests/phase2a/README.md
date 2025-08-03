# Phase 2A Test Suite

This directory contains tests for the Phase 2A Standalone Clinical Mode implementation.

## Test Files

- **`test-phase2a.ts`** - Comprehensive test suite that validates the entire Phase 2A implementation
- **`simple-test.ts`** - Basic database connectivity and tenant creation test
- **`debug-test.ts`** - Debug utilities for troubleshooting database issues
- **`check-schema.ts`** - Database schema inspection utility

## Running Tests

From the project root:

```bash
# Run the comprehensive Phase 2A test
bun run tests/phase2a/test-phase2a.ts

# Run basic connectivity test
bun run tests/phase2a/simple-test.ts

# Check database schema
bun run tests/phase2a/check-schema.ts
```

## What These Tests Validate

### Phase 2A Implementation Test (`test-phase2a.ts`)

✅ Database connectivity  
✅ Tenant creation and configuration  
✅ DataStore abstraction layer  
✅ Patient management (CRUD operations)  
✅ Patient search functionality  
✅ Consultation workflow  
✅ Clinical notes creation  
✅ Dashboard statistics  
✅ EHR service factory  
✅ Connection status  
✅ Data cleanup  

### Test Results

When all tests pass, you should see:

```
🎉 All Phase 2A tests passed successfully!
✅ Database schema is working
✅ RLS policies are in place
✅ DataStore abstraction is functional
✅ EHR service factory is working
✅ CRUD operations are successful
```

## Prerequisites

- PostgreSQL database running and accessible
- Environment variables configured (`.env` file)
- Prisma migrations applied (`bun run db:migrate deploy`)
- Prisma client generated (`bun run prisma generate`)

## Troubleshooting

If tests fail:

1. Check database connectivity with `check-schema.ts`
2. Verify migrations are applied: `bun run db:migrate status`
3. Regenerate Prisma client: `bun run prisma generate`
4. Check for RLS policy issues in the audit triggers

## Notes

- Tests create and clean up their own data
- Each test run uses unique tenant and patient IDs
- Audit triggers are temporarily disabled for testing
- Tests use the same database as development (be careful!)