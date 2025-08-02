/**
 * Pending Actions Component
 * 
 * Displays items requiring doctor attention including notes to review,
 * audio processing status, and system notifications.
 */

"use client";

import React from 'react';
import { 
  FileText, 
  AudioLines, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMockAppointments } from '@/hooks/useMockAppointments';
import { cn } from '@/lib/utils';
import type { PendingAction } from '@/types/clinical';

interface PendingActionsProps {
  clinicianId?: string;
  date?: Date;
  onActionClick?: (action: PendingAction) => void;
  className?: string;
}

interface ActionItemProps {
  action: PendingAction;
  onActionClick?: (action: PendingAction) => void;
  onDismiss?: (actionId: string) => void;
}

export function PendingActions({
  clinicianId = 'mock-clinician-001',
  date = new Date(),
  onActionClick,
  className,
}: PendingActionsProps) {
  // Use the passed date directly (it should be stable from parent)
  const { stats, appointments, loading, error } = useMockAppointments({
    clinicianId,
    date,
  });

  // Generate pending actions based on current data
  const pendingActions = React.useMemo(() => {
    if (!stats || !appointments) return [];



    const actions: PendingAction[] = [];
    const now = new Date(); // Create once and reuse

    // Notes awaiting review
    if (stats.notesAwaitingReview > 0) {
      actions.push({
        id: 'notes-review',
        type: 'note-review',
        priority: 'high',
        title: `${stats.notesAwaitingReview} Notes to Review`,
        description: 'Generated clinical notes ready for your review and approval',
        actionUrl: '/app/notes',
        createdAt: now,
        dismissible: false,
      });
    }

    // Audio files processing
    if (stats.audioFilesProcessing > 0) {
      actions.push({
        id: 'audio-processing',
        type: 'audio-processing',
        priority: 'medium',
        title: `${stats.audioFilesProcessing} Audio Files Processing`,
        description: 'Transcription and note generation in progress',
        createdAt: now,
        dismissible: true,
      });
    }

    // Appointments needing attention
    const waitingAppointments = appointments.filter(appt => appt.status === 'waiting');
    if (waitingAppointments.length > 0) {
      const nextPatient = waitingAppointments[0];
      actions.push({
        id: `waiting-${nextPatient.id}`,
        type: 'consent-pending',
        priority: 'high',
        title: 'Patient Waiting',
        description: `${nextPatient.patientName} is ready for consultation`,
        patientName: nextPatient.patientName,
        appointmentTime: nextPatient.scheduledTime,
        createdAt: now,
        dismissible: false,
      });
    }

    // Mock system notifications (deterministic based on stats to avoid random re-renders)
    const shouldShowSystemUpdate = (stats.consultationsCompleted + stats.appointmentsRemaining) % 5 === 0;
    if (shouldShowSystemUpdate && stats.consultationsCompleted > 0) {
      actions.push({
        id: 'system-update',
        type: 'other',
        priority: 'low',
        title: 'System Update Available',
        description: 'New features and improvements are ready to install',
        createdAt: now,
        dismissible: true,
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [stats, appointments]);

  const handleActionClick = (action: PendingAction) => {
    if (onActionClick) {
      onActionClick(action);
    } else if (action.actionUrl) {
      // Default behavior - could navigate to the URL
      console.log(`Navigate to: ${action.actionUrl}`);
    }
  };

  const handleDismiss = (actionId: string) => {
    // In a real implementation, this would update the backend
    console.log(`Dismiss action: ${actionId}`);
  };

  if (loading) {
    return <PendingActionsSkeleton className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pending Actions</CardTitle>
          <Badge variant="outline" className="text-xs">
            {pendingActions.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">Unable to load pending actions</p>
          </div>
        ) : pendingActions.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-medium text-sm mb-1">All caught up!</h3>
            <p className="text-xs text-muted-foreground">
              No pending actions require your attention
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingActions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onActionClick={handleActionClick}
                onDismiss={action.dismissible ? handleDismiss : undefined}
              />
            ))}
            
            {pendingActions.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => console.log('View all actions')}
              >
                View All Actions
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual action item component
 */
function ActionItem({ action, onActionClick, onDismiss }: ActionItemProps) {
  const { icon: Icon, colorClass, priorityLabel } = getActionConfig(action);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
        colorClass
      )}
      onClick={() => onActionClick?.(action)}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {action.title}
          </span>
          {action.priority !== 'low' && (
            <Badge
              variant={action.priority === 'urgent' ? 'destructive' : 'secondary'}
              className="text-xs px-1 py-0"
            >
              {priorityLabel}
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {action.description}
        </p>
        
        {(action.patientName || action.appointmentTime) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {action.patientName && (
              <span>Patient: {action.patientName}</span>
            )}
            {action.appointmentTime && (
              <>
                <span>•</span>
                <span>{action.appointmentTime.toLocaleTimeString('en-AU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </>
            )}
          </div>
        )}
      </div>
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(action.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Get action configuration for styling and display
 */
function getActionConfig(action: PendingAction) {
  const baseConfig = {
    'note-review': {
      icon: FileText,
      colorClass: 'border-blue-200 bg-blue-50/50',
    },
    'audio-processing': {
      icon: AudioLines,
      colorClass: 'border-orange-200 bg-orange-50/50',
    },
    'sync-failed': {
      icon: AlertTriangle,
      colorClass: 'border-red-200 bg-red-50/50',
    },
    'consent-pending': {
      icon: Clock,
      colorClass: 'border-yellow-200 bg-yellow-50/50',
    },
    'other': {
      icon: RefreshCw,
      colorClass: 'border-gray-200 bg-gray-50/50',
    },
  };

  const priorityLabels = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Med',
    low: 'Low',
  };

  const config = baseConfig[action.type] || baseConfig.other;
  
  return {
    ...config,
    priorityLabel: priorityLabels[action.priority],
  };
}

/**
 * Loading skeleton for pending actions
 */
function PendingActionsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-6" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <Skeleton className="h-4 w-4 mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}