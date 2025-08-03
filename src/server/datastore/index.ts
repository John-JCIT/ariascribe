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
// SERVICE LOCATOR
// ============================================================================

/**
 * Factory function that returns the appropriate DataStore implementation
 * based on tenant configuration
 */
export async function getDataStore(tenantConfig: TenantConfig): Promise<DataStore> {
  if (tenantConfig.isDedicatedDb && tenantConfig.dbConnectionUri) {
    // For dedicated databases, create a new Prisma client with the tenant's connection string
    return new SharedPostgresStore(tenantConfig, createDedicatedPrismaClient(tenantConfig.dbConnectionUri));
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
      operatingMode: tenant.operatingMode.toLowerCase().replace('_', '-') as 'standalone' | 'ehr-integrated',
      isDedicatedDb: tenant.isDedicatedDb,
      dbConnectionUri: tenant.dbConnectionUri,
      features: tenant.features as any,
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
      operatingMode: operatingMode.toUpperCase().replace('-', '_') as any,
      isDedicatedDb: options.isDedicatedDb || false,
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
    operatingMode: tenant.operatingMode.toLowerCase().replace('_', '-') as 'standalone' | 'ehr-integrated',
    isDedicatedDb: tenant.isDedicatedDb,
    dbConnectionUri: tenant.dbConnectionUri,
    features: tenant.features as any,
  };
}

// ============================================================================
// DEDICATED DATABASE SUPPORT
// ============================================================================

/**
 * Create a Prisma client for a dedicated tenant database
 */
function createDedicatedPrismaClient(connectionUri: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUri,
      },
    },
  });
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
    throw new Error(`Failed to set tenant context: ${error}`);
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