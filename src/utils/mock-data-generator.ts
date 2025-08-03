/**
 * Mock Data Generator Utilities
 * 
 * Centralized utilities for generating consistent mock data
 * across the application during development and testing.
 */

import { format, addDays, startOfDay } from 'date-fns';
import type { MockDataOptions, MockGenerationResult } from '@/types/clinical';
import { generateMockDataset } from '@/services/mock/appointments';
import { getMockEHRService } from '@/services/mock/MockEHRService';

// ============================================================================
// DEVELOPMENT DATA MANAGEMENT
// ============================================================================

/**
 * Initialize mock data for development environment
 */
export async function initializeMockData(options: MockDataOptions = {}): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Mock data initialization should only be used in development');
    return;
  }

  const {
    appointmentsPerDay = 12,
    patientCount = 50,
    includeHistoricalData = false,
    randomSeed = format(new Date(), 'yyyy-MM-dd'),
  } = options;

  console.log('🏥 Initializing Aria Scribe mock data...');
  console.log(`   - Appointments per day: ${appointmentsPerDay}`);
  console.log(`   - Patient pool: ${patientCount}`);
  console.log(`   - Historical data: ${includeHistoricalData ? 'Yes' : 'No'}`);
  console.log(`   - Random seed: ${randomSeed}`);

  // Generate today's data
  const todayData = generateMockDataset({
    appointmentsPerDay,
    randomSeed,
  });

  // Generate historical data if requested
  if (includeHistoricalData) {
    const historicalDays = 7; // Generate last week's data
    for (let i = 1; i <= historicalDays; i++) {
      const date = addDays(new Date(), -i);
      const historicalData = generateMockDataset({
        appointmentsPerDay: Math.floor(appointmentsPerDay * 0.8), // Slightly fewer appointments in the past
        randomSeed: `${randomSeed}-${format(date, 'yyyy-MM-dd')}`,
      });
      
      console.log(`   - Generated ${historicalData.appointments.length} appointments for ${format(date, 'MMM dd')}`);
    }
  }

  console.log('✅ Mock data initialization complete');
  console.log(`   - ${todayData.appointments.length} appointments for today`);
  console.log(`   - ${todayData.patients.length} unique patients`);
}

/**
 * Generate mock data for a specific date range
 */
export function generateDateRangeData(
  startDate: Date,
  endDate: Date,
  options: MockDataOptions = {}
): MockGenerationResult[] {
  const results: MockGenerationResult[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    const dayData = generateMockDataset({
      ...options,
      randomSeed: `${options.randomSeed || 'default'}-${dateString}`,
    });

    results.push(dayData);
    currentDate = addDays(currentDate, 1);
  }

  return results;
}

/**
 * Get mock data statistics for dashboard display
 */
export async function getMockDataStats(clinicianId: string = 'mock-clinician-001') {
  const mockService = getMockEHRService();
  const stats = await mockService.getDashboardStats(clinicianId);
  
  return {
    ...stats,
    // Add some additional mock metrics
    timesSaved: Math.floor(stats.consultationsCompleted * 8.5), // Assume 8.5 minutes saved per consultation
    notesGenerated: stats.consultationsCompleted,
    transcriptionAccuracy: 94.2, // Mock accuracy percentage
  };
}

/**
 * Simulate data refresh (useful for testing loading states)
 */
export async function simulateDataRefresh(delayMs: number = 1000): Promise<void> {
  console.log('🔄 Simulating data refresh...');
  await new Promise(resolve => setTimeout(resolve, delayMs));
  console.log('✅ Data refresh complete');
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Log current mock data state to console
 */
export async function logMockDataState(clinicianId: string = 'mock-clinician-001'): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;

  const mockService = getMockEHRService();
  const appointments = await mockService.getTodaysAppointments(clinicianId);
  const stats = await mockService.getDashboardStats(clinicianId);
  const connectionStatus = mockService.getConnectionStatus();

  console.group('📊 Current Mock Data State');
  console.log('Connection Status:', connectionStatus.connected ? '✅ Connected' : '❌ Disconnected');
  console.log('Today\'s Appointments:', appointments.length);
  console.log('Stats:', stats);
  console.table(appointments.map(appt => ({
    Time: format(appt.scheduledTime, 'HH:mm'),
    Patient: appt.patientName,
    Status: appt.status,
    Type: appt.appointmentType,
  })));
  console.groupEnd();
}

/**
 * Clear all mock data (useful for testing)
 */
export async function clearMockData(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Mock data clearing should only be used in development');
    return;
  }

  // Reset the mock service
  const { resetMockEHRService } = await import('@/services/mock/MockEHRService');
  resetMockEHRService();
  
  console.log('🗑️ Mock data cleared');
}

/**
 * Export mock data to JSON (useful for debugging)
 */
export async function exportMockData(clinicianId: string = 'mock-clinician-001'): Promise<string> {
  const mockService = getMockEHRService();
  const appointments = await mockService.getTodaysAppointments(clinicianId);
  const stats = await mockService.getDashboardStats(clinicianId);
  
  const exportData = {
    generatedAt: new Date().toISOString(),
    clinicianId,
    appointments,
    stats,
    metadata: {
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    },
  };

  return JSON.stringify(exportData, null, 2);
}

// ============================================================================
// DEVELOPMENT ENVIRONMENT SETUP
// ============================================================================

/**
 * Setup mock data for development environment
 * This function is called automatically when the app starts in development
 */
export async function setupDevelopmentEnvironment(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;

  // Check if mock data is enabled
  const mockDataEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA !== 'false';
  
  if (!mockDataEnabled) {
    console.log('🚫 Mock data disabled via environment variable');
    return;
  }

  try {
    await initializeMockData({
      appointmentsPerDay: parseInt(process.env.NEXT_PUBLIC_MOCK_APPOINTMENTS_PER_DAY || '12', 10),
      includeHistoricalData: process.env.NEXT_PUBLIC_MOCK_INCLUDE_HISTORICAL === 'true',
      randomSeed: process.env.NEXT_PUBLIC_MOCK_RANDOM_SEED || format(new Date(), 'yyyy-MM-dd'),
    });

    // Log initial state
    await logMockDataState();
    
  } catch (error) {
    console.error('❌ Failed to setup development environment:', error);
  }
}

// ============================================================================
// BROWSER DEVELOPMENT TOOLS
// ============================================================================

/**
 * Add development tools to window object for browser debugging
 */
export function addDevelopmentTools(): void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;

  // Add mock data tools to window object
  (window as any).ariaScribeDev = {
    logMockData: () => logMockDataState(),
    clearMockData,
    exportMockData,
    simulateConnectionFailure: () => getMockEHRService().simulateConnectionFailure(),
    restoreConnection: () => getMockEHRService().restoreConnection(),
    refreshData: () => simulateDataRefresh(),
    getStats: () => getMockDataStats(),
  };

  console.log('🛠️ Development tools available at window.ariaScribeDev');
  console.log('   - logMockData(): Log current data state');
  console.log('   - clearMockData(): Clear all mock data');
  console.log('   - exportMockData(): Export data as JSON');
  console.log('   - simulateConnectionFailure(): Test error handling');
  console.log('   - restoreConnection(): Restore connection');
  console.log('   - refreshData(): Test loading states');
  console.log('   - getStats(): Get dashboard statistics');
}