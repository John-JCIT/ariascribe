/**
 * Feature Flags for Aria Scribe Clinical Features
 * 
 * Phase 1 clinical features (navigation, dashboard, patient panel) are now 
 * the default experience and no longer require feature flags.
 * 
 * This system is used for upcoming features in Phase 2 and 3.
 */

export const FEATURE_FLAGS = {
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
 * Check if any experimental clinical features are enabled
 * (Phase 1 features are now always enabled)
 */
export function hasExperimentalFeaturesEnabled(): boolean {
  return Object.values(FEATURE_FLAGS).some(Boolean);
}

/**
 * Development helper to log enabled experimental features
 */
export function logEnabledFeatures(): void {
  if (process.env.NODE_ENV === 'development') {
    const enabled = getEnabledFeatures();
    console.log('🏥 Aria Scribe: Clinical dashboard is default');
    if (enabled.length > 0) {
      console.log('🧪 Experimental Features Enabled:', enabled);
    }
  }
}