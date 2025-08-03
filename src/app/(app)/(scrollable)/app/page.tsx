"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ClinicalDashboard } from "@/components/dashboard/ClinicalDashboard";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

/**
 * Main App Page - Clinical Dashboard Default
 * 
 * This page always shows the clinical dashboard for authenticated users.
 * Phase 1 clinical features are now the default experience.
 */
export default function AppPage() {
  const user = useCurrentUser();

  // Loading state while user data loads
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Spinner />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state if user is null (shouldn't happen in authenticated routes)
  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p className="text-muted-foreground">
            Unable to load user information. Please try refreshing the page.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Error boundary for clinical dashboard failures
  try {
    return (
      <ClinicalDashboard 
        clinicianId={user.id} 
        className="vertical space-y-6"
      />
    );
  } catch (error) {
    console.error('Clinical dashboard error:', error);
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Dashboard Error</h2>
          <p className="text-muted-foreground">
            Unable to load the clinical dashboard. Please contact support if this issue persists.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.open('mailto:support@ariascribe.com', '_blank')}
              variant="default"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }
}