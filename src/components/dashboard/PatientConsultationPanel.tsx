/**
 * Patient Consultation Panel Component
 * 
 * Sliding panel that displays patient information, pre-consultation
 * checklist, and consultation controls when an appointment is selected.
 */

"use client";

import React from 'react';
import { format } from 'date-fns';
import { 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  Mail,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { Appointment } from '@/types/clinical';

interface PatientConsultationPanelProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientConsultationPanel({
  appointment,
  isOpen,
  onClose,
}: PatientConsultationPanelProps) {
  if (!appointment) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={() => {}} modal={false}>
      <SheetContent 
        side="right" 
        className="!w-[600px] sm:!w-[700px] lg:!w-[800px] !max-w-none overflow-hidden [&>button]:hidden"
      >
        <SheetHeader className="px-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left">
              Patient Consultation
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4 px-6 overflow-y-auto flex-1">
          {/* Patient Header */}
          <PatientHeader appointment={appointment} />
          
          <Separator />
          
          {/* Patient Summary */}
          <PatientSummary appointment={appointment} />
          
          <Separator />
          
          {/* Pre-Consultation Checklist */}
          <PreConsultationChecklist appointment={appointment} />
          
          <Separator />
          
          {/* Consultation Controls */}
          <ConsultationControls appointment={appointment} />
          
          <Separator />
          
          {/* Consultation Status */}
          <ConsultationStatus appointment={appointment} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Patient header with basic demographics and appointment info
 */
function PatientHeader({ appointment }: { appointment: Appointment }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">
            {appointment.patientName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {appointment.patientAge} years old • {appointment.patientGender === 'M' ? 'Male' : appointment.patientGender === 'F' ? 'Female' : 'Other'}
          </p>
        </div>
        <Badge variant="outline">
          {appointment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(appointment.scheduledTime, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{format(appointment.scheduledTime, 'h:mm a')} ({appointment.duration} min)</span>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-sm font-medium mb-1">Appointment Type</div>
        <div className="text-sm text-muted-foreground">{appointment.appointmentType}</div>
        {appointment.location && (
          <div className="text-xs text-muted-foreground mt-1">
            Location: {appointment.location}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Patient summary with mock clinical data
 */
function PatientSummary({ appointment }: { appointment: Appointment }) {
  const [loading, setLoading] = React.useState(false);
  
  const handleRefresh = async () => {
    setLoading(true);
    // Simulate EHR data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Patient Summary</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {loading ? (
        <PatientSummarySkeleton />
      ) : (
        <div className="space-y-3">
          {/* Contact Information */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium mb-2">Contact Information</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>0412 345 678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span>{appointment.patientName.toLowerCase().replace(' ', '.')}@email.com</span>
              </div>
            </div>
          </div>

          {/* Clinical Summary */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium mb-2">Clinical Summary</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Last Visit:</span> 2 weeks ago
              </div>
              <div>
                <span className="font-medium">Known Allergies:</span> None recorded
              </div>
              <div>
                <span className="font-medium">Current Medications:</span> None recorded
              </div>
            </div>
          </div>

          {/* Recent Notes */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium mb-2">Recent Notes</div>
            <div className="text-sm text-muted-foreground">
              <div className="mb-1 font-medium">General consultation - 2 weeks ago</div>
              <div className="text-xs">Patient presented for routine check-up. All vital signs normal.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Pre-consultation checklist for clinical safety
 */
function PreConsultationChecklist({ appointment }: { appointment: Appointment }) {
  const [checklist, setChecklist] = React.useState({
    identityVerified: false,
    consentObtained: false,
    templateSelected: true, // Auto-selected
    summaryReviewed: false,
  });

  const handleChecklistChange = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedItems = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;
  const canProceed = checklist.identityVerified && checklist.consentObtained;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Pre-Consultation Checklist</h3>
        <span className="text-sm text-muted-foreground">
          {completedItems}/{totalItems} complete
        </span>
      </div>

      <div className="space-y-3">
        <ChecklistItem
          label="Patient identity verified"
          checked={checklist.identityVerified}
          onChange={() => handleChecklistChange('identityVerified')}
          required
          helpText="Confirm patient name and DOB match records"
        />
        
        <ChecklistItem
          label="Consent for recording obtained"
          checked={checklist.consentObtained}
          onChange={() => handleChecklistChange('consentObtained')}
          required
          helpText="Patient has agreed to audio recording"
        />
        
        <ChecklistItem
          label="Note template selected"
          checked={checklist.templateSelected}
          onChange={() => handleChecklistChange('templateSelected')}
          helpText="General consultation template selected"
        />
        
        <ChecklistItem
          label="Patient summary reviewed"
          checked={checklist.summaryReviewed}
          onChange={() => handleChecklistChange('summaryReviewed')}
          helpText="Clinical history and alerts reviewed"
        />
      </div>

      {!canProceed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800 mb-1">
            Action Required
          </div>
          <div className="text-sm text-yellow-700">
            Complete required checklist items before starting consultation
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Consultation controls for recording and workflow
 */
function ConsultationControls({ appointment }: { appointment: Appointment }) {
  const [isRecording, setIsRecording] = React.useState(appointment.status === 'recording');
  
  const handleStartRecording = () => {
    setIsRecording(true);
    // In real implementation, this would start actual recording
    console.log('Start recording for appointment:', appointment.id);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In real implementation, this would stop recording and start processing
    console.log('Stop recording for appointment:', appointment.id);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Consultation Controls</h3>

      <div className="space-y-3">
        {!isRecording ? (
          <Button
            size="lg"
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleStartRecording}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
              Start Recording
            </div>
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 border-red-600 text-red-600 hover:bg-red-50"
            onClick={handleStopRecording}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-red-600" />
              Stop Recording
            </div>
          </Button>
        )}

        <div className="text-center">
          <div className="text-sm font-medium">Template</div>
          <div className="text-sm text-muted-foreground">General Consultation</div>
        </div>

        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-sm font-medium">Recording in progress</span>
            </div>
            <div className="text-center text-xs text-red-600 mt-1">
              Duration: 00:00
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Consultation status and progress tracking
 */
function ConsultationStatus({ appointment }: { appointment: Appointment }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Consultation Status</h3>

      <div className="space-y-3">
        <StatusItem
          label="Audio Capture"
          status={appointment.status === 'recording' ? 'active' : 'waiting'}
          description={appointment.status === 'recording' ? 'Recording audio' : 'Ready to record'}
        />
        
        <StatusItem
          label="Transcription"
          status="waiting"
          description="Waiting for audio input"
        />
        
        <StatusItem
          label="Note Generation"
          status="waiting"
          description="Pending transcription completion"
        />
        
        <StatusItem
          label="Review & Approval"
          status="waiting"
          description="Waiting for generated note"
        />
      </div>
    </div>
  );
}

/**
 * Individual checklist item
 */
function ChecklistItem({
  label,
  checked,
  onChange,
  required = false,
  helpText,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  required?: boolean;
  helpText?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {required && (
            <span className="text-xs text-red-600 font-medium">Required</span>
          )}
        </div>
        {helpText && (
          <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Status item for consultation progress
 */
function StatusItem({
  label,
  status,
  description,
}: {
  label: string;
  status: 'waiting' | 'active' | 'complete' | 'error';
  description: string;
}) {
  const statusConfig = {
    waiting: { color: 'text-gray-500', bg: 'bg-gray-100' },
    active: { color: 'text-blue-600', bg: 'bg-blue-100' },
    complete: { color: 'text-green-600', bg: 'bg-green-100' },
    error: { color: 'text-red-600', bg: 'bg-red-100' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 w-2 rounded-full ${config.bg}`} />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className={`text-xs ${config.color}`}>{description}</div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for patient summary
 */
function PatientSummarySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-muted/50 rounded-lg p-3">
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}