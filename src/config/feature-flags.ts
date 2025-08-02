/**
 * Feature Flags for Aria Scribe Clinical Features
 * 
 * This system allows us to safely deploy new clinical features
 * while keeping them disabled in production until ready.
 * 
 * All flags default to FALSE for safety.
 */

export const FEATURE_FLAGS = {
  // Phase 1: Core Clinical Dashboard
  'clinical-navigation': process.env.NEXT_PUBLIC_ENABLE_CLINICAL_NAV === 'true',
  'clinical-dashboard': process.env.NEXT_PUBLIC_ENABLE_CLINICAL_DASHBOARD === 'true',
  'patient-consultation-panel': process.env.NEXT_PUBLIC_ENABLE_PATIENT_PANEL === 'true',
  
  // Phase 2: EHR Integration (for future use)
  'ehr-integration': process.env.NEXT_PUBLIC_ENABLE_EHR_INTEGRATION === 'true',
  'best-practice-sync': process.env.NEXT_PUBLIC_ENABLE_BP_SYNC === 'true',
  
  // Phase 3: Audio & AI (for future use)
  'audio-recording': process.env.NEXT_PUBLIC_ENABLE_AUDIO_RECORDING === 'true',
  'ai-note-generation': process.env.NEXT_PUBLIC_ENABLE_AI_NOTES === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Hook to check if a feature flag is enabled
 * 
 * @param flag - The feature flag to check
 * @returns boolean - Whether the feature is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

/**
 * Get all enabled feature flags (useful for debugging)
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Check if any clinical features are enabled
 */
export function hasClinicalFeaturesEnabled(): boolean {
  return FEATURE_FLAGS['clinical-navigation'] || 
         FEATURE_FLAGS['clinical-dashboard'] || 
         FEATURE_FLAGS['patient-consultation-panel'];
}

/**
 * Development helper to log enabled features
 */
export function logEnabledFeatures(): void {
  if (process.env.NODE_ENV === 'development') {
    const enabled = getEnabledFeatures();
    if (enabled.length > 0) {
      console.log('🏥 Aria Scribe Clinical Features Enabled:', enabled);
    } else {
      console.log('🏥 Aria Scribe: Using standard dashboard (no clinical features enabled)');
    }
  }
}