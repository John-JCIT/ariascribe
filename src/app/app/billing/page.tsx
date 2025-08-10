"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MbsDashboard } from "@/components/mbs/MbsDashboard";
import { MbsErrorBoundary } from "@/components/mbs/MbsErrorBoundary";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * MBS Billing Assistant Page
 * 
 * Provides AI-powered Medicare Benefits Schedule billing suggestions and search functionality.
 */
export default function BillingPage() {
  const user = useCurrentUser();

  // Loading state while user data loads
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Spinner />
          <p className="text-muted-foreground">Loading billing assistant...</p>
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

  return (
    <div className="vertical space-y-6">
      <MbsErrorBoundary>
        <MbsDashboard />
      </MbsErrorBoundary>
    </div>
  );
}
