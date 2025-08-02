/**
 * Appointment Row Component
 * 
 * Individual appointment row with status indicators, patient info,
 * and interactive elements for the clinical workflow.
 */

"use client";

import React from 'react';
import { format, isToday, isPast, addMinutes } from 'date-fns';
import {
  Clock,
  User,
  Mic,
  MicOff,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types/clinical';

interface AppointmentRowProps {
  appointment: Appointment;
  onClick?: () => void;
  onStatusUpdate?: (appointmentId: string, status: Appointment['status']) => Promise<void>;
  showPatientDetails?: boolean;
  className?: string;
}

export function AppointmentRow({
  appointment,
  onClick,
  onStatusUpdate,
  showPatientDetails = true,
  className,
}: AppointmentRowProps) {
  const statusConfig = getAppointmentStatusConfig(appointment.status);
  const timeInfo = getAppointmentTimeInfo(appointment);
  
  const handleStatusChange = async (newStatus: Appointment['status']) => {
    if (onStatusUpdate) {
      try {
        await onStatusUpdate(appointment.id, newStatus);
      } catch (error) {
        console.error('Failed to update appointment status:', error);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 border rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
        statusConfig.borderClass,
        statusConfig.backgroundClass,
        className
      )}
      onClick={onClick}
    >
      {/* Time */}
      <div className="flex-shrink-0 w-16 text-sm font-medium text-muted-foreground">
        {format(appointment.scheduledTime, 'HH:mm')}
      </div>

      {/* Patient Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">
            {appointment.patientName}
          </span>
          {showPatientDetails && (
            <span className="text-sm text-muted-foreground">
              ({appointment.patientAge}{appointment.patientGender})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">{appointment.appointmentType}</span>
          <span>•</span>
          <span>{appointment.duration} min</span>
          {appointment.location && (
            <>
              <span>•</span>
              <span>{appointment.location}</span>
            </>
          )}
        </div>
        {timeInfo.note && (
          <div className="mt-1 text-xs text-muted-foreground">
            {timeInfo.note}
          </div>
        )}
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2">
        {/* Recording Indicator */}
        {appointment.status === 'recording' && (
          <div className="flex items-center gap-1 text-red-600">
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-medium">REC</span>
          </div>
        )}

        {/* Status Badge */}
        <Badge
          variant={statusConfig.variant}
          className={cn("text-xs", statusConfig.badgeClass)}
        >
          <statusConfig.icon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>

        {/* Quick Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onClick?.()}>
              <User className="h-4 w-4 mr-2" />
              View Patient Details
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Status Change Options */}
            {appointment.status === 'scheduled' && (
              <DropdownMenuItem onClick={() => handleStatusChange('waiting')}>
                <Clock className="h-4 w-4 mr-2" />
                Mark as Waiting
              </DropdownMenuItem>
            )}
            
            {appointment.status === 'waiting' && (
              <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                <Play className="h-4 w-4 mr-2" />
                Start Consultation
              </DropdownMenuItem>
            )}
            
            {appointment.status === 'in-progress' && (
              <DropdownMenuItem onClick={() => handleStatusChange('recording')}>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </DropdownMenuItem>
            )}
            
            {appointment.status === 'recording' && (
              <DropdownMenuItem onClick={() => handleStatusChange('processing')}>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </DropdownMenuItem>
            )}
            
            {(appointment.status === 'processing' || appointment.status === 'in-progress') && (
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/**
 * Get status configuration for styling and display
 */
function getAppointmentStatusConfig(status: Appointment['status']) {
  const configs = {
    scheduled: {
      label: 'Scheduled',
      icon: Clock,
      variant: 'secondary' as const,
      borderClass: 'border-gray-200',
      backgroundClass: '',
      badgeClass: 'text-gray-600 bg-gray-100',
    },
    waiting: {
      label: 'Waiting',
      icon: Clock,
      variant: 'secondary' as const,
      borderClass: 'border-blue-200',
      backgroundClass: 'bg-blue-50/50',
      badgeClass: 'text-blue-700 bg-blue-100',
    },
    'in-progress': {
      label: 'In Progress',
      icon: Play,
      variant: 'default' as const,
      borderClass: 'border-blue-300',
      backgroundClass: 'bg-blue-50',
      badgeClass: 'text-blue-800 bg-blue-200',
    },
    recording: {
      label: 'Recording',
      icon: Mic,
      variant: 'destructive' as const,
      borderClass: 'border-red-300',
      backgroundClass: 'bg-red-50',
      badgeClass: 'text-red-800 bg-red-200',
    },
    processing: {
      label: 'Processing',
      icon: Pause,
      variant: 'secondary' as const,
      borderClass: 'border-orange-200',
      backgroundClass: 'bg-orange-50/50',
      badgeClass: 'text-orange-700 bg-orange-100',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      variant: 'secondary' as const,
      borderClass: 'border-green-200',
      backgroundClass: 'bg-green-50/50',
      badgeClass: 'text-green-700 bg-green-100',
    },
    cancelled: {
      label: 'Cancelled',
      icon: AlertCircle,
      variant: 'secondary' as const,
      borderClass: 'border-gray-200',
      backgroundClass: 'bg-gray-50/50 opacity-60',
      badgeClass: 'text-gray-600 bg-gray-100',
    },
    'no-show': {
      label: 'No Show',
      icon: AlertCircle,
      variant: 'secondary' as const,
      borderClass: 'border-gray-200',
      backgroundClass: 'bg-gray-50/50 opacity-60',
      badgeClass: 'text-gray-600 bg-gray-100',
    },
  };

  return configs[status] || configs.scheduled;
}

/**
 * Get time-related information and notes for the appointment
 */
function getAppointmentTimeInfo(appointment: Appointment) {
  const now = new Date();
  const appointmentTime = appointment.scheduledTime;
  const endTime = addMinutes(appointmentTime, appointment.duration);
  
  let note = '';
  
  if (isToday(appointmentTime)) {
    if (isPast(endTime)) {
      note = 'Appointment ended';
    } else if (isPast(appointmentTime)) {
      const minutesLate = Math.floor((now.getTime() - appointmentTime.getTime()) / (1000 * 60));
      note = `Started ${minutesLate} min ago`;
    } else {
      const minutesUntil = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
      if (minutesUntil <= 15) {
        note = `Starting in ${minutesUntil} min`;
      }
    }
  }
  
  return { note };
}