/**
 * Server-side Operating Mode Utilities for Phase 2A
 * 
 * This module provides server-side utilities for determining the current
 * tenant's operating mode. Use these functions in server components and API routes.
 */

import { getServerSession } from '@/server/auth';
import { getTenantConfig } from '@/server/datastore';
import { getCurrentTenantId } from '@/services';
import type { OperatingMode } from './operating-mode';

/**
 * Get operating mode from server session (server-side only)
 * This is used during SSR to get the operating mode from the current session
 */
export async function getOperatingModeFromServerSession(): Promise<OperatingMode | null> {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return null;
    }

    // Get tenant ID for the current user
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
      return null;
    }

    // Get tenant configuration
    const tenantConfig = await getTenantConfig(tenantId);
    
    return tenantConfig?.operatingMode || null;
  } catch (error) {
    console.error('Failed to get operating mode from server session:', error);
    return null;
  }
}

/**
 * Get the current tenant's operating mode (server-side only)
 * This function can only be called from server components and API routes
 */
export async function getOperatingModeServer(): Promise<OperatingMode> {
  try {
    // Get the current tenant ID
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
      console.warn('No tenant ID found, defaulting to standalone mode');
      return 'standalone';
    }

    // Get tenant configuration from database
    const tenantConfig = await getTenantConfig(tenantId);
    
    if (!tenantConfig) {
      console.warn(`Tenant configuration not found for ${tenantId}, defaulting to standalone mode`);
      return 'standalone';
    }

    return tenantConfig.operatingMode;
  } catch (error) {
    console.error('Failed to get operating mode:', error);
    // Default to standalone mode on error
    return 'standalone';
  }
}

/**
 * Check if the current tenant is in standalone mode (server-side)
 */
export async function isStandaloneModeServer(): Promise<boolean> {
  const mode = await getOperatingModeServer();
  return mode === 'standalone';
}

/**
 * Check if the current tenant is in EHR-integrated mode (server-side)
 */
export async function isEHRIntegratedModeServer(): Promise<boolean> {
  const mode = await getOperatingModeServer();
  return mode === 'ehr-integrated';
}