/**
 * Clinical Data Types for Aria Scribe
 * 
 * These types define the structure of clinical data used throughout
 * the application. They are designed to be compatible with multiple
 * EHR systems while maintaining a consistent internal interface.
 */

// ============================================================================
// APPOINTMENTS & SCHEDULING
// ============================================================================

export type AppointmentStatus = 
  | 'scheduled'    // Appointment booked, patient not yet arrived
  | 'waiting'      // Patient has arrived, waiting to be seen
  | 'in-progress'  // Currently with doctor
  | 'recording'    // Audio recording in progress
  | 'processing'   // Post-consultation processing (transcription, etc.)
  | 'completed'    // Consultation finished, notes complete
  | 'cancelled'    // Appointment cancelled
  | 'no-show';     // Patient did not attend

export interface Appointment {
  id: string;
  ehrAppointmentId?: string; // ID from external EHR system
  patientId: string;
  clinicianId: string;
  scheduledTime: Date;
  duration: number; // minutes
  appointmentType: string;
  status: AppointmentStatus;
  notes?: string;
  location?: string;
  
  // Patient info (minimal for display purposes)
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Other' | 'Unknown';
  
  // Consultation tracking
  consultationId?: string;
  recordingStartTime?: Date;
  recordingEndTime?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PATIENT DATA (MINIMAL STORAGE)
// ============================================================================

export interface PatientSummary {
  id: string;
  ehrPatientId: string; // Always reference external EHR
  ehrSystem: 'bestpractice' | 'medicaldirector' | 'fhir' | 'other';
  
  // Basic demographics only
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  gender: 'M' | 'F' | 'Other' | 'Unknown';
  
  // Contact info (if needed for consultation)
  phone?: string;
  email?: string;
  
  // Visit history
  lastVisit?: Date;
  totalVisits?: number;
  
  // Sync metadata
  lastSyncedAt: Date;
  isStale?: boolean; // True if data needs refresh from EHR
}

export interface PatientContext {
  summary: PatientSummary;
  medications?: Medication[];
  allergies?: Allergy[];
  recentNotes?: ClinicalNote[];
  alerts?: ClinicalAlert[];
  
  // Loading states for async data
  medicationsLoading?: boolean;
  allergiesLoading?: boolean;
  notesLoading?: boolean;
}

// ============================================================================
// CLINICAL DATA (FROM EHR)
// ============================================================================

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: string; // oral, topical, injection, etc.
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  active: boolean;
  notes?: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  allergenType: 'drug' | 'food' | 'environmental' | 'other';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  onsetDate?: Date;
  verifiedDate: Date;
  notes?: string;
}

export interface ClinicalAlert {
  id: string;
  type: 'allergy' | 'drug-interaction' | 'chronic-condition' | 'safety' | 'other';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  actionRequired?: boolean;
  dismissible?: boolean;
}

export interface ClinicalNote {
  id: string;
  ehrNoteId?: string;
  patientId: string;
  clinicianId: string;
  consultationId?: string;
  
  // Note content
  title: string;
  content: string;
  noteType: 'progress' | 'soap' | 'assessment' | 'plan' | 'referral' | 'other';
  template?: string;
  
  // Status and workflow
  status: 'draft' | 'pending-review' | 'final' | 'amended' | 'signed';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
  
  // AI/Transcription metadata
  generatedFromAudio?: boolean;
  transcriptionId?: string;
  aiConfidence?: number;
  manuallyEdited?: boolean;
}

// ============================================================================
// CONSULTATION WORKFLOW
// ============================================================================

export type ConsultationStatus = 
  | 'ready'        // Ready to start
  | 'recording'    // Audio recording in progress
  | 'processing'   // Transcribing and generating note
  | 'review'       // Note ready for doctor review
  | 'complete'     // Note approved and sent to EHR
  | 'error';       // Something went wrong

export interface ConsultationState {
  appointmentId: string;
  patientId: string;
  clinicianId: string;
  status: ConsultationStatus;
  
  // Pre-consultation checklist
  checklist: {
    identityVerified: boolean;
    consentObtained: boolean;
    templateSelected: boolean;
    summaryReviewed: boolean;
  };
  
  // Recording data
  recordingStartTime?: Date;
  recordingEndTime?: Date;
  recordingDuration?: number; // seconds
  audioFileUrl?: string;
  
  // Processing data
  transcriptionText?: string;
  generatedNote?: string;
  selectedTemplate?: string;
  
  // Real-time feedback
  audioLevel?: number; // 0-100
  transcriptionProgress?: number; // 0-100
  noteGenerationProgress?: number; // 0-100;
  
  // Error handling
  error?: string;
  lastError?: Date;
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardStats {
  // Today's metrics
  consultationsCompleted: number;
  consultationsScheduled: number;
  currentlyRecording: number;
  appointmentsRemaining: number;
  
  // Workflow metrics
  notesAwaitingReview: number;
  audioFilesProcessing: number;
  averageConsultationTime: number; // minutes
  
  // Efficiency metrics
  timesSaved?: number; // minutes saved today
  notesGenerated?: number;
  transcriptionAccuracy?: number; // percentage
}

export interface PendingAction {
  id: string;
  type: 'note-review' | 'audio-processing' | 'sync-failed' | 'consent-pending' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  patientName?: string;
  appointmentTime?: Date;
  actionUrl?: string;
  createdAt: Date;
  dismissible: boolean;
}

// ============================================================================
// EHR INTEGRATION INTERFACES
// ============================================================================

export interface EHRProvider {
  // System info
  getProviderInfo(): EHRProviderInfo;
  testConnection(): Promise<ConnectionStatus>;
  
  // Appointments
  getTodaysAppointments(clinicianId: string, date?: Date): Promise<Appointment[]>;
  getAppointment(appointmentId: string): Promise<Appointment>;
  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void>;
  
  // Patient data
  getPatientSummary(patientId: string): Promise<PatientSummary>;
  getPatientContext(patientId: string): Promise<PatientContext>;
  
  // Clinical notes
  createClinicalNote(patientId: string, note: Partial<ClinicalNote>): Promise<ClinicalNote>;
  updateClinicalNote(noteId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote>;
}

export interface EHRProviderInfo {
  name: string;
  version: string;
  capabilities: string[];
  supportedFeatures: {
    appointments: boolean;
    patientData: boolean;
    clinicalNotes: boolean;
    medications: boolean;
    allergies: boolean;
    billing: boolean;
  };
}

export interface ConnectionStatus {
  connected: boolean;
  lastChecked: Date;
  responseTime?: number; // milliseconds
  error?: string;
  version?: string;
}

// ============================================================================
// MOCK DATA TYPES (Development Only)
// ============================================================================

export interface MockDataOptions {
  patientCount?: number;
  appointmentsPerDay?: number;
  includeHistoricalData?: boolean;
  randomSeed?: string; // For consistent mock data
}

export interface MockGenerationResult {
  appointments: Appointment[];
  patients: PatientSummary[];
  notes: ClinicalNote[];
  generatedAt: Date;
  seed: string;
}