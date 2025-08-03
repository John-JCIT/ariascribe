/**
 * DataStore Service Locator for Phase 2A
 * 
 * This module provides factory functions to create the appropriate DataStore
 * implementation based on tenant configuration. It handles both shared and
 * dedicated database scenarios.
 */

import type { DataStore, TenantConfig } from './types';
import { SharedPostgresStore } from './SharedPostgresStore';
import { db } from '@/server/db';
import { PrismaClient } from '@/generated/prisma';

// ============================================================================
// CONNECTION POOL MANAGER
// ============================================================================

/**
 * Configuration for Prisma client cache
 */
const CACHE_CONFIG = {
  MAX_SIZE: 50, // Maximum number of cached clients
  TTL_MS: 30 * 60 * 1000, // 30 minutes TTL
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Cleanup every 5 minutes
  HEALTH_CHECK_INTERVAL_MS: 10 * 60 * 1000, // Health check every 10 minutes
} as const;

/**
 * Enhanced cache entry with metadata for TTL and health tracking
 */
interface CacheEntry {
  client: PrismaClient;
  createdAt: number;
  lastUsedAt: number;
  connectionUri: string;
  isHealthy: boolean;
}

/**
 * Enhanced cache for Prisma clients with size limits, TTL, and health checks
 * Key: connection URI, Value: CacheEntry with metadata
 */
const prismaClientCache = new Map<string, CacheEntry>();

/**
 * Cleanup interval reference for proper cleanup on shutdown
 */
let cleanupInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Check if a cache entry is expired based on TTL
 */
function isEntryExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.lastUsedAt > CACHE_CONFIG.TTL_MS;
}

/**
 * Perform health check on a Prisma client
 */
async function isClientHealthy(client: PrismaClient): Promise<boolean> {
  try {
    // Simple query to test connection health
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Prisma client health check failed:', error);
    return false;
  }
}

/**
 * Remove expired or unhealthy entries from cache
 */
async function cleanupCache(): Promise<void> {
  const entriesToRemove: string[] = [];

  for (const [uri, entry] of prismaClientCache.entries()) {
    // Check if entry is expired or marked as unhealthy
    if (isEntryExpired(entry) || !entry.isHealthy) {
      entriesToRemove.push(uri);
    }
  }

  // Remove and disconnect expired/unhealthy clients
  for (const uri of entriesToRemove) {
    const entry = prismaClientCache.get(uri);
    if (entry) {
      prismaClientCache.delete(uri);
      try {
        await entry.client.$disconnect();
        console.log(`Cleaned up ${isEntryExpired(entry) ? 'expired' : 'unhealthy'} Prisma client for: ${uri}`);
      } catch (error) {
        console.error(`Error disconnecting client during cleanup for ${uri}:`, error);
      }
    }
  }
}

/**
 * Perform health checks on all cached clients
 */
async function performHealthChecks(): Promise<void> {
  const healthCheckPromises = Array.from(prismaClientCache.entries()).map(async ([uri, entry]) => {
    const isHealthy = await isClientHealthy(entry.client);
    entry.isHealthy = isHealthy;
    
    if (!isHealthy) {
      console.warn(`Prisma client marked as unhealthy: ${uri}`);
    }
  });

  await Promise.allSettled(healthCheckPromises);
}

/**
 * Evict least recently used entry when cache is at capacity
 */
async function evictLRU(): Promise<void> {
  if (prismaClientCache.size === 0) return;

  // Find the least recently used entry
  let oldestEntry: [string, CacheEntry] | null = null;
  let oldestTime = Date.now();

  for (const [uri, entry] of prismaClientCache.entries()) {
    if (entry.lastUsedAt < oldestTime) {
      oldestTime = entry.lastUsedAt;
      oldestEntry = [uri, entry];
    }
  }

  if (oldestEntry) {
    const [uri, entry] = oldestEntry;
    prismaClientCache.delete(uri);
    try {
      await entry.client.$disconnect();
      console.log(`Evicted LRU Prisma client for: ${uri}`);
    } catch (error) {
      console.error(`Error disconnecting evicted client for ${uri}:`, error);
    }
  }
}

/**
 * Initialize periodic cleanup and health check intervals
 */
function initializePeriodicTasks(): void {
  cleanupInterval ??= setInterval(() => {
    cleanupCache().catch(error => 
      console.error('Error during periodic cache cleanup:', error)
    );
  }, CACHE_CONFIG.CLEANUP_INTERVAL_MS);

  healthCheckInterval ??= setInterval(() => {
    performHealthChecks().catch(error => 
      console.error('Error during periodic health checks:', error)
    );
  }, CACHE_CONFIG.HEALTH_CHECK_INTERVAL_MS);
}

/**
 * Get or create a cached Prisma client for the given connection URI
 * Now includes cache size limits, TTL, and health tracking
 */
function getCachedPrismaClient(connectionUri: string): PrismaClient {
  // Initialize periodic tasks on first use
  initializePeriodicTasks();

  // Check if we already have a client for this connection URI
  const existingEntry = prismaClientCache.get(connectionUri);
  if (existingEntry && !isEntryExpired(existingEntry) && existingEntry.isHealthy) {
    // Update last used timestamp
    existingEntry.lastUsedAt = Date.now();
    return existingEntry.client;
  }

  // Remove expired or unhealthy entry if it exists
  if (existingEntry) {
    prismaClientCache.delete(connectionUri);
    existingEntry.client.$disconnect().catch(error => 
      console.error(`Error disconnecting expired/unhealthy client for ${connectionUri}:`, error)
    );
  }

  // Check if we need to evict an entry due to size limit
  if (prismaClientCache.size >= CACHE_CONFIG.MAX_SIZE) {
    evictLRU().catch(error => 
      console.error('Error during LRU eviction:', error)
    );
  }

  // Create a new client and cache it
  const newClient = new PrismaClient({
    datasources: {
      db: {
        url: connectionUri,
      },
    },
  });

  const now = Date.now();
  const newEntry: CacheEntry = {
    client: newClient,
    createdAt: now,
    lastUsedAt: now,
    connectionUri,
    isHealthy: true,
  };

  prismaClientCache.set(connectionUri, newEntry);
  return newClient;
}

/**
 * Cleanup function to disconnect all cached Prisma clients
 * Should be called during application shutdown
 */
export async function disconnectAllClients(): Promise<void> {
  // Clear periodic intervals
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  // Disconnect all clients
  const disconnectPromises = Array.from(prismaClientCache.values()).map(entry => 
    entry.client.$disconnect().catch(error => 
      console.error('Error disconnecting Prisma client:', error)
    )
  );
  
  await Promise.all(disconnectPromises);
  prismaClientCache.clear();
}

/**
 * Remove a specific client from cache and disconnect it
 * Useful for handling connection errors or tenant cleanup
 */
export async function disconnectTenantClient(connectionUri: string): Promise<void> {
  const entry = prismaClientCache.get(connectionUri);
  if (entry) {
    prismaClientCache.delete(connectionUri);
    try {
      await entry.client.$disconnect();
    } catch (error) {
      console.error(`Error disconnecting client for ${connectionUri}:`, error);
    }
  }
}

/**
 * Get cache statistics for monitoring and debugging
 */
export function getCacheStats() {
  const now = Date.now();
  const entries = Array.from(prismaClientCache.values());
  
  const stats = {
    totalClients: entries.length,
    maxSize: CACHE_CONFIG.MAX_SIZE,
    healthyClients: entries.filter(entry => entry.isHealthy).length,
    expiredClients: entries.filter(entry => isEntryExpired(entry)).length,
    oldestClientAge: entries.length > 0 ? Math.max(...entries.map(entry => now - entry.createdAt)) : 0,
    newestClientAge: entries.length > 0 ? Math.min(...entries.map(entry => now - entry.createdAt)) : 0,
  };
  
  return stats;
}

/**
 * Manually trigger cache cleanup (useful for testing or emergency cleanup)
 */
export async function manualCleanup(): Promise<void> {
  await cleanupCache();
}

/**
 * Manually trigger health checks on all cached clients
 */
export async function manualHealthCheck(): Promise<void> {
  await performHealthChecks();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert operatingMode from kebab-case to SCREAMING_SNAKE_CASE for database storage
 */
function operatingModeToDbFormat(operatingMode: 'standalone' | 'ehr-integrated'): 'STANDALONE' | 'EHR_INTEGRATED' {
  const validInputValues: Array<'standalone' | 'ehr-integrated'> = ['standalone', 'ehr-integrated'];
  
  if (!validInputValues.includes(operatingMode)) {
    throw new Error(`Invalid operating mode: ${operatingMode}. Expected one of: ${validInputValues.join(', ')}`);
  }
  
  const converted = operatingMode.toUpperCase().replace('-', '_');
  
  // Validate the conversion result
  if (converted !== 'STANDALONE' && converted !== 'EHR_INTEGRATED') {
    throw new Error(`Operating mode conversion failed: ${operatingMode} -> ${converted}`);
  }
  
  return converted;
}

/**
 * Convert operatingMode from SCREAMING_SNAKE_CASE to kebab-case for API responses
 */
function operatingModeFromDbFormat(dbOperatingMode: string): 'standalone' | 'ehr-integrated' {
  const validDbValues = ['STANDALONE', 'EHR_INTEGRATED'];
  
  if (!validDbValues.includes(dbOperatingMode)) {
    throw new Error(`Invalid database operating mode: ${dbOperatingMode}. Expected one of: ${validDbValues.join(', ')}`);
  }
  
  const converted = dbOperatingMode.toLowerCase().replace('_', '-');
  
  // Validate the conversion result
  if (converted !== 'standalone' && converted !== 'ehr-integrated') {
    throw new Error(`Database operating mode conversion failed: ${dbOperatingMode} -> ${converted}`);
  }
  
  return converted;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to validate features object structure
 */
function isValidFeaturesObject(features: unknown): features is TenantConfig['features'] {
  if (!features || typeof features !== 'object') {
    return false;
  }
  
  const obj = features as Record<string, unknown>;
  return (
    typeof obj.manualExport === 'boolean' &&
    typeof obj.patientManagement === 'boolean' &&
    typeof obj.ehrSync === 'boolean'
  );
}

/**
 * Safely parse and validate features from database JSON
 */
function parseFeatures(features: unknown): TenantConfig['features'] {
  if (isValidFeaturesObject(features)) {
    return features;
  }
  
  // Fallback to default features if invalid
  console.warn('Invalid features object found, using defaults:', features);
  return {
    manualExport: true,
    patientManagement: true,
    ehrSync: false,
  };
}

// ============================================================================
// SERVICE LOCATOR
// ============================================================================

/**
 * Factory function that returns the appropriate DataStore implementation
 * based on tenant configuration
 */
export async function getDataStore(tenantConfig: TenantConfig): Promise<DataStore> {
  if (tenantConfig.isDedicatedDb && tenantConfig.dbConnectionUri) {
    // For dedicated databases, get or create a cached Prisma client with the tenant's connection string
    return new SharedPostgresStore(tenantConfig, getCachedPrismaClient(tenantConfig.dbConnectionUri));
  } else {
    // For shared databases, use the default Prisma client with RLS
    return new SharedPostgresStore(tenantConfig, db);
  }
}

/**
 * Get tenant configuration from the database
 */
export async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      name: tenant.name,
      operatingMode: operatingModeFromDbFormat(tenant.operatingMode),
      isDedicatedDb: tenant.isDedicatedDb,
      dbConnectionUri: tenant.dbConnectionUri ?? undefined,
      features: parseFeatures(tenant.features),
    };
  } catch (error) {
    console.error(`Failed to get tenant config for ${tenantId}:`, error);
    return null;
  }
}

/**
 * Create a tenant record in the database
 */
export async function createTenant(
  name: string,
  operatingMode: 'standalone' | 'ehr-integrated' = 'standalone',
  options: {
    isDedicatedDb?: boolean;
    dbConnectionUri?: string;
    features?: {
      manualExport?: boolean;
      patientManagement?: boolean;
      ehrSync?: boolean;
    };
  } = {}
): Promise<TenantConfig> {
  const tenant = await db.tenant.create({
    data: {
      name,
      operatingMode: operatingModeToDbFormat(operatingMode),
      isDedicatedDb: options.isDedicatedDb ?? false,
      dbConnectionUri: options.dbConnectionUri,
      features: {
        manualExport: options.features?.manualExport ?? true,
        patientManagement: options.features?.patientManagement ?? true,
        ehrSync: options.features?.ehrSync ?? false,
      },
    },
  });

  return {
    id: tenant.id,
    name: tenant.name,
    operatingMode: operatingModeFromDbFormat(tenant.operatingMode),
    isDedicatedDb: tenant.isDedicatedDb,
    dbConnectionUri: tenant.dbConnectionUri ?? undefined,
    features: parseFeatures(tenant.features),
  };
}

// ============================================================================
// TENANT CONTEXT HELPERS
// ============================================================================

/**
 * Set the tenant context for the current session
 * This should be called at the beginning of each API request
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  try {
    await db.$executeRaw`SELECT set_tenant(${tenantId}::uuid)`;
  } catch (error) {
    console.error(`Failed to set tenant context for ${tenantId}:`, error);
    throw new Error('Failed to set tenant context');
  }
}

/**
 * Clear the tenant context for the current session
 */
export async function clearTenantContext(): Promise<void> {
  try {
    await db.$executeRaw`SELECT set_config('app.tenant_id', '', false)`;
  } catch (error) {
    console.error('Failed to clear tenant context:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { DataStore, TenantConfig } from './types';
export { SharedPostgresStore } from './SharedPostgresStore';
export * from './types';