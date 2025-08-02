/**
 * Clinical Dashboard Component
 * 
 * Main dashboard for clinical workflow featuring today's schedule,
 * quick stats, pending actions, and patient consultation panel.
 */

"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Settings, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TodaysSchedule } from './TodaysSchedule';
import { QuickStats } from './QuickStats';
import { PendingActions } from './PendingActions';
import { PatientConsultationPanel } from './PatientConsultationPanel';
import type { Appointment, PendingAction } from '@/types/clinical';

interface ClinicalDashboardProps {
  clinicianId?: string;
  className?: string;
}

export function ClinicalDashboard({
  clinicianId = 'mock-clinician-001',
  className,
}: ClinicalDashboardProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Create date once to avoid re-renders
  const currentDate = React.useMemo(() => new Date(), []);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsPanelOpen(true);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    // Don't clear selectedAppointment immediately to allow for smooth closing animation
    setTimeout(() => setSelectedAppointment(null), 300);
  };

  const handlePendingActionClick = (action: PendingAction) => {
    // Handle different action types
    switch (action.type) {
      case 'note-review':
        // Navigate to notes page
        console.log('Navigate to notes review');
        break;
      case 'consent-pending':
        // Find and open the waiting appointment
        if (action.patientName) {
          // In a real implementation, we'd find the appointment by patient name
          console.log(`Open consultation for ${action.patientName}`);
        }
        break;
      default:
        console.log(`Handle action: ${action.type}`);
    }
  };

  return (
    <div className={className}>
      {/* Dashboard Content - blur when panel is open */}
      <div className={`transition-all duration-300 ${isPanelOpen ? 'blur-sm opacity-60 pointer-events-none' : ''}`}>
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clinical Dashboard</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Change Date
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Schedule - Takes up most space */}
        <div className="lg:col-span-3">
          <TodaysSchedule
            clinicianId={clinicianId}
            date={currentDate}
            onAppointmentClick={handleAppointmentClick}
            className="h-fit"
          />
        </div>

        {/* Sidebar Stats and Actions */}
        <div className="space-y-6">
          <QuickStats 
            clinicianId={clinicianId}
            date={currentDate}
          />
          <PendingActions 
            clinicianId={clinicianId}
            date={currentDate}
            onActionClick={handlePendingActionClick}
          />
        </div>
      </div>
      </div>

      {/* Patient Consultation Panel */}
      <PatientConsultationPanel
        appointment={selectedAppointment}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
      />

      {/* Development Mode Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-blue-600 text-white text-xs px-3 py-2 rounded-md shadow-lg">
            <div className="font-medium">Clinical Dashboard</div>
            <div className="opacity-90">Development Mode</div>
          </div>
        </div>
      )}
    </div>
  );
}