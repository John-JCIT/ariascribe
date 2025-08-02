/**
 * Mock Appointment Data Service
 * 
 * Generates realistic appointment data for development and testing.
 * This service creates fictional but clinically realistic appointments
 * that match the patterns doctors would see in their daily schedule.
 */

import { addMinutes, format, startOfDay } from 'date-fns';
import type { 
  Appointment, 
  AppointmentStatus, 
  MockDataOptions,
  MockGenerationResult 
} from '@/types/clinical';

// ============================================================================
// MOCK DATA CONSTANTS
// ============================================================================

const APPOINTMENT_TYPES = [
  'General Consultation',
  'Follow-up',
  'Annual Health Check',
  'Chronic Disease Management',
  'Mental Health Review',
  'Immunisation',
  'Minor Procedure',
  'Telehealth Consultation',
  'Emergency Consultation',
  'Specialist Referral Discussion',
] as const;

const PATIENT_NAMES = [
  { first: 'Sarah', last: 'Johnson', age: 34, gender: 'F' as const },
  { first: 'Michael', last: 'Chen', age: 42, gender: 'M' as const },
  { first: 'Emma', last: 'Williams', age: 28, gender: 'F' as const },
  { first: 'James', last: 'Brown', age: 56, gender: 'M' as const },
  { first: 'Lisa', last: 'Davis', age: 45, gender: 'F' as const },
  { first: 'Robert', last: 'Wilson', age: 38, gender: 'M' as const },
  { first: 'Jennifer', last: 'Taylor', age: 52, gender: 'F' as const },
  { first: 'David', last: 'Anderson', age: 29, gender: 'M' as const },
  { first: 'Michelle', last: 'Thomas', age: 41, gender: 'F' as const },
  { first: 'Christopher', last: 'Jackson', age: 33, gender: 'M' as const },
  { first: 'Amanda', last: 'White', age: 47, gender: 'F' as const },
  { first: 'Matthew', last: 'Harris', age: 35, gender: 'M' as const },
  { first: 'Rebecca', last: 'Martin', age: 39, gender: 'F' as const },
  { first: 'Andrew', last: 'Thompson', age: 44, gender: 'M' as const },
  { first: 'Jessica', last: 'Garcia', age: 31, gender: 'F' as const },
] as const;

const TYPICAL_DURATIONS = [15, 20, 30, 45, 60] as const;

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

/**
 * Generates a deterministic random number based on seed
 */
function seededRandom(seed: string, index: number): number {
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const x = Math.sin(hash + index) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates realistic appointment statuses based on time of day
 */
function generateAppointmentStatus(scheduledTime: Date, now: Date): AppointmentStatus {
  const appointmentTime = scheduledTime.getTime();
  const currentTime = now.getTime();
  const timeDiff = appointmentTime - currentTime;
  
  // Future appointments
  if (timeDiff > 30 * 60 * 1000) { // More than 30 minutes in future
    return 'scheduled';
  }
  
  // Recent past appointments (within last 2 hours)
  if (timeDiff < 0 && Math.abs(timeDiff) < 2 * 60 * 60 * 1000) {
    const outcomes: AppointmentStatus[] = ['completed', 'completed', 'completed', 'processing'];
    return outcomes[Math.floor(Math.random() * outcomes.length)];
  }
  
  // Current/near-term appointments
  if (Math.abs(timeDiff) <= 30 * 60 * 1000) {
    const currentStatuses: AppointmentStatus[] = ['waiting', 'in-progress', 'recording'];
    return currentStatuses[Math.floor(Math.random() * currentStatuses.length)];
  }
  
  return 'scheduled';
}

/**
 * Generates a single mock appointment
 */
function generateMockAppointment(
  index: number,
  date: Date,
  clinicianId: string,
  seed: string
): Appointment {
  const random = (offset: number = 0) => seededRandom(seed, index + offset);
  
  // Select patient data
  const patientIndex = Math.floor(random(1) * PATIENT_NAMES.length);
  const patient = PATIENT_NAMES[patientIndex];
  
  // Generate appointment time (8 AM to 6 PM, typical GP hours)
  const startHour = 8;
  const endHour = 18;
  const totalMinutes = (endHour - startHour) * 60;
  const appointmentMinute = Math.floor(random(2) * totalMinutes);
  const scheduledTime = addMinutes(
    startOfDay(date).setHours(startHour),
    Math.floor(appointmentMinute / 15) * 15 // Round to 15-minute intervals
  );
  
  // Select appointment type and duration
  const appointmentTypeIndex = Math.floor(random(3) * APPOINTMENT_TYPES.length);
  const appointmentType = APPOINTMENT_TYPES[appointmentTypeIndex];
  const duration = TYPICAL_DURATIONS[Math.floor(random(4) * TYPICAL_DURATIONS.length)];
  
  // Generate status based on current time
  const status = generateAppointmentStatus(scheduledTime, new Date());
  
  // Generate IDs
  const appointmentId = `mock-appt-${format(date, 'yyyy-MM-dd')}-${index.toString().padStart(3, '0')}`;
  const patientId = `mock-patient-${patientIndex.toString().padStart(3, '0')}`;
  
  return {
    id: appointmentId,
    ehrAppointmentId: `bp-${appointmentId}`, // Simulate Best Practice ID
    patientId,
    clinicianId,
    scheduledTime,
    duration,
    appointmentType,
    status,
    location: 'Room ' + (Math.floor(random(5) * 5) + 1),
    
    // Patient display info
    patientName: `${patient.first} ${patient.last}`,
    patientAge: patient.age,
    patientGender: patient.gender,
    
    // Add consultation tracking for active appointments
    ...(status === 'recording' && {
      consultationId: `mock-consult-${appointmentId}`,
      recordingStartTime: addMinutes(scheduledTime, -5),
    }),
    
    // Metadata
    createdAt: new Date(date.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Created within last week
    updatedAt: new Date(),
  };
}

/**
 * Generates a full day's worth of appointments
 */
export function generateTodaysAppointments(
  date: Date = new Date(),
  clinicianId: string = 'mock-clinician-001',
  options: MockDataOptions = {}
): Appointment[] {
  const {
    appointmentsPerDay = 12, // Typical GP sees 10-15 patients per day
    randomSeed = format(date, 'yyyy-MM-dd'),
  } = options;
  
  const appointments: Appointment[] = [];
  
  for (let i = 0; i < appointmentsPerDay; i++) {
    appointments.push(generateMockAppointment(i, date, clinicianId, randomSeed));
  }
  
  // Sort by scheduled time
  appointments.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  
  // Ensure no overlapping appointments
  for (let i = 1; i < appointments.length; i++) {
    const prevAppt = appointments[i - 1];
    const currAppt = appointments[i];
    const prevEndTime = addMinutes(prevAppt.scheduledTime, prevAppt.duration);
    
    if (currAppt.scheduledTime < prevEndTime) {
      // Adjust current appointment to start after previous one ends
      currAppt.scheduledTime = addMinutes(prevEndTime, 5); // 5-minute buffer
    }
  }
  
  return appointments;
}

/**
 * Simulates real-time appointment status updates
 */
export function updateAppointmentStatus(
  appointments: Appointment[],
  appointmentId: string,
  newStatus: AppointmentStatus
): Appointment[] {
  return appointments.map(appt => {
    if (appt.id === appointmentId) {
      const updatedAppt = { ...appt, status: newStatus, updatedAt: new Date() };
      
      // Add consultation tracking when recording starts
      if (newStatus === 'recording' && !appt.consultationId) {
        updatedAppt.consultationId = `mock-consult-${appointmentId}`;
        updatedAppt.recordingStartTime = new Date();
      }
      
      // Add recording end time when recording stops
      if (appt.status === 'recording' && newStatus !== 'recording' && appt.recordingStartTime) {
        updatedAppt.recordingEndTime = new Date();
      }
      
      return updatedAppt;
    }
    return appt;
  });
}

/**
 * Gets appointments by status (useful for dashboard stats)
 */
export function getAppointmentsByStatus(
  appointments: Appointment[],
  status: AppointmentStatus
): Appointment[] {
  return appointments.filter(appt => appt.status === status);
}

/**
 * Calculates appointment statistics for dashboard
 */
export function calculateAppointmentStats(appointments: Appointment[]) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addMinutes(todayStart, 24 * 60);
  
  const todaysAppointments = appointments.filter(appt => 
    appt.scheduledTime >= todayStart && appt.scheduledTime < todayEnd
  );
  
  const completed = getAppointmentsByStatus(todaysAppointments, 'completed');
  const recording = getAppointmentsByStatus(todaysAppointments, 'recording');
  const processing = getAppointmentsByStatus(todaysAppointments, 'processing');
  const remaining = todaysAppointments.filter(appt => 
    appt.scheduledTime > now && !['completed', 'cancelled', 'no-show'].includes(appt.status)
  );
  
  // Calculate average consultation time from completed appointments
  const completedWithTimes = completed.filter(appt => 
    appt.recordingStartTime && appt.recordingEndTime
  );
  const averageTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((sum, appt) => {
        const duration = (appt.recordingEndTime!.getTime() - appt.recordingStartTime!.getTime()) / (1000 * 60);
        return sum + duration;
      }, 0) / completedWithTimes.length
    : 0;
  
  return {
    consultationsCompleted: completed.length,
    consultationsScheduled: todaysAppointments.length,
    currentlyRecording: recording.length,
    appointmentsRemaining: remaining.length,
    notesAwaitingReview: processing.length,
    audioFilesProcessing: processing.length,
    averageConsultationTime: Math.round(averageTime),
  };
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

/**
 * Generates a complete mock dataset for development
 */
export function generateMockDataset(options: MockDataOptions = {}): MockGenerationResult {
  const seed = options.randomSeed || new Date().toISOString();
  const appointments = generateTodaysAppointments(new Date(), 'mock-clinician-001', {
    ...options,
    randomSeed: seed,
  });
  
  // Extract unique patients from appointments
  const patientsMap = new Map();
  appointments.forEach(appt => {
    if (!patientsMap.has(appt.patientId)) {
      patientsMap.set(appt.patientId, {
        id: appt.patientId,
        ehrPatientId: `bp-${appt.patientId}`,
        ehrSystem: 'bestpractice' as const,
        firstName: appt.patientName.split(' ')[0],
        lastName: appt.patientName.split(' ')[1],
        dateOfBirth: new Date(new Date().getFullYear() - appt.patientAge, 0, 1),
        age: appt.patientAge,
        gender: appt.patientGender,
        lastSyncedAt: new Date(),
      });
    }
  });
  
  return {
    appointments,
    patients: Array.from(patientsMap.values()),
    notes: [], // Will be populated in future phases
    generatedAt: new Date(),
    seed,
  };
}

/**
 * Logs mock data info to console (development only)
 */
export function logMockAppointments(appointments: Appointment[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📅 Mock Appointments Generated:');
    console.table(appointments.map(appt => ({
      Time: format(appt.scheduledTime, 'HH:mm'),
      Patient: appt.patientName,
      Type: appt.appointmentType,
      Duration: `${appt.duration}min`,
      Status: appt.status,
    })));
    
    const stats = calculateAppointmentStats(appointments);
    console.log('📊 Today\'s Stats:', stats);
  }
}