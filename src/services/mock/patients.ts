/**
 * Mock Patient Data Service
 * 
 * Generates realistic but minimal patient data for development and testing.
 * This follows the principle that EHR systems are the source of truth,
 * so we only store minimal reference data locally.
 */

import { addDays, subYears, format } from 'date-fns';
import type { 
  PatientSummary, 
  PatientContext,
  Medication,
  Allergy,
  ClinicalNote,
  ClinicalAlert 
} from '@/types/clinical';

// ============================================================================
// MOCK DATA CONSTANTS
// ============================================================================

const COMMON_MEDICATIONS = [
  { name: 'Metformin', genericName: 'Metformin', dosage: '500mg', frequency: 'twice daily', route: 'oral' },
  { name: 'Lisinopril', genericName: 'Lisinopril', dosage: '10mg', frequency: 'once daily', route: 'oral' },
  { name: 'Atorvastatin', genericName: 'Atorvastatin', dosage: '20mg', frequency: 'once daily', route: 'oral' },
  { name: 'Amlodipine', genericName: 'Amlodipine', dosage: '5mg', frequency: 'once daily', route: 'oral' },
  { name: 'Omeprazole', genericName: 'Omeprazole', dosage: '20mg', frequency: 'once daily', route: 'oral' },
  { name: 'Salbutamol', genericName: 'Salbutamol', dosage: '100mcg', frequency: 'as needed', route: 'inhaled' },
  { name: 'Paracetamol', genericName: 'Paracetamol', dosage: '500mg', frequency: 'as needed', route: 'oral' },
  { name: 'Aspirin', genericName: 'Aspirin', dosage: '100mg', frequency: 'once daily', route: 'oral' },
] as const;

const COMMON_ALLERGIES = [
  { allergen: 'Penicillin', type: 'drug', reaction: 'Rash and itching', severity: 'moderate' },
  { allergen: 'Peanuts', type: 'food', reaction: 'Anaphylaxis', severity: 'severe' },
  { allergen: 'Shellfish', type: 'food', reaction: 'Hives and swelling', severity: 'moderate' },
  { allergen: 'Dust mites', type: 'environmental', reaction: 'Sneezing and runny nose', severity: 'mild' },
  { allergen: 'Codeine', type: 'drug', reaction: 'Nausea and dizziness', severity: 'mild' },
  { allergen: 'Latex', type: 'environmental', reaction: 'Contact dermatitis', severity: 'moderate' },
] as const;

const CONSULTATION_TYPES = [
  'General consultation',
  'Follow-up appointment',
  'Annual health check',
  'Chronic disease review',
  'Mental health assessment',
  'Immunisation visit',
  'Minor procedure',
  'Telehealth consultation',
] as const;

// ============================================================================
// MOCK PATIENT GENERATION
// ============================================================================

/**
 * Generates a mock patient summary with minimal data
 */
export function generateMockPatientSummary(patientId: string): PatientSummary {
  // Extract patient info from ID (assuming format: mock-patient-XXX)
  const patientIndex = parseInt(patientId.split('-')[2] || '0', 10);
  
  // Use the same patient names as appointments for consistency
  const patientNames = [
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
  ];
  
  const patient = patientNames[patientIndex % patientNames.length];
  const birthYear = new Date().getFullYear() - patient.age;
  
  return {
    id: patientId,
    ehrPatientId: `bp-${patientId}`, // Simulate Best Practice ID
    ehrSystem: 'bestpractice',
    firstName: patient.first,
    lastName: patient.last,
    dateOfBirth: new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    age: patient.age,
    gender: patient.gender,
    phone: generateMockPhone(),
    email: `${patient.first.toLowerCase()}.${patient.last.toLowerCase()}@email.com`,
    lastVisit: addDays(new Date(), -Math.floor(Math.random() * 90)), // Within last 3 months
    totalVisits: Math.floor(Math.random() * 20) + 1,
    lastSyncedAt: new Date(),
    isStale: false,
  };
}

/**
 * Generates mock medications for a patient
 */
export function generateMockMedications(patientId: string): Medication[] {
  const patientIndex = parseInt(patientId.split('-')[2] || '0', 10);
  const medicationCount = Math.min(Math.floor(patientIndex / 3) + 1, 5); // 1-5 medications
  
  const medications: Medication[] = [];
  const usedMedications = new Set<string>();
  
  for (let i = 0; i < medicationCount; i++) {
    let medication;
    do {
      medication = COMMON_MEDICATIONS[Math.floor(Math.random() * COMMON_MEDICATIONS.length)];
    } while (usedMedications.has(medication.name));
    
    usedMedications.add(medication.name);
    
    medications.push({
      id: `mock-med-${patientId}-${i}`,
      name: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      frequency: medication.frequency,
      route: medication.route,
      startDate: subYears(new Date(), Math.floor(Math.random() * 3)), // Started within last 3 years
      prescribedBy: 'Dr. Smith',
      active: Math.random() > 0.1, // 90% active
      notes: Math.random() > 0.7 ? 'Take with food' : undefined,
    });
  }
  
  return medications;
}

/**
 * Generates mock allergies for a patient
 */
export function generateMockAllergies(patientId: string): Allergy[] {
  const patientIndex = parseInt(patientId.split('-')[2] || '0', 10);
  const hasAllergies = patientIndex % 3 === 0; // About 1/3 of patients have recorded allergies
  
  if (!hasAllergies) return [];
  
  const allergyCount = Math.floor(Math.random() * 3) + 1; // 1-3 allergies
  const allergies: Allergy[] = [];
  const usedAllergies = new Set<string>();
  
  for (let i = 0; i < allergyCount; i++) {
    let allergy;
    do {
      allergy = COMMON_ALLERGIES[Math.floor(Math.random() * COMMON_ALLERGIES.length)];
    } while (usedAllergies.has(allergy.allergen));
    
    usedAllergies.add(allergy.allergen);
    
    allergies.push({
      id: `mock-allergy-${patientId}-${i}`,
      allergen: allergy.allergen,
      allergenType: allergy.type as 'drug' | 'food' | 'environmental' | 'other',
      reaction: allergy.reaction,
      severity: allergy.severity as 'mild' | 'moderate' | 'severe' | 'life-threatening',
      verifiedDate: subYears(new Date(), Math.floor(Math.random() * 5)), // Verified within last 5 years
      notes: Math.random() > 0.8 ? 'Patient self-reported' : undefined,
    });
  }
  
  return allergies;
}

/**
 * Generates mock recent clinical notes
 */
export function generateMockRecentNotes(patientId: string): ClinicalNote[] {
  const noteCount = Math.floor(Math.random() * 4) + 1; // 1-4 recent notes
  const notes: ClinicalNote[] = [];
  
  for (let i = 0; i < noteCount; i++) {
    const daysAgo = Math.floor(Math.random() * 90) + 1; // Within last 90 days
    const consultationType = CONSULTATION_TYPES[Math.floor(Math.random() * CONSULTATION_TYPES.length)];
    
    notes.push({
      id: `mock-note-${patientId}-${i}`,
      ehrNoteId: `bp-note-${patientId}-${i}`,
      patientId,
      clinicianId: 'mock-clinician-001',
      title: consultationType,
      content: generateMockNoteContent(consultationType),
      noteType: 'soap',
      status: 'final',
      createdAt: addDays(new Date(), -daysAgo),
      updatedAt: addDays(new Date(), -daysAgo),
      signedAt: addDays(new Date(), -daysAgo),
      generatedFromAudio: Math.random() > 0.5, // 50% generated from audio
      manuallyEdited: Math.random() > 0.3, // 70% manually edited
    });
  }
  
  return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Generates mock clinical alerts based on patient data
 */
export function generateMockClinicalAlerts(
  patientSummary: PatientSummary,
  medications: Medication[],
  allergies: Allergy[]
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  
  // Allergy alerts
  allergies.forEach((allergy, index) => {
    if (allergy.severity === 'severe' || allergy.severity === 'life-threatening') {
      alerts.push({
        id: `alert-allergy-${index}`,
        type: 'allergy',
        severity: 'critical',
        title: `Severe ${allergy.allergenType} allergy`,
        description: `Patient allergic to ${allergy.allergen} - ${allergy.reaction}`,
        actionRequired: false,
        dismissible: false,
      });
    }
  });
  
  // Age-based alerts
  if (patientSummary.age >= 65) {
    alerts.push({
      id: 'alert-elderly',
      type: 'safety',
      severity: 'info',
      title: 'Elderly patient',
      description: 'Consider medication interactions and dosage adjustments',
      actionRequired: false,
      dismissible: true,
    });
  }
  
  // Medication interaction alerts (simplified)
  const hasMultipleMeds = medications.filter(m => m.active).length >= 3;
  if (hasMultipleMeds) {
    alerts.push({
      id: 'alert-polypharmacy',
      type: 'drug-interaction',
      severity: 'warning',
      title: 'Multiple medications',
      description: 'Review for potential drug interactions',
      actionRequired: true,
      dismissible: true,
    });
  }
  
  return alerts;
}

/**
 * Generates complete patient context (all data together)
 */
export function generateMockPatientContext(patientId: string): PatientContext {
  const summary = generateMockPatientSummary(patientId);
  const medications = generateMockMedications(patientId);
  const allergies = generateMockAllergies(patientId);
  const recentNotes = generateMockRecentNotes(patientId);
  const alerts = generateMockClinicalAlerts(summary, medications, allergies);
  
  return {
    summary,
    medications,
    allergies,
    recentNotes,
    alerts,
    medicationsLoading: false,
    allergiesLoading: false,
    notesLoading: false,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a mock Australian phone number
 */
function generateMockPhone(): string {
  const areaCodes = ['02', '03', '07', '08']; // Major Australian area codes
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 90000000) + 10000000; // 8-digit number
  return `${areaCode} ${number.toString().substring(0, 4)} ${number.toString().substring(4)}`;
}

/**
 * Generates mock clinical note content based on consultation type
 */
function generateMockNoteContent(consultationType: string): string {
  const templates = {
    'General consultation': `SUBJECTIVE: Patient presents with general health concerns. Reports feeling well overall with no acute complaints.

OBJECTIVE: Vital signs stable. Physical examination unremarkable.

ASSESSMENT: Generally well patient. No acute medical issues identified.

PLAN: Continue current management. Return if concerns arise. Next routine review in 6 months.`,

    'Follow-up appointment': `SUBJECTIVE: Patient returns for follow-up as planned. Reports compliance with treatment plan.

OBJECTIVE: Improvement noted since last visit. Vital signs within normal limits.

ASSESSMENT: Good response to current treatment. Condition stable.

PLAN: Continue current management. Follow-up in 3 months or sooner if needed.`,

    'Annual health check': `SUBJECTIVE: Annual health assessment. Patient reports no significant health concerns.

OBJECTIVE: Comprehensive examination performed. All systems reviewed.

ASSESSMENT: Overall health status good for age. Preventive care up to date.

PLAN: Continue healthy lifestyle. Routine screening as appropriate. Next annual check in 12 months.`,
  };
  
  return templates[consultationType as keyof typeof templates] || templates['General consultation'];
}

/**
 * Simulates EHR data refresh (adds slight delay and updates sync time)
 */
export async function refreshPatientData(patientId: string): Promise<PatientContext> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  const context = generateMockPatientContext(patientId);
  context.summary.lastSyncedAt = new Date();
  context.summary.isStale = false;
  
  return context;
}

/**
 * Development helper to log patient data
 */
export function logMockPatientData(context: PatientContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Mock Patient Data Generated:');
    console.log('Patient:', `${context.summary.firstName} ${context.summary.lastName} (${context.summary.age}${context.summary.gender})`);
    console.log('Medications:', context.medications?.length || 0);
    console.log('Allergies:', context.allergies?.length || 0);
    console.log('Recent Notes:', context.recentNotes?.length || 0);
    console.log('Alerts:', context.alerts?.length || 0);
  }
}