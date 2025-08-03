/**
 * StandaloneClinicService - EHR Provider Implementation for Standalone Mode
 * 
 * This service implements the EHRProvider interface but delegates to the
 * DataStore abstraction instead of connecting to external EHR systems.
 * It provides the same interface as real EHR integrations while using
 * the internal PostgreSQL database.
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

import type { DataStore, TenantConfig } from '@/server/datastore';
import { getDataStore, getTenantConfig } from '@/server/datastore';

/**
 * Standalone clinic service that implements EHRProvider interface
 * but uses internal database instead of external EHR systems
 */
export class StandaloneClinicService implements EHRProvider {
  private dataStore: DataStore | null = null;
  
  constructor(
    private tenantId: string,
    private clinicianId: string = 'current-clinician' // TODO: Get from session/auth
  ) {}

  /**
   * Lazy-load the DataStore when needed
   */
  private async getDataStore(): Promise<DataStore> {
    if (!this.dataStore) {
      const tenantConfig = await getTenantConfig(this.tenantId);
      if (!tenantConfig) {
        throw new Error(`Tenant not found: ${this.tenantId}`);
      }
      this.dataStore = await getDataStore(tenantConfig);
    }
    return this.dataStore;
  }

  // ============================================================================
  // SYSTEM INFORMATION
  // ============================================================================

  getProviderInfo(): EHRProviderInfo {
    return {
      name: 'Aria Scribe Standalone',
      version: '2.0.0-standalone',
      capabilities: [
        'appointments',
        'patient-data',
        'clinical-notes',
        'patient-management',
        'consultation-workflow',
        'exports'
      ],
      supportedFeatures: {
        appointments: true,
        patientData: true,
        clinicalNotes: true,
        medications: false, // Not implemented in Phase 2A
        allergies: false,   // Not implemented in Phase 2A
        billing: false,     // Not implemented in Phase 2A
      },
    };
  }

  async testConnection(): Promise<ConnectionStatus> {
    try {
      // Test database connectivity by getting tenant config
      const tenantConfig = await getTenantConfig(this.tenantId);
      
      return {
        connected: tenantConfig !== null,
        lastChecked: new Date(),
        responseTime: 50, // Simulated fast response for local DB
        version: 'Standalone v2.0.0',
      };
    } catch (error) {
      return {
        connected: false,
        lastChecked: new Date(),
        error: `Connection failed: ${error}`,
      };
    }
  }

  // ============================================================================
  // APPOINTMENT MANAGEMENT
  // ============================================================================

  async getTodaysAppointments(clinicianId: string, date?: Date): Promise<Appointment[]> {
    const dataStore = await this.getDataStore();
    return dataStore.getTodaysAppointments(clinicianId, date);
  }

  async getAppointment(appointmentId: string): Promise<Appointment> {
    const dataStore = await this.getDataStore();
    return dataStore.getAppointment(appointmentId);
  }

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
    const dataStore = await this.getDataStore();
    return dataStore.updateAppointmentStatus(appointmentId, status);
  }

  // ============================================================================
  // PATIENT DATA
  // ============================================================================

  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    const dataStore = await this.getDataStore();
    return dataStore.getPatientSummary(patientId);
  }

  async getPatientContext(patientId: string): Promise<PatientContext> {
    const dataStore = await this.getDataStore();
    return dataStore.getPatientContext(patientId);
  }

  // ============================================================================
  // CLINICAL NOTES
  // ============================================================================

  async createClinicalNote(patientId: string, note: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const dataStore = await this.getDataStore();
    
    // Convert from EHRProvider interface to DataStore interface
    const noteInput = {
      title: note.title || 'Clinical Note',
      content: note.content || '',
      noteType: note.noteType,
      template: note.template,
      consultationId: note.consultationId,
      generatedFromAudio: note.generatedFromAudio,
      transcriptionId: note.transcriptionId,
      aiConfidence: note.aiConfidence,
    };
    
    return dataStore.createClinicalNote(patientId, noteInput);
  }

  async updateClinicalNote(noteId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote> {
    const dataStore = await this.getDataStore();
    return dataStore.updateClinicalNote(noteId, updates);
  }

  // ============================================================================
  // STANDALONE-SPECIFIC METHODS (Extensions to EHRProvider)
  // ============================================================================

  /**
   * Create a new patient in standalone mode
   */
  async createPatient(patient: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: 'M' | 'F' | 'Other' | 'Unknown';
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }): Promise<PatientSummary> {
    const dataStore = await this.getDataStore();
    return dataStore.createPatient({
      ...patient,
      source: 'aria-scribe',
    });
  }

  /**
   * Update patient information in standalone mode
   */
  async updatePatient(patientId: string, updates: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: 'M' | 'F' | 'Other' | 'Unknown';
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }): Promise<PatientSummary> {
    const dataStore = await this.getDataStore();
    return dataStore.updatePatient(patientId, updates);
  }

  /**
   * Search for patients by name, email, or phone
   */
  async searchPatients(query: string, limit?: number): Promise<PatientSummary[]> {
    const dataStore = await this.getDataStore();
    return dataStore.searchPatients(query, limit);
  }

  /**
   * Create a new consultation session
   */
  async createConsultation(consultation: {
    patientId: string;
    selectedTemplate?: string;
  }): Promise<{
    id: string;
    patientId: string;
    status: string;
    createdAt: Date;
  }> {
    const dataStore = await this.getDataStore();
    return dataStore.createConsultation({
      patientId: consultation.patientId,
      mode: 'standalone',
      selectedTemplate: consultation.selectedTemplate,
    });
  }

  /**
   * Update consultation status and data
   */
  async updateConsultation(consultationId: string, updates: {
    status?: 'ready' | 'recording' | 'processing' | 'review' | 'complete' | 'error';
    recordingStartTime?: Date;
    recordingEndTime?: Date;
    audioFileUrl?: string;
    transcriptionText?: string;
    selectedTemplate?: string;
  }): Promise<{
    id: string;
    patientId: string;
    status: string;
    updatedAt: Date;
  }> {
    const dataStore = await this.getDataStore();
    return dataStore.updateConsultation(consultationId, updates);
  }

  /**
   * Get dashboard statistics for the clinician
   */
  async getDashboardStats(date?: Date): Promise<{
    consultationsCompleted: number;
    consultationsScheduled: number;
    currentlyRecording: number;
    appointmentsRemaining: number;
    notesAwaitingReview: number;
    audioFilesProcessing: number;
    averageConsultationTime: number;
  }> {
    const dataStore = await this.getDataStore();
    return dataStore.getDashboardStats(this.clinicianId, date);
  }

  /**
   * Get pending actions that require clinician attention
   */
  async getPendingActions(): Promise<Array<{
    id: string;
    type: string;
    priority: string;
    title: string;
    description: string;
    patientName?: string;
    appointmentTime?: Date;
    actionUrl?: string;
    createdAt: Date;
    dismissible: boolean;
  }>> {
    const dataStore = await this.getDataStore();
    return dataStore.getPendingActions(this.clinicianId);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a StandaloneClinicService instance for a specific tenant
 */
export function createStandaloneClinicService(
  tenantId: string,
  clinicianId?: string
): StandaloneClinicService {
  return new StandaloneClinicService(tenantId, clinicianId);
}

/**
 * Check if a tenant is configured for standalone mode
 */
export async function isStandaloneMode(tenantId: string): Promise<boolean> {
  try {
    const tenantConfig = await getTenantConfig(tenantId);
    return tenantConfig?.operatingMode === 'standalone';
  } catch (error) {
    console.error(`Failed to check standalone mode for tenant ${tenantId}:`, error);
    return false;
  }
}