/**
 * Custom hook for managing appointment data with Phase 2A support
 * 
 * This hook provides a React Query-like interface for fetching
 * and managing appointment data. It automatically chooses between
 * standalone and EHR-integrated modes based on tenant configuration.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Appointment, DashboardStats } from '@/types/clinical';
import { getCurrentUserEHRService } from '@/services';

interface UseAppointmentsOptions {
  clinicianId?: string;
  date?: Date;
  refreshInterval?: number; // milliseconds
  enabled?: boolean;
}

interface UseAppointmentsResult {
  appointments: Appointment[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => Promise<void>;
}

/**
 * Hook for fetching and managing today's appointments
 */
export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsResult {
  const {
    clinicianId = 'current-clinician',
    date = new Date(),
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
  } = options;

  // Stabilize the date string to prevent infinite re-renders
  const dateString = date.toISOString().split('T')[0]; // Just the date part (YYYY-MM-DD)

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch appointments and stats
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Get the appropriate EHR service (standalone or integrated)
      const ehrService = await getCurrentUserEHRService();

      // Fetch appointments and stats in parallel
      const [appointmentsData, statsData] = await Promise.all([
        ehrService.getTodaysAppointments(clinicianId, date),
        // For standalone mode, get stats from the service
        (ehrService as any).getDashboardStats ? 
          (ehrService as any).getDashboardStats(date) : 
          generateStatsFromAppointments(await ehrService.getTodaysAppointments(clinicianId, date)),
      ]);

      setAppointments(appointmentsData);
      
      // Only update stats if they actually changed to prevent infinite re-renders
      setStats(prevStats => {
        if (!prevStats) return statsData;
        
        const hasChanged = JSON.stringify(prevStats) !== JSON.stringify(statsData);
        return hasChanged ? statsData : prevStats;
      });
      
      setLastUpdated(new Date());

      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 Fetched ${appointmentsData.length} appointments for ${clinicianId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMessage);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [clinicianId, dateString, enabled]);

  // Update appointment status
  const updateAppointmentStatus = useCallback(async (
    appointmentId: string, 
    status: Appointment['status']
  ) => {
    try {
      // Optimistic update
      setAppointments(prev => prev.map(appt => 
        appt.id === appointmentId 
          ? { ...appt, status, updatedAt: new Date() }
          : appt
      ));

      // Get the appropriate EHR service
      const ehrService = await getCurrentUserEHRService();

      // Update via service
      await ehrService.updateAppointmentStatus(appointmentId, status);

      // Refresh stats after status change
      const newStats = (ehrService as any).getDashboardStats ? 
        await (ehrService as any).getDashboardStats(date) : 
        generateStatsFromAppointments(await ehrService.getTodaysAppointments(clinicianId, date));
        
      setStats(prevStats => {
        if (!prevStats) return newStats;
        
        const hasChanged = JSON.stringify(prevStats) !== JSON.stringify(newStats);
        return hasChanged ? newStats : prevStats;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 Updated appointment ${appointmentId} status to: ${status}`);
      }
    } catch (err) {
      // Revert optimistic update on error
      await fetchData();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMessage);
      throw err;
    }
  }, [clinicianId, dateString, date]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  return {
    appointments,
    stats,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
    updateAppointmentStatus,
  };
}

/**
 * Hook for getting appointments by specific status
 */
export function useAppointmentsByStatus(
  status: Appointment['status'],
  options: UseAppointmentsOptions = {}
) {
  const { appointments, ...rest } = useAppointments(options);
  
  const filteredAppointments = appointments.filter(appt => appt.status === status);
  
  return {
    appointments: filteredAppointments,
    count: filteredAppointments.length,
    ...rest,
  };
}

/**
 * Hook for getting current/active appointment (if any)
 */
export function useCurrentAppointment(options: UseAppointmentsOptions = {}) {
  const { appointments, ...rest } = useAppointments(options);
  
  // Find appointment that's currently in progress or recording
  const currentAppointment = appointments.find(appt => 
    appt.status === 'in-progress' || appt.status === 'recording'
  );
  
  return {
    appointment: currentAppointment || null,
    hasCurrentAppointment: !!currentAppointment,
    ...rest,
  };
}

/**
 * Hook for getting next upcoming appointment
 */
export function useNextAppointment(options: UseAppointmentsOptions = {}) {
  const { appointments, ...rest } = useAppointments(options);
  
  const now = new Date();
  const upcomingAppointments = appointments
    .filter(appt => 
      appt.scheduledTime > now && 
      ['scheduled', 'waiting'].includes(appt.status)
    )
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  
  return {
    appointment: upcomingAppointments[0] || null,
    hasNextAppointment: upcomingAppointments.length > 0,
    upcomingCount: upcomingAppointments.length,
    ...rest,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate dashboard stats from appointments array
 * Used as fallback when EHR service doesn't provide stats directly
 */
function generateStatsFromAppointments(appointments: Appointment[]): DashboardStats {
  const completed = appointments.filter(a => a.status === 'completed').length;
  const recording = appointments.filter(a => a.status === 'recording').length;
  const processing = appointments.filter(a => a.status === 'processing').length;
  const remaining = appointments.filter(a => 
    ['scheduled', 'waiting', 'in-progress', 'recording'].includes(a.status)
  ).length;

  return {
    consultationsCompleted: completed,
    consultationsScheduled: appointments.length,
    currentlyRecording: recording,
    appointmentsRemaining: remaining,
    notesAwaitingReview: 0, // Would need to fetch from notes service
    audioFilesProcessing: processing,
    averageConsultationTime: 30, // Default estimate
    timesSaved: completed * 15, // Assume 15 minutes saved per consultation
    notesGenerated: completed,
    transcriptionAccuracy: 95, // Default estimate
  };
}