/**
 * Custom hook for managing consultation workflows in Phase 2A
 * 
 * This hook provides consultation management functionality for standalone mode,
 * including creating consultations, managing recording state, and handling
 * the consultation lifecycle.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ClinicalNote, EHRProvider } from '@/types/clinical';
import { getCurrentUserEHRService } from '@/services';
import type { StandaloneClinicService } from '@/services/StandaloneClinicService';

// ============================================================================
// TYPE GUARDS AND INTERFACES
// ============================================================================

/**
 * Interface for EHR services that support consultation management
 */
interface EHRServiceWithConsultations extends EHRProvider {
  getConsultation(consultationId: string): Promise<ConsultationData>;
  updateConsultation(consultationId: string, updates: Partial<ConsultationData>): Promise<ConsultationData>;
}

/**
 * Type guard to check if an EHR service has consultation capabilities
 */
function hasConsultationSupport(service: EHRProvider): service is EHRServiceWithConsultations {
  const serviceWithUnknownMethods = service as unknown as Record<string, unknown>;
  return 'getConsultation' in service && 
         typeof serviceWithUnknownMethods.getConsultation === 'function' &&
         'updateConsultation' in service && 
         typeof serviceWithUnknownMethods.updateConsultation === 'function';
}

interface ConsultationData {
  id: string;
  patientId: string;
  status: 'ready' | 'recording' | 'processing' | 'review' | 'complete' | 'error';
  recordingStartTime?: Date;
  recordingEndTime?: Date;
  audioFileUrl?: string;
  transcriptionText?: string;
  selectedTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateConsultationData {
  patientId: string;
  selectedTemplate?: string;
}

interface UseConsultationOptions {
  consultationId?: string;
  enabled?: boolean;
}

interface UseConsultationResult {
  consultation: ConsultationData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  updateStatus: (status: ConsultationData['status']) => Promise<void>;
}

interface UseCreateConsultationResult {
  createConsultation: (data: CreateConsultationData) => Promise<ConsultationData | null>;
  loading: boolean;
  error: string | null;
}

interface UseClinicalNotesOptions {
  patientId?: string;
  consultationId?: string;
  enabled?: boolean;
}

interface UseClinicalNotesResult {
  notes: ClinicalNote[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createNote: (note: {
    title: string;
    content: string;
    noteType?: string;
    template?: string;
  }) => Promise<ClinicalNote | null>;
  updateNote: (noteId: string, updates: Partial<ClinicalNote>) => Promise<ClinicalNote | null>;
}

// ============================================================================
// CONSULTATION MANAGEMENT HOOK
// ============================================================================

/**
 * Hook for managing a single consultation
 */
export function useConsultation(options: UseConsultationOptions = {}): UseConsultationResult {
  const { consultationId, enabled = true } = options;

  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultation = useCallback(async () => {
    if (!enabled || !consultationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();
      
      // Check if this is a service with consultation capability using type guard
      if (hasConsultationSupport(ehrService)) {
        const consultationData = await ehrService.getConsultation(consultationId);
        setConsultation(consultationData);

        if (process.env.NODE_ENV === 'development') {
          console.log(`📋 Fetched consultation: ${consultationId} (${consultationData.status})`);
        }
      } else {
        throw new Error('Consultation management not supported by current EHR service');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consultation';
      setError(errorMessage);
      console.error('Error fetching consultation:', err);
    } finally {
      setLoading(false);
    }
  }, [consultationId, enabled]);

  const updateConsultation = useCallback(async (updates: Partial<ConsultationData>) => {
    if (!consultationId) return;

    try {
      const ehrService = await getCurrentUserEHRService();
      
      if (hasConsultationSupport(ehrService)) {
        const updatedConsultation = await ehrService.updateConsultation(consultationId, updates);
        setConsultation(updatedConsultation);
      } else {
        throw new Error('Consultation management not supported by current EHR service');
      }
    } catch (err) {
      console.error('Error updating consultation:', err);
      throw err;
    }
  }, [consultationId]);

  const startRecording = useCallback(async () => {
    await updateConsultation({
      status: 'recording',
      recordingStartTime: new Date(),
    });
  }, [updateConsultation]);

  const stopRecording = useCallback(async () => {
    await updateConsultation({
      status: 'processing',
      recordingEndTime: new Date(),
    });
  }, [updateConsultation]);

  const updateStatus = useCallback(async (status: ConsultationData['status']) => {
    await updateConsultation({ status });
  }, [updateConsultation]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

  return {
    consultation,
    loading,
    error,
    refetch: fetchConsultation,
    startRecording,
    stopRecording,
    updateStatus,
  };
}

// ============================================================================
// CREATE CONSULTATION HOOK
// ============================================================================

/**
 * Hook for creating new consultations
 */
export function useCreateConsultation(): UseCreateConsultationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConsultation = useCallback(async (data: CreateConsultationData): Promise<ConsultationData | null> => {
    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();
      
      // Check if this is a standalone service with create capability
      if ('createConsultation' in ehrService) {
        const newConsultation = await (ehrService as StandaloneClinicService).createConsultation(data);

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Created consultation: ${newConsultation.id} for patient ${newConsultation.patientId}`);
        }

        return newConsultation as ConsultationData;
      } else {
        throw new Error('Consultation creation not supported in EHR-integrated mode');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create consultation';
      setError(errorMessage);
      console.error('Error creating consultation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createConsultation,
    loading,
    error,
  };
}

// ============================================================================
// CLINICAL NOTES HOOK
// ============================================================================

/**
 * Hook for managing clinical notes
 */
export function useClinicalNotes(options: UseClinicalNotesOptions = {}): UseClinicalNotesResult {
  const { patientId, consultationId, enabled = true } = options;

  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!enabled || (!patientId && !consultationId)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For now, we'll implement this as part of patient context
      // In a full implementation, this would be a separate API call
      const ehrService = await getCurrentUserEHRService();
      
      if (patientId) {
        const context = await ehrService.getPatientContext(patientId);
        setNotes(context.recentNotes || []);
      } else {
        // TODO: Implement consultation-specific notes fetch
        setNotes([]);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 Fetched ${notes.length} clinical notes`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clinical notes';
      setError(errorMessage);
      console.error('Error fetching clinical notes:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, consultationId, enabled]);

  const createNote = useCallback(async (noteData: {
    title: string;
    content: string;
    noteType?: string;
    template?: string;
  }): Promise<ClinicalNote | null> => {
    if (!patientId) {
      setError('Patient ID required to create note');
      return null;
    }

    try {
      const ehrService = await getCurrentUserEHRService();
      
      const newNote = await ehrService.createClinicalNote(patientId, {
        title: noteData.title,
        content: noteData.content,
        noteType: noteData.noteType as any,
        template: noteData.template,
        consultationId,
      });

      // Add to local state
      setNotes(prev => [newNote, ...prev]);

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Created clinical note: ${newNote.title}`);
      }

      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create clinical note';
      setError(errorMessage);
      console.error('Error creating clinical note:', err);
      return null;
    }
  }, [patientId, consultationId]);

  const updateNote = useCallback(async (
    noteId: string, 
    updates: Partial<ClinicalNote>
  ): Promise<ClinicalNote | null> => {
    try {
      const ehrService = await getCurrentUserEHRService();
      
      const updatedNote = await ehrService.updateClinicalNote(noteId, updates);

      // Update local state
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ));

      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 Updated clinical note: ${noteId}`);
      }

      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update clinical note';
      setError(errorMessage);
      console.error('Error updating clinical note:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
  };
}

// ============================================================================
// PENDING ACTIONS HOOK
// ============================================================================

/**
 * Hook for getting pending actions that require attention
 */
export function usePendingActions() {
  const [actions, setActions] = useState<Array<{
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
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();
      
      // Check if this is a standalone service with pending actions capability
      if ('getPendingActions' in ehrService) {
        const actionsData = await (ehrService as StandaloneClinicService).getPendingActions();
        setActions(actionsData);

        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ Found ${actionsData.length} pending actions`);
        }
      } else {
        setActions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pending actions';
      setError(errorMessage);
      console.error('Error fetching pending actions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return {
    actions,
    loading,
    error,
    refetch: fetchActions,
  };
}