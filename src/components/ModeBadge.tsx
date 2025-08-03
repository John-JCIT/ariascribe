/**
 * ModeBadge Component for Phase 2A
 * 
 * Displays the current tenant's operating mode (Standalone vs EHR Integrated)
 * in the sidebar header. Updates automatically based on tenant configuration.
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  getOperatingMode, 
  getOperatingModeLabel, 
  getOperatingModeColor,
  type OperatingMode 
} from '@/lib/operating-mode';
import { Loader2 } from 'lucide-react';

interface ModeBadgeProps {
  className?: string;
}

export function ModeBadge({ className }: ModeBadgeProps) {
  const [operatingMode, setOperatingMode] = useState<OperatingMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperatingMode() {
      try {
        setLoading(true);
        setError(null);
        const mode = await getOperatingMode();
        setOperatingMode(mode);
      } catch (err) {
        console.error('Failed to fetch operating mode:', err);
        setError('Failed to load mode');
        // Default to standalone on error
        setOperatingMode('standalone');
      } finally {
        setLoading(false);
      }
    }

    fetchOperatingMode();
  }, []);

  if (loading) {
    return (
      <Badge 
        variant="ghost" 
        className={`text-xs border border-gray-200/50 bg-gray-50/50 text-gray-500 ${className || ''}`} 
        color="default"
      >
        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
        <span className="font-medium">Loading...</span>
      </Badge>
    );
  }

    if (error || !operatingMode) {
    return (
      <Badge 
        variant="ghost" 
        className={`text-xs border border-gray-200/50 bg-gray-50/50 text-gray-500 ${className || ''}`} 
        color="default"
      >
        <span className="font-medium">Unknown Mode</span>
      </Badge>
    );
  }

  const { variant, className: modeClassName } = getOperatingModeColor(operatingMode);
  const label = getOperatingModeLabel(operatingMode);

  return (
    <Badge 
      variant={variant} 
      className={`text-xs border font-medium transition-colors ${modeClassName} ${className || ''}`}
      color="default"
    >
      {label}
    </Badge>
  );
}

/**
 * Compact version of ModeBadge for use in tight spaces
 */
export function CompactModeBadge({ className }: { className?: string }) {
  return <ModeBadge className={className} />;
}

/**
 * Hook for getting the current operating mode in React components
 */
export function useOperatingMode() {
  const [operatingMode, setOperatingMode] = useState<OperatingMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperatingMode() {
      try {
        setLoading(true);
        setError(null);
        const mode = await getOperatingMode();
        setOperatingMode(mode);
      } catch (err) {
        console.error('Failed to fetch operating mode:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setOperatingMode('standalone'); // Default fallback
      } finally {
        setLoading(false);
      }
    }

    fetchOperatingMode();
  }, []);

  return {
    operatingMode,
    loading,
    error,
    isStandalone: operatingMode === 'standalone',
    isEHRIntegrated: operatingMode === 'ehr-integrated',
  };
}