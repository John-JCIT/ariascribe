/**
 * Today's Schedule Component
 * 
 * Displays the clinician's appointments for the current day with
 * real-time status updates and interactive appointment rows.
 */

"use client";

import React from 'react';
import { format } from 'date-fns';
import { RefreshCw, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMockAppointments } from '@/hooks/useMockAppointments';
import { AppointmentRow } from './AppointmentRow';
import type { Appointment } from '@/types/clinical';

interface TodaysScheduleProps {
  clinicianId?: string;
  date?: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
  className?: string;
}

export function TodaysSchedule({
  clinicianId = 'mock-clinician-001',
  date = new Date(),
  onAppointmentClick,
  className,
}: TodaysScheduleProps) {
  const {
    appointments,
    loading,
    error,
    lastUpdated,
    refetch,
    updateAppointmentStatus,
  } = useMockAppointments({
    clinicianId,
    date,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const handleStatusUpdate = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const dateLabel = isToday ? 'Today' : format(date, 'EEEE, MMM d');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {dateLabel}'s Schedule
            </CardTitle>
            {appointments.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({appointments.length} appointments)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Updated {format(lastUpdated, 'HH:mm')}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={refetch}
                className="ml-2 h-auto p-0 text-xs"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading && appointments.length === 0 ? (
          <ScheduleSkeleton />
        ) : appointments.length === 0 ? (
          <EmptySchedule date={date} />
        ) : (
          <div className="space-y-2">
            {appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onClick={() => handleAppointmentClick(appointment)}
                onStatusUpdate={handleStatusUpdate}
                showPatientDetails
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for the schedule
 */
function ScheduleSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
          <Skeleton className="h-4 w-16" /> {/* Time */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" /> {/* Patient name */}
            <Skeleton className="h-3 w-48" /> {/* Appointment details */}
          </div>
          <Skeleton className="h-6 w-20" /> {/* Status badge */}
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no appointments are scheduled
 */
function EmptySchedule({ date }: { date: Date }) {
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isPast = date < new Date();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Calendar className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg mb-2">
        {isPast ? 'No appointments recorded' : 'No appointments scheduled'}
      </h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        {isToday
          ? "You don't have any appointments scheduled for today. Enjoy your free time!"
          : isPast
          ? `No appointment data available for ${format(date, 'EEEE, MMM d')}.`
          : `No appointments scheduled for ${format(date, 'EEEE, MMM d')} yet.`
        }
      </p>
      {isToday && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Schedule will refresh automatically</span>
        </div>
      )}
    </div>
  );
}