/**
 * Operating Mode Utilities for Phase 2A
 * 
 * This module provides utilities for determining and working with the current
 * tenant's operating mode (standalone vs EHR-integrated) in a SSR-safe way.
 */

export type OperatingMode = 'standalone' | 'ehr-integrated';

/**
 * Get the current tenant's operating mode from API (client-side safe)
 * This function can be called from client components
 */
export async function getOperatingMode(): Promise<OperatingMode> {
  try {
    // Try to get from cache first (client-side only)
    const cachedMode = getOperatingModeFromCache();
    if (cachedMode) {
      return cachedMode;
    }

    // Fetch from API endpoint
    const response = await fetch('/api/operating-mode');
    
    if (!response.ok) {
      console.warn('Failed to fetch operating mode, defaulting to standalone');
      return 'standalone';
    }

    const data = await response.json();
    const operatingMode = data.operatingMode as OperatingMode;
    
    // Cache the result for faster subsequent access
    cacheOperatingMode(operatingMode);
    
    return operatingMode;
  } catch (error) {
    console.error('Failed to get operating mode:', error);
    // Default to standalone mode on error
    return 'standalone';
  }
}



/**
 * Get operating mode synchronously from cached data (client-side only)
 * This is a faster alternative when the operating mode is already cached
 */
export function getOperatingModeFromCache(): OperatingMode | null {
  if (typeof window === 'undefined') {
    // Server-side: cannot access cache
    return null;
  }

  // Check if we have cached operating mode data
  try {
    const cached = sessionStorage.getItem('aria-scribe-operating-mode');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.mode && parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        // Cache is valid for 5 minutes
        return parsed.mode as OperatingMode;
      }
    }
  } catch (error) {
    console.error('Failed to read operating mode from cache:', error);
  }

  return null;
}

/**
 * Cache the operating mode for faster subsequent access
 */
function cacheOperatingMode(mode: OperatingMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem('aria-scribe-operating-mode', JSON.stringify({
      mode,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to cache operating mode:', error);
  }
}

/**
 * Check if the current tenant is in standalone mode
 */
export async function isStandaloneMode(): Promise<boolean> {
  const mode = await getOperatingMode();
  return mode === 'standalone';
}

/**
 * Check if the current tenant is in EHR-integrated mode
 */
export async function isEHRIntegratedMode(): Promise<boolean> {
  const mode = await getOperatingMode();
  return mode === 'ehr-integrated';
}

/**
 * Get a human-readable label for the operating mode
 */
export function getOperatingModeLabel(mode: OperatingMode): string {
  switch (mode) {
    case 'standalone':
      return 'Standalone Mode';
    case 'ehr-integrated':
      return 'EHR Integrated';
    default:
      return 'Unknown Mode';
  }
}

/**
 * Get the appropriate color scheme for the operating mode badge
 */
export function getOperatingModeColor(mode: OperatingMode): {
  variant: 'default' | 'outline' | 'ghost';
  className: string;
} {
  switch (mode) {
    case 'standalone':
      return {
        variant: 'ghost',
        className: 'border-blue-200/50 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50',
      };
    case 'ehr-integrated':
      return {
        variant: 'ghost', 
        className: 'border-green-200/50 text-green-600 bg-green-50/50 hover:bg-green-100/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50',
      };
    default:
      return {
        variant: 'ghost',
        className: 'border-gray-200/50 text-gray-600 bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50',
      };
  }
}