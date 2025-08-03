/**
 * Custom hook for managing patient data in Phase 2A
 * 
 * This hook provides patient management functionality for standalone mode,
 * including CRUD operations, search, and patient context management.
 */

import { useState, useEffect, useCallback } from 'react';
import type { PatientSummary, PatientContext, EHRProvider } from '@/types/clinical';
import { getCurrentUserEHRService } from '@/services';
import type { StandaloneClinicService } from '@/services/StandaloneClinicService';

interface UsePatientOptions {
  patientId?: string;
  enabled?: boolean;
}

interface UsePatientResult {
  patient: PatientSummary | null;
  context: PatientContext | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UsePatientSearchOptions {
  query?: string;
  limit?: number;
  enabled?: boolean;
}

interface UsePatientSearchResult {
  patients: PatientSummary[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

interface CreatePatientData {
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
}

interface UpdatePatientData {
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

// ============================================================================
// PATIENT DETAILS HOOK
// ============================================================================

/**
 * Hook for fetching and managing a single patient's data
 */
export function usePatient(options: UsePatientOptions = {}): UsePatientResult {
  const { patientId, enabled = true } = options;

  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [context, setContext] = useState<PatientContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!enabled || !patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();

      // Fetch patient summary and context in parallel
      const [patientData, contextData] = await Promise.all([
        ehrService.getPatientSummary(patientId),
        ehrService.getPatientContext(patientId),
      ]);

      setPatient(patientData);
      setContext(contextData);

      if (process.env.NODE_ENV === 'development') {
        console.log(`👤 Fetched patient: ${patientData.firstName} ${patientData.lastName}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient';
      setError(errorMessage);
      console.error('Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId, enabled]);

  useEffect(() => {
    void fetchPatient();
  }, [fetchPatient]);

  return {
    patient,
    context,
    loading,
    error,
    refetch: fetchPatient,
  };
}

// ============================================================================
// PATIENT SEARCH HOOK
// ============================================================================

/**
 * Hook for searching patients
 */
export function usePatientSearch(options: UsePatientSearchOptions = {}): UsePatientSearchResult {
  const { query: initialQuery = '', limit = 20, enabled = true } = options;

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!enabled || !query.trim()) {
      setPatients([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();
      
      // Check if this is a standalone service with search capability
      if ('searchPatients' in ehrService) {
        const results = await (ehrService as StandaloneClinicService).searchPatients(query, limit);
        setPatients(results);

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Found ${results.length} patients for query: "${query}"`);
        }
      } else {
        // Fallback for EHR services that don't support search
        console.warn('Patient search not supported by current EHR service');
        setPatients([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search patients';
      setError(errorMessage);
      console.error('Error searching patients:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, limit]);

  const clear = useCallback(() => {
    setPatients([]);
    setError(null);
  }, []);

  // Initial search if query provided
  useEffect(() => {
    if (initialQuery) {
      void search(initialQuery);
    }
  }, [initialQuery, search]);

  return {
    patients,
    loading,
    error,
    search,
    clear,
  };
}

// ============================================================================
// PATIENT MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for creating patients (standalone mode only)
 */
export function useCreatePatient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPatient = useCallback(async (patientData: CreatePatientData): Promise<PatientSummary | null> => {
    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();
      
      // Check if this is a standalone service with create capability
      if ('createPatient' in ehrService) {
        const newPatient = await (ehrService as StandaloneClinicService).createPatient(patientData);

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Created patient: ${newPatient.firstName} ${newPatient.lastName}`);
        }

        return newPatient;
      } else {
        throw new Error('Patient creation not supported in EHR-integrated mode');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      setError(errorMessage);
      console.error('Error creating patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPatient,
    loading,
    error,
  };
}

/**
 * Hook for updating patients (standalone mode only)
 */
export function useUpdatePatient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePatient = useCallback(async (
    patientId: string, 
    updates: UpdatePatientData
  ): Promise<PatientSummary | null> => {
    try {
      setLoading(true);
      setError(null);

      const ehrService = await getCurrentUserEHRService();
      
      // Check if this is a standalone service with update capability
      if ('updatePatient' in ehrService) {
        const updatedPatient = await (ehrService as StandaloneClinicService).updatePatient(patientId, updates);

        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 Updated patient: ${updatedPatient.firstName} ${updatedPatient.lastName}`);
        }

        return updatedPatient;
      } else {
        throw new Error('Patient updates not supported in EHR-integrated mode');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      setError(errorMessage);
      console.error('Error updating patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updatePatient,
    loading,
    error,
  };
}

// ============================================================================
// PATIENT LIST HOOK
// ============================================================================

/**
 * Hook for getting a list of recent patients
 */
export function useRecentPatients(limit = 10) {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ehrService: EHRProvider = await getCurrentUserEHRService();
      
      // Use dedicated getRecentPatients method for accurate retrieval
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
      const results = await ehrService.getRecentPatients(limit);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setPatients(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent patients';
      setError(errorMessage);
      console.error('Error fetching recent patients:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchRecentPatients();
  }, [fetchRecentPatients]);

  return {
    patients,
    loading,
    error,
    refetch: fetchRecentPatients,
  };
}