/**
 * Mock EHR Service Implementation
 * 
 * This service implements the EHRProvider interface with mock data
 * for development and testing. It simulates the behavior of real
 * EHR systems like Best Practice while using safe, fictional data.
 */

import type { 
  EHRProvider,
  EHRProviderInfo,
  ConnectionStatus,
  Appointment,
  AppointmentStatus,
  PatientSummary,
  PatientContext,
  ClinicalNote
} from '@/types/clinical';

import { 
  generateTodaysAppointments,
  updateAppointmentStatus,
  calculateAppointmentStats 
} from './appointments';

import { 
  generateMockPatientSummary,
  generateMockPatientContext,
  refreshPatientData 
} from './patients';

/**
 * Mock EHR Service that simulates Best Practice integration
 */
export class MockEHRService implements EHRProvider {
  private appointments: Map<string, Appointment[]> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: true,
    lastChecked: new Date(),
    responseTime: 150,
    version: 'Mock v1.0.0',
  };

  constructor() {
    // Initialize with today's appointments for the default clinician
    this.appointments.set('mock-clinician-001', generateTodaysAppointments());
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🏥 Mock EHR Service initialized');
      console.log('📅 Generated appointments for clinician: mock-clinician-001');
    }
  }

  // ============================================================================
  // SYSTEM INFORMATION
  // ============================================================================

  getProviderInfo(): EHRProviderInfo {
    return {
      name: 'Mock EHR System',
      version: '1.0.0-mock',
      capabilities: [
        'appointments',
        'patient-data',
        'clinical-notes',
        'medications',
        'allergies',
        'basic-billing'
      ],
      supportedFeatures: {
        appointments: true,
        patientData: true,
        clinicalNotes: true,
        medications: true,
        allergies: true,
        billing: false, // Not implemented in mock
      },
    };
  }

  async testConnection(): Promise<ConnectionStatus> {
    // Simulate network delay
    await this.simulateNetworkDelay(100, 300);
    
    // Simulate occasional connection issues (5% chance)
    if (Math.random() < 0.05) {
      this.connectionStatus = {
        connected: false,
        lastChecked: new Date(),
        error: 'Mock connection timeout',
      };
    } else {
      this.connectionStatus = {
        connected: true,
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        version: 'Mock v1.0.0',
      };
    }
    
    return this.connectionStatus;
  }

  // ============================================================================
  // APPOINTMENT MANAGEMENT
  // ============================================================================

  async getTodaysAppointments(
    clinicianId: string, 
    date: Date = new Date()
  ): Promise<Appointment[]> {
    await this.simulateNetworkDelay(200, 500);
    
    const dateKey = `${clinicianId}-${date.toISOString().split('T')[0]}`;
    
    if (!this.appointments.has(dateKey)) {
      // Generate appointments for this clinician/date combination
      const appointments = generateTodaysAppointments(date, clinicianId);
      this.appointments.set(dateKey, appointments);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 Generated ${appointments.length} appointments for ${clinicianId} on ${date.toISOString().split('T')[0]}`);
      }
    }
    
    return this.appointments.get(dateKey) || [];
  }

  async getAppointment(appointmentId: string): Promise<Appointment> {
    await this.simulateNetworkDelay(100, 200);
    
    // Search through all appointments to find the one with matching ID
    for (const appointments of this.appointments.values()) {
      const appointment = appointments.find(appt => appt.id === appointmentId);
      if (appointment) {
        return appointment;
      }
    }
    
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  async updateAppointmentStatus(
    appointmentId: string, 
    status: AppointmentStatus
  ): Promise<void> {
    await this.simulateNetworkDelay(150, 300);
    
    // Find and update the appointment
    for (const [key, appointments] of this.appointments.entries()) {
      const updatedAppointments = updateAppointmentStatus(appointments, appointmentId, status);
      if (updatedAppointments !== appointments) {
        this.appointments.set(key, updatedAppointments);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 Updated appointment ${appointmentId} status to: ${status}`);
        }
        return;
      }
    }
    
    throw new Error(`Appointment not found for status update: ${appointmentId}`);
  }

  // ============================================================================
  // PATIENT DATA
  // ============================================================================

  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    await this.simulateNetworkDelay(200, 400);
    
    const summary = generateMockPatientSummary(patientId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`👤 Retrieved patient summary for: ${summary.firstName} ${summary.lastName}`);
    }
    
    return summary;
  }

  async getPatientContext(patientId: string): Promise<PatientContext> {
    await this.simulateNetworkDelay(300, 800);
    
    const context = generateMockPatientContext(patientId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏥 Retrieved full patient context for: ${context.summary.firstName} ${context.summary.lastName}`);
      console.log(`   - ${context.medications?.length || 0} medications`);
      console.log(`   - ${context.allergies?.length || 0} allergies`);
      console.log(`   - ${context.recentNotes?.length || 0} recent notes`);
      console.log(`   - ${context.alerts?.length || 0} alerts`);
    }
    
    return context;
  }

  // ============================================================================
  // CLINICAL NOTES
  // ============================================================================

  async createClinicalNote(
    patientId: string, 
    noteInput: Partial<ClinicalNote>
  ): Promise<ClinicalNote> {
    await this.simulateNetworkDelay(400, 800);
    
    const note: ClinicalNote = {
      id: `mock-note-${Date.now()}`,
      ehrNoteId: `bp-note-${Date.now()}`,
      patientId,
      clinicianId: noteInput.clinicianId || 'mock-clinician-001',
      consultationId: noteInput.consultationId,
      title: noteInput.title || 'Clinical Note',
      content: noteInput.content || '',
      noteType: noteInput.noteType || 'soap',
      status: noteInput.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedFromAudio: noteInput.generatedFromAudio || false,
      transcriptionId: noteInput.transcriptionId,
      aiConfidence: noteInput.aiConfidence,
      manuallyEdited: noteInput.manuallyEdited || false,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Created clinical note: ${note.id} for patient ${patientId}`);
    }
    
    return note;
  }

  async updateClinicalNote(
    noteId: string, 
    updates: Partial<ClinicalNote>
  ): Promise<ClinicalNote> {
    await this.simulateNetworkDelay(200, 400);
    
    // In a real implementation, this would update the note in the EHR
    // For mock purposes, we'll create a new note with updated data
    const updatedNote: ClinicalNote = {
      id: noteId,
      ehrNoteId: `bp-${noteId}`,
      patientId: updates.patientId || 'unknown',
      clinicianId: updates.clinicianId || 'mock-clinician-001',
      consultationId: updates.consultationId,
      title: updates.title || 'Updated Clinical Note',
      content: updates.content || '',
      noteType: updates.noteType || 'soap',
      status: updates.status || 'draft',
      createdAt: new Date(Date.now() - 60000), // 1 minute ago
      updatedAt: new Date(),
      signedAt: updates.status === 'final' ? new Date() : undefined,
      generatedFromAudio: updates.generatedFromAudio || false,
      transcriptionId: updates.transcriptionId,
      aiConfidence: updates.aiConfidence,
      manuallyEdited: true, // Always true for updates
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Updated clinical note: ${noteId} (status: ${updatedNote.status})`);
    }
    
    return updatedNote;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get dashboard statistics for a clinician
   */
  async getDashboardStats(clinicianId: string, date: Date = new Date()) {
    const appointments = await this.getTodaysAppointments(clinicianId, date);
    return calculateAppointmentStats(appointments);
  }

  /**
   * Refresh patient data (simulates re-fetching from EHR)
   */
  async refreshPatientData(patientId: string): Promise<PatientContext> {
    return refreshPatientData(patientId);
  }

  /**
   * Simulate network delay for realistic EHR response times
   */
  private async simulateNetworkDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Simulate connection failure (for testing error handling)
   */
  simulateConnectionFailure(): void {
    this.connectionStatus = {
      connected: false,
      lastChecked: new Date(),
      error: 'Simulated connection failure',
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Simulated EHR connection failure');
    }
  }

  /**
   * Restore connection (for testing recovery)
   */
  restoreConnection(): void {
    this.connectionStatus = {
      connected: true,
      lastChecked: new Date(),
      responseTime: 150,
      version: 'Mock v1.0.0',
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ EHR connection restored');
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let mockEHRServiceInstance: MockEHRService | null = null;

/**
 * Get the singleton instance of the mock EHR service
 */
export function getMockEHRService(): MockEHRService {
  if (!mockEHRServiceInstance) {
    mockEHRServiceInstance = new MockEHRService();
  }
  return mockEHRServiceInstance;
}

/**
 * Reset the mock EHR service (useful for testing)
 */
export function resetMockEHRService(): void {
  mockEHRServiceInstance = null;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Mock EHR Service reset');
  }
}