/**
 * EHR Service Factory for Phase 2A
 * 
 * This module provides the main factory function that chooses between
 * Standalone and EHR-integrated providers based on tenant configuration.
 * It replaces the getMockEHRService() calls throughout the application.
 */

import type { EHRProvider } from '@/types/clinical';
import { StandaloneClinicService, createStandaloneClinicService, isStandaloneMode } from './StandaloneClinicService';
import { getMockEHRService } from './mock/MockEHRService';
import { getTenantConfig } from '@/server/datastore';

// ============================================================================
// MAIN EHR SERVICE FACTORY
// ============================================================================

/**
 * Get the appropriate EHR service based on tenant configuration
 * This is the main entry point that replaces getMockEHRService()
 */
export async function getEHRService(
  tenantId?: string,
  clinicianId?: string
): Promise<EHRProvider> {
  // If no tenant ID provided, fall back to mock service for development
  if (!tenantId) {
    console.warn('No tenant ID provided, falling back to mock EHR service');
    return getMockEHRService();
  }

  try {
    // Check if tenant is in standalone mode
    if (await isStandaloneMode(tenantId)) {
      return createStandaloneClinicService(tenantId, clinicianId);
    } else {
      // For EHR-integrated mode (Phase 2B), fall back to mock for now
      console.log(`Tenant ${tenantId} is in EHR-integrated mode, using mock service for now`);
      return getMockEHRService();
    }
  } catch (error) {
    console.error(`Failed to get EHR service for tenant ${tenantId}:`, error);
    // Fall back to mock service on error
    return getMockEHRService();
  }
}

/**
 * Get EHR service synchronously (for cases where tenant mode is already known)
 * Use this when you've already determined the tenant is in standalone mode
 */
export function getStandaloneEHRService(
  tenantId: string,
  clinicianId?: string
): EHRProvider {
  return createStandaloneClinicService(tenantId, clinicianId);
}

/**
 * Get mock EHR service (for development and testing)
 */
export function getMockEHRServiceInstance(): EHRProvider {
  return getMockEHRService();
}

// ============================================================================
// TENANT CONTEXT HELPERS
// ============================================================================

/**
 * Get the current tenant ID from various sources (session, JWT, etc.)
 * This is a placeholder - implement based on your authentication system
 */
export async function getCurrentTenantId(): Promise<string | null> {
  // TODO: Implement based on your authentication/session system
  // This could read from:
  // - JWT claims
  // - Session storage
  // - Request headers
  // - Database lookup based on user ID
  
  // For now, return a default tenant for development
  if (process.env.NODE_ENV === 'development') {
    return 'dev-tenant-001';
  }
  
  return null;
}

/**
 * Get the current clinician ID from session/auth
 * This is a placeholder - implement based on your authentication system
 */
export async function getCurrentClinicianId(): Promise<string | null> {
  // TODO: Implement based on your authentication system
  
  // For now, return a default clinician for development
  if (process.env.NODE_ENV === 'development') {
    return 'dev-clinician-001';
  }
  
  return null;
}

/**
 * Get EHR service for the current user's context
 * This is the most convenient method for use in API routes and hooks
 */
export async function getCurrentUserEHRService(): Promise<EHRProvider> {
  const tenantId = await getCurrentTenantId();
  const clinicianId = await getCurrentClinicianId();
  
  return getEHRService(tenantId || undefined, clinicianId || undefined);
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Create a development tenant for testing
 */
export async function createDevelopmentTenant(): Promise<string> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development tenant creation only allowed in development mode');
  }

  try {
    const { createTenant } = await import('@/server/datastore');
    
    const tenant = await createTenant('Development Clinic', 'standalone', {
      features: {
        manualExport: true,
        patientManagement: true,
        ehrSync: false,
      },
    });

    console.log(`Created development tenant: ${tenant.id}`);
    return tenant.id;
  } catch (error) {
    console.error('Failed to create development tenant:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { EHRProvider } from '@/types/clinical';
export { StandaloneClinicService } from './StandaloneClinicService';

// Re-export mock service for backward compatibility during transition
export { getMockEHRService } from './mock/MockEHRService';