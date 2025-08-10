"use client";

import React from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MbsDashboard } from "@/components/mbs/MbsDashboard";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

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

  // Error boundary for MBS dashboard failures
  try {
    return (
      <div className="vertical space-y-6">
        <MbsDashboard />
      </div>
    );
  } catch (error) {
    console.error('MBS billing dashboard error:', error);
    
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Billing Dashboard Error</h2>
          <p className="text-muted-foreground">
            Unable to load the MBS billing assistant. Please contact support if this issue persists.
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
