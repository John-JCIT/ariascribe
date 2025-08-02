/**
 * Quick Stats Component
 * 
 * Displays key clinical metrics for the day including consultations,
 * recording status, and productivity insights.
 */

"use client";

import React from 'react';
import { 
  CheckCircle, 
  Mic, 
  Clock, 
  BarChart3, 
  TrendingUp,
  Calendar,
  FileText,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMockAppointments } from '@/hooks/useMockAppointments';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  clinicianId?: string;
  date?: Date;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  loading?: boolean;
}

export function QuickStats({
  clinicianId = 'mock-clinician-001',
  date = new Date(),
  className,
}: QuickStatsProps) {
  const { stats, loading, error } = useMockAppointments({
    clinicianId,
    date,
  });

  if (loading) {
    return <QuickStatsSkeleton className={className} />;
  }

  if (error || !stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Today's Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p>Unable to load statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate efficiency metrics
  const completionRate = stats.consultationsScheduled > 0 
    ? Math.round((stats.consultationsCompleted / stats.consultationsScheduled) * 100)
    : 0;

  const timesSaved = Math.floor(stats.consultationsCompleted * 8.5); // Assume 8.5 minutes saved per consultation

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Overview</CardTitle>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Consultations Completed */}
          <StatCard
            title="Completed"
            value={stats.consultationsCompleted}
            subtitle={`of ${stats.consultationsScheduled} scheduled`}
            icon={CheckCircle}
            color="green"
            trend={completionRate > 0 ? {
              value: completionRate,
              isPositive: true,
              label: `${completionRate}% complete`
            } : undefined}
          />

          {/* Currently Recording */}
          <StatCard
            title="Recording"
            value={stats.currentlyRecording}
            subtitle={stats.currentlyRecording > 0 ? "consultation active" : "no active recordings"}
            icon={Mic}
            color={stats.currentlyRecording > 0 ? "red" : "blue"}
          />

          {/* Appointments Remaining */}
          <StatCard
            title="Remaining"
            value={stats.appointmentsRemaining}
            subtitle="appointments today"
            icon={Calendar}
            color="orange"
          />

          {/* Average Time */}
          <StatCard
            title="Avg Time"
            value={stats.averageConsultationTime > 0 ? `${stats.averageConsultationTime}m` : '--'}
            subtitle="per consultation"
            icon={Timer}
            color="purple"
            trend={timesSaved > 0 ? {
              value: timesSaved,
              isPositive: true,
              label: `${timesSaved}m saved today`
            } : undefined}
          />
        </div>

        {/* Additional Insights */}
        {stats.consultationsCompleted > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Productivity Insights</span>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">
                  +{timesSaved} minutes saved
                </div>
                <div className="text-xs text-muted-foreground">
                  vs traditional documentation
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual stat card component
 */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  loading = false,
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        <div className={cn(
          "p-1 rounded-md",
          colorClasses[color]
        )}>
          <Icon className="h-3 w-3" />
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <TrendingUp className={cn(
              "h-3 w-3",
              !trend.isPositive && "rotate-180"
            )} />
            {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for quick stats
 */
function QuickStatsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-6 rounded-md" />
              </div>
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}