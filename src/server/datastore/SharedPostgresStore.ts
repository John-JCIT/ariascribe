/**
 * SharedPostgresStore - PostgreSQL DataStore Implementation with RLS
 * 
 * This implementation uses the shared PostgreSQL database with Row-Level Security
 * to enforce tenant isolation. It works with Prisma ORM and the RLS policies
 * we've defined in the database.
 */

import type { 
  PrismaClient, 
  Consultation, 
  Patient, 
  ClinicalNote as PrismaClinicalNote 
} from '@/generated/prisma';
import type {
  DataStore,
  ClinicalNoteInput,
  CreatePatientInput,
  UpdatePatientInput,
  CreateConsultationInput,
  UpdateConsultationInput,
  ConsultationRecord,
  TenantConfig
} from './types';

import {
  DataStoreError,
  PatientNotFoundError,
  ConsultationNotFoundError
} from './types';

import type {
  Appointment,
  AppointmentStatus,
  PatientSummary,
  PatientContext,
  ClinicalNote,
  DashboardStats,
  PendingAction
} from '@/types/clinical';

import { db } from '@/server/db';

/**
 * PostgreSQL-based DataStore implementation using Prisma with RLS
 */
export class SharedPostgresStore implements DataStore {
  constructor(
    private tenantConfig: TenantConfig,
    private prisma: PrismaClient | typeof db = db
  ) {}

  /**
   * Sanitizes error messages to prevent sensitive data exposure
   * Returns full error details in development, generic message in production
   */
  private sanitizeError(error: unknown): string {
    if (process.env.NODE_ENV === 'development') {
      return String(error);
    }
    return 'An internal error occurred';
  }

  /**
   * Sets the tenant context for RLS before any operation
   */
  private async setTenantContext(): Promise<void> {
    try {
      // Use raw SQL to set the tenant context for RLS
      await this.prisma.$executeRaw`SELECT set_tenant(${this.tenantConfig.id}::uuid)`;
    } catch (error) {
      throw new DataStoreError(
        `Failed to set tenant context: ${this.sanitizeError(error)}`,
        'TENANT_CONTEXT_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  // ============================================================================
  // APPOINTMENT MANAGEMENT
  // ============================================================================

  async getTodaysAppointments(clinicianId: string, date: Date = new Date()): Promise<Appointment[]> {
    await this.setTenantContext();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // For Phase 2A, we'll generate appointments from consultations
      // In a real EHR integration, this would come from external appointment data
      const consultations = await this.prisma.consultation.findMany({
        where: {
          tenantId: this.tenantConfig.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          patient: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return consultations.map(consultation => this.mapConsultationToAppointment(consultation, clinicianId));
    } catch (error) {
      throw new DataStoreError(
        `Failed to get today's appointments: ${this.sanitizeError(error)}`,
        'APPOINTMENTS_FETCH_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async getAppointment(appointmentId: string): Promise<Appointment> {
    await this.setTenantContext();
    
    try {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: appointmentId },
        include: { patient: true },
      });

      if (!consultation) {
        throw new ConsultationNotFoundError(appointmentId, this.tenantConfig.id);
      }

      return this.mapConsultationToAppointment(consultation, 'current-clinician'); // TODO: Get from session
    } catch (error) {
      if (error instanceof ConsultationNotFoundError) throw error;
      throw new DataStoreError(
        `Failed to get appointment: ${this.sanitizeError(error)}`,
        'APPOINTMENT_FETCH_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
    await this.setTenantContext();
    
    // Map appointment status to consultation status
    const consultationStatus = this.mapAppointmentStatusToConsultationStatus(status);
    
    try {
      await this.prisma.consultation.update({
        where: { id: appointmentId },
        data: { status: consultationStatus as 'READY' | 'RECORDING' | 'PROCESSING' | 'REVIEW' | 'COMPLETE' | 'ERROR' },
      });
    } catch (error) {
      throw new DataStoreError(
        `Failed to update appointment status: ${this.sanitizeError(error)}`,
        'APPOINTMENT_UPDATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  // ============================================================================
  // PATIENT DATA
  // ============================================================================

  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    await this.setTenantContext();
    
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          consultations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { consultations: true },
          },
        },
      });

      if (!patient) {
        throw new PatientNotFoundError(patientId, this.tenantConfig.id);
      }

      return {
        id: patient.id,
        ehrPatientId: patient.ehrPatientId ?? patient.id, // Use internal ID if no EHR ID
        ehrSystem: 'other', // Standalone mode
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth ?? null,
        age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : 0,
        gender: (patient.gender === 'OTHER' ? 'Other' : patient.gender as 'M' | 'F' | 'Other' | 'Unknown') ?? 'Unknown',
        phone: patient.phone ?? undefined,
        email: patient.email ?? undefined,
        lastVisit: patient.consultations[0]?.createdAt,
        totalVisits: patient._count.consultations,
        lastSyncedAt: patient.updatedAt,
        isStale: false, // Data is always fresh in standalone mode
      };
    } catch (error) {
      if (error instanceof PatientNotFoundError) throw error;
      throw new DataStoreError(
        `Failed to get patient summary: ${this.sanitizeError(error)}`,
        'PATIENT_FETCH_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async getPatientContext(patientId: string): Promise<PatientContext> {
    const summary = await this.getPatientSummary(patientId);
    
    // For Phase 2A, we'll return minimal context
    // In future phases, this could include medications, allergies, etc.
    return {
      summary,
      medications: [],
      allergies: [],
      recentNotes: await this.getRecentNotes(patientId),
      alerts: [],
      medicationsLoading: false,
      allergiesLoading: false,
      notesLoading: false,
    };
  }

  // ============================================================================
  // CLINICAL NOTES
  // ============================================================================

  async createClinicalNote(patientId: string, note: ClinicalNoteInput): Promise<ClinicalNote> {
    await this.setTenantContext();
    
    try {
      const clinicalNote = await this.prisma.clinicalNote.create({
        data: {
          tenantId: this.tenantConfig.id,
          patientId,
          consultationId: note.consultationId,
          title: note.title,
          content: note.content,
          noteType: (note.noteType?.toUpperCase() as 'PROGRESS' | 'SOAP' | 'ASSESSMENT' | 'PLAN' | 'REFERRAL' | 'OTHER') ?? 'PROGRESS',
          template: note.template,
          generatedFromAudio: note.generatedFromAudio ?? false,
          transcriptionId: note.transcriptionId,
          aiConfidence: note.aiConfidence,
        },
      });

      return this.mapPrismaNoteToClientNote(clinicalNote);
    } catch (error) {
      throw new DataStoreError(
        `Failed to create clinical note: ${this.sanitizeError(error)}`,
        'NOTE_CREATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async updateClinicalNote(noteId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote> {
    await this.setTenantContext();
    
    try {
      const clinicalNote = await this.prisma.clinicalNote.update({
        where: { id: noteId },
        data: {
          title: updates.title,
          content: updates.content,
          status: updates.status?.toUpperCase().replace('-', '_') as 'DRAFT' | 'PENDING_REVIEW' | 'FINAL' | 'AMENDED' | 'SIGNED',
          manuallyEdited: true,
          signedAt: updates.status === 'signed' ? new Date() : (updates.status?.toUpperCase().replace('-', '_') === 'SIGNED' ? new Date() : undefined),
        },
      });

      return this.mapPrismaNoteToClientNote(clinicalNote);
    } catch (error) {
      throw new DataStoreError(
        `Failed to update clinical note: ${this.sanitizeError(error)}`,
        'NOTE_UPDATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  // ============================================================================
  // DASHBOARD DATA
  // ============================================================================

  async getDashboardStats(clinicianId: string, date: Date = new Date()): Promise<DashboardStats> {
    await this.setTenantContext();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const [consultations, notes] = await Promise.all([
        this.prisma.consultation.findMany({
          where: {
            tenantId: this.tenantConfig.id,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.clinicalNote.findMany({
          where: {
            tenantId: this.tenantConfig.id,
            createdAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
      ]);

      const completed = consultations.filter(c => c.status === 'COMPLETE').length;
      const scheduled = consultations.length;
      const recording = consultations.filter(c => c.status === 'RECORDING').length;
      const remaining = consultations.filter(c => ['READY', 'RECORDING', 'PROCESSING'].includes(c.status)).length;
      const awaitingReview = notes.filter(n => n.status === 'PENDING_REVIEW').length;
      const processing = consultations.filter(c => c.status === 'PROCESSING').length;

      return {
        consultationsCompleted: completed,
        consultationsScheduled: scheduled,
        currentlyRecording: recording,
        appointmentsRemaining: remaining,
        notesAwaitingReview: awaitingReview,
        audioFilesProcessing: processing,
        averageConsultationTime: this.calculateAverageConsultationTime(consultations),
        timesSaved: completed * 15, // Assume 15 minutes saved per consultation
        notesGenerated: notes.length,
        transcriptionAccuracy: 95, // Mock value for now
      };
    } catch (error) {
      throw new DataStoreError(
        `Failed to get dashboard stats: ${this.sanitizeError(error)}`,
        'DASHBOARD_STATS_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async getPendingActions(_clinicianId: string): Promise<PendingAction[]> {
    await this.setTenantContext();
    
    try {
      const notes = await this.prisma.clinicalNote.findMany({
        where: {
          tenantId: this.tenantConfig.id,
          status: 'PENDING_REVIEW',
        },
        include: {
          patient: true,
          consultation: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return notes.map(note => ({
        id: note.id,
        type: 'note-review' as const,
        priority: 'medium' as const,
        title: `Review note: ${note.title}`,
        description: `Clinical note for ${note.patient.firstName} ${note.patient.lastName} needs review`,
        patientName: `${note.patient.firstName} ${note.patient.lastName}`,
        appointmentTime: note.consultation?.createdAt,
        actionUrl: `/consultations/${note.consultationId}`,
        createdAt: note.createdAt,
        dismissible: true,
      }));
    } catch (error) {
      throw new DataStoreError(
        `Failed to get pending actions: ${this.sanitizeError(error)}`,
        'PENDING_ACTIONS_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  // ============================================================================
  // PATIENT MANAGEMENT (Standalone Mode)
  // ============================================================================

  async createPatient(patient: CreatePatientInput): Promise<PatientSummary> {
    await this.setTenantContext();
    
    try {
      const newPatient = await this.prisma.patient.create({
        data: {
          tenantId: this.tenantConfig.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender?.toUpperCase() as 'M' | 'F' | 'OTHER' | 'UNKNOWN',
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          source: (patient.source?.toUpperCase().replace('-', '_') as 'ARIA_SCRIBE' | 'EHR' | 'IMPORTED') ?? 'ARIA_SCRIBE',
        },
      });

      return this.getPatientSummary(newPatient.id);
    } catch (error) {
      throw new DataStoreError(
        `Failed to create patient: ${this.sanitizeError(error)}`,
        'PATIENT_CREATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async updatePatient(patientId: string, updates: UpdatePatientInput): Promise<PatientSummary> {
    await this.setTenantContext();
    
    try {
      await this.prisma.patient.update({
        where: { id: patientId },
        data: {
          firstName: updates.firstName,
          lastName: updates.lastName,
          dateOfBirth: updates.dateOfBirth,
          gender: updates.gender?.toUpperCase() as 'M' | 'F' | 'OTHER' | 'UNKNOWN',
          phone: updates.phone,
          email: updates.email,
          address: updates.address,
        },
      });

      return this.getPatientSummary(patientId);
    } catch (error) {
      throw new DataStoreError(
        `Failed to update patient: ${this.sanitizeError(error)}`,
        'PATIENT_UPDATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async searchPatients(query: string, limit = 20): Promise<PatientSummary[]> {
    await this.setTenantContext();
    
    try {
      const patients = await this.prisma.patient.findMany({
        where: {
          tenantId: this.tenantConfig.id,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
      });

      return Promise.all(patients.map(p => this.getPatientSummary(p.id)));
    } catch (error) {
      throw new DataStoreError(
        `Failed to search patients: ${this.sanitizeError(error)}`,
        'PATIENT_SEARCH_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async getRecentPatients(limit = 20): Promise<PatientSummary[]> {
    await this.setTenantContext();
    
    try {
      const patients = await this.prisma.patient.findMany({
        where: {
          tenantId: this.tenantConfig.id,
        },
        take: limit,
        orderBy: [
          { lastConsultation: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return Promise.all(patients.map(p => this.getPatientSummary(p.id)));
    } catch (error) {
      throw new DataStoreError(
        `Failed to fetch recent patients: ${this.sanitizeError(error)}`,
        'RECENT_PATIENTS_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  // ============================================================================
  // CONSULTATION MANAGEMENT
  // ============================================================================

  async createConsultation(consultation: CreateConsultationInput): Promise<ConsultationRecord> {
    await this.setTenantContext();
    
    try {
      const newConsultation = await this.prisma.consultation.create({
        data: {
          tenantId: this.tenantConfig.id,
          patientId: consultation.patientId,
          mode: consultation.mode.toUpperCase().replace('-', '_') as 'STANDALONE' | 'EHR_INTEGRATED',
          selectedTemplate: consultation.selectedTemplate,
          status: 'READY',
        },
      });

      return {
        id: newConsultation.id,
        tenantId: newConsultation.tenantId,
        patientId: newConsultation.patientId,
        mode: newConsultation.mode.toLowerCase().replace('_', '-') as 'standalone' | 'ehr-integrated',
        status: newConsultation.status.toLowerCase() as any,
        recordingStartTime: newConsultation.recordingStartTime ?? undefined,
        recordingEndTime: newConsultation.recordingEndTime ?? undefined,
        audioFileUrl: newConsultation.audioFileUrl ?? undefined,
        transcriptionText: newConsultation.transcriptionText ?? undefined,
        selectedTemplate: newConsultation.selectedTemplate ?? undefined,
        createdAt: newConsultation.createdAt,
        updatedAt: newConsultation.updatedAt,
      };
    } catch (error) {
      throw new DataStoreError(
        `Failed to create consultation: ${this.sanitizeError(error)}`,
        'CONSULTATION_CREATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async updateConsultation(consultationId: string, updates: UpdateConsultationInput): Promise<ConsultationRecord> {
    await this.setTenantContext();
    
    try {
      const consultation = await this.prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: updates.status?.toUpperCase() as 'READY' | 'RECORDING' | 'PROCESSING' | 'REVIEW' | 'COMPLETE' | 'ERROR',
          recordingStartTime: updates.recordingStartTime,
          recordingEndTime: updates.recordingEndTime,
          audioFileUrl: updates.audioFileUrl,
          transcriptionText: updates.transcriptionText,
          selectedTemplate: updates.selectedTemplate,
        },
      });

      return this.getConsultation(consultation.id);
    } catch (error) {
      throw new DataStoreError(
        `Failed to update consultation: ${this.sanitizeError(error)}`,
        'CONSULTATION_UPDATE_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  async getConsultation(consultationId: string): Promise<ConsultationRecord> {
    await this.setTenantContext();
    
    try {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        throw new ConsultationNotFoundError(consultationId, this.tenantConfig.id);
      }

      return {
        id: consultation.id,
        tenantId: consultation.tenantId,
        patientId: consultation.patientId,
        mode: consultation.mode.toLowerCase().replace('_', '-') as 'standalone' | 'ehr-integrated',
        status: consultation.status.toLowerCase() as any,
        recordingStartTime: consultation.recordingStartTime ?? undefined,
        recordingEndTime: consultation.recordingEndTime ?? undefined,
        audioFileUrl: consultation.audioFileUrl ?? undefined,
        transcriptionText: consultation.transcriptionText ?? undefined,
        selectedTemplate: consultation.selectedTemplate ?? undefined,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
      };
    } catch (error) {
      if (error instanceof ConsultationNotFoundError) throw error;
      throw new DataStoreError(
        `Failed to get consultation: ${this.sanitizeError(error)}`,
        'CONSULTATION_FETCH_ERROR',
        this.tenantConfig.id,
        error as Error
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private mapConsultationToAppointment(consultation: Consultation & { patient: Patient }, clinicianId: string): Appointment {
    return {
      id: consultation.id,
      ehrAppointmentId: consultation.id,
      patientId: consultation.patientId,
      clinicianId,
      scheduledTime: consultation.createdAt,
      duration: 30, // Default 30 minutes
      appointmentType: 'Consultation',
      status: this.mapConsultationStatusToAppointmentStatus(consultation.status),
      patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
      patientAge: consultation.patient.dateOfBirth ? this.calculateAge(consultation.patient.dateOfBirth) : 0,
      patientGender: (consultation.patient.gender === 'OTHER' ? 'Other' : consultation.patient.gender as 'M' | 'F' | 'Other' | 'Unknown') ?? 'Unknown',
      patientEmail: consultation.patient.email ?? '',
      consultationId: consultation.id,
              recordingStartTime: consultation.recordingStartTime ?? undefined,
        recordingEndTime: consultation.recordingEndTime ?? undefined,
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
    };
  }

  private mapConsultationStatusToAppointmentStatus(status: string): AppointmentStatus {
    const statusMap: Record<string, AppointmentStatus> = {
      'READY': 'scheduled',
      'RECORDING': 'recording',
      'PROCESSING': 'processing',
      'REVIEW': 'processing',
      'COMPLETE': 'completed',
      'ERROR': 'cancelled',
    };
    return statusMap[status] || 'scheduled';
  }

  private mapAppointmentStatusToConsultationStatus(status: AppointmentStatus): string {
    const statusMap: Record<AppointmentStatus, string> = {
      'scheduled': 'READY',
      'waiting': 'READY',
      'in-progress': 'RECORDING',
      'recording': 'RECORDING',
      'processing': 'PROCESSING',
      'completed': 'COMPLETE',
      'cancelled': 'ERROR',
      'no-show': 'ERROR',
    };
    return statusMap[status] ?? 'READY';
  }

  private mapPrismaNoteToClientNote(note: PrismaClinicalNote): ClinicalNote {
    return {
      id: note.id,
      ehrNoteId: note.id,
      patientId: note.patientId,
      clinicianId: 'current-clinician', // TODO: Get from session
      consultationId: note.consultationId ?? undefined,
      title: note.title,
      content: note.content,
      noteType: note.noteType.toLowerCase() as 'progress' | 'soap' | 'assessment' | 'plan' | 'referral' | 'other',
      template: note.template ?? undefined,
      status: note.status.toLowerCase().replace('_', '-') as 'draft' | 'pending-review' | 'final' | 'amended' | 'signed',
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      signedAt: note.signedAt ?? undefined,
      generatedFromAudio: note.generatedFromAudio,
      transcriptionId: note.transcriptionId ?? undefined,
      aiConfidence: note.aiConfidence ?? undefined,
      manuallyEdited: note.manuallyEdited,
    };
  }

  private async getRecentNotes(patientId: string): Promise<ClinicalNote[]> {
    await this.setTenantContext();
    
    const notes = await this.prisma.clinicalNote.findMany({
      where: {
        tenantId: this.tenantConfig.id,
        patientId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return notes.map(note => this.mapPrismaNoteToClientNote(note));
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateAverageConsultationTime(consultations: Consultation[]): number {
    const completedWithTimes = consultations.filter((c): c is Consultation & { recordingStartTime: Date; recordingEndTime: Date } => 
      c.recordingStartTime != null && c.recordingEndTime != null
    );
    
    if (completedWithTimes.length === 0) return 0;
    
    const totalMinutes = completedWithTimes.reduce((sum, c) => {
      const duration = (c.recordingEndTime.getTime() - c.recordingStartTime.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);
    
    return Math.round(totalMinutes / completedWithTimes.length);
  }
}