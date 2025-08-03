/**
 * DataStore Abstraction Types for Phase 2A
 * 
 * This module defines the abstraction layer that sits between the EHRProvider
 * interface and the actual data persistence layer (PostgreSQL with RLS).
 */

import type {
  Appointment,
  AppointmentStatus,
  PatientSummary,
  PatientContext,
  ClinicalNote,
  DashboardStats,
  PendingAction
} from '@/types/clinical';

// ============================================================================
// DATASTORE INTERFACE
// ============================================================================

/**
 * DataStore abstraction interface that mirrors EHRProvider methods
 * but operates on the internal database instead of external EHR systems
 */
export interface DataStore {
  // Appointment management
  getTodaysAppointments(clinicianId: string, date?: Date): Promise<Appointment[]>;
  getAppointment(appointmentId: string): Promise<Appointment>;
  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void>;
  
  // Patient data
  getPatientSummary(patientId: string): Promise<PatientSummary>;
  getPatientContext(patientId: string): Promise<PatientContext>;
  
  // Clinical notes
  createClinicalNote(patientId: string, note: ClinicalNoteInput): Promise<ClinicalNote>;
  updateClinicalNote(noteId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote>;
  
  // Dashboard data
  getDashboardStats(clinicianId: string, date?: Date): Promise<DashboardStats>;
  getPendingActions(clinicianId: string): Promise<PendingAction[]>;
  
  // Patient management (Standalone mode specific)
  createPatient(patient: CreatePatientInput): Promise<PatientSummary>;
  updatePatient(patientId: string, updates: UpdatePatientInput): Promise<PatientSummary>;
  searchPatients(query: string, limit?: number): Promise<PatientSummary[]>;
  getRecentPatients(limit?: number): Promise<PatientSummary[]>;
  
  // Consultation management
  createConsultation(consultation: CreateConsultationInput): Promise<ConsultationRecord>;
  updateConsultation(consultationId: string, updates: UpdateConsultationInput): Promise<ConsultationRecord>;
  getConsultation(consultationId: string): Promise<ConsultationRecord>;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface ClinicalNoteInput {
  title: string;
  content: string;
  noteType?: 'progress' | 'soap' | 'assessment' | 'plan' | 'referral' | 'other';
  template?: string;
  consultationId?: string;
  generatedFromAudio?: boolean;
  transcriptionId?: string;
  aiConfidence?: number;
}

export interface CreatePatientInput {
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
  source?: 'aria-scribe' | 'ehr' | 'imported';
}

export interface UpdatePatientInput {
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
}

export interface CreateConsultationInput {
  patientId: string;
  mode: 'standalone' | 'ehr-integrated';
  selectedTemplate?: string;
}

export interface UpdateConsultationInput {
  status?: 'ready' | 'recording' | 'processing' | 'review' | 'complete' | 'error';
  recordingStartTime?: Date;
  recordingEndTime?: Date;
  audioFileUrl?: string;
  transcriptionText?: string;
  selectedTemplate?: string;
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

/**
 * Internal consultation record that maps to the database model
 */
export interface ConsultationRecord {
  id: string;
  tenantId: string;
  patientId: string;
  mode: 'standalone' | 'ehr-integrated';
  status: 'ready' | 'recording' | 'processing' | 'review' | 'complete' | 'error';
  recordingStartTime?: Date;
  recordingEndTime?: Date;
  audioFileUrl?: string;
  transcriptionText?: string;
  selectedTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant configuration for DataStore selection
 */
export interface TenantConfig {
  id: string;
  name: string;
  operatingMode: 'standalone' | 'ehr-integrated';
  isDedicatedDb: boolean;
  dbConnectionUri?: string;
  features: {
    manualExport: boolean;
    patientManagement: boolean;
    ehrSync: boolean;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class DataStoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public tenantId?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'DataStoreError';
  }
}

export class TenantNotFoundError extends DataStoreError {
  constructor(tenantId: string) {
    super(`Tenant not found: ${tenantId}`, 'TENANT_NOT_FOUND', tenantId);
  }
}

export class PatientNotFoundError extends DataStoreError {
  constructor(patientId: string, tenantId?: string) {
    super(`Patient not found: ${patientId}`, 'PATIENT_NOT_FOUND', tenantId);
  }
}

export class ConsultationNotFoundError extends DataStoreError {
  constructor(consultationId: string, tenantId?: string) {
    super(`Consultation not found: ${consultationId}`, 'CONSULTATION_NOT_FOUND', tenantId);
  }
}

export class RLSViolationError extends DataStoreError {
  constructor(operation: string, tenantId?: string) {
    super(`RLS policy violation during ${operation}`, 'RLS_VIOLATION', tenantId);
  }
}