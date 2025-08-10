"use client";

import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle, Mail, RefreshCw } from "lucide-react";
import { CustomButton } from "@/components/CustomButton";

interface MbsErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback component specifically designed for MBS Dashboard errors
 * Provides user-friendly error messages and recovery options
 */
function MbsErrorFallback({ error, resetErrorBoundary }: MbsErrorFallbackProps) {
  const handleContactSupport = () => {
    const subject = encodeURIComponent("MBS Billing Dashboard Error");
    const body = encodeURIComponent(
      `I encountered an error in the MBS Billing Dashboard:\n\nError: ${error.message}\n\nPlease help resolve this issue.`
    );
    window.open(`mailto:support@ariascribe.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">MBS Dashboard Error</h2>
        <p className="text-muted-foreground">
          The MBS billing assistant encountered an unexpected error and couldn't load properly.
        </p>
        
        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-sm text-left bg-muted p-3 rounded-md w-full">
            <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2">
          <CustomButton 
            onClick={resetErrorBoundary}
            variant="outline"
            leftIcon={RefreshCw}
          >
            Try Again
          </CustomButton>
          <CustomButton 
            onClick={handleContactSupport}
            variant="default"
            leftIcon={Mail}
          >
            Contact Support
          </CustomButton>
        </div>
        
        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact our support team for assistance.
        </p>
      </div>
    </div>
  );
}

interface MbsErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary component specifically for MBS Dashboard
 * Catches rendering errors and displays appropriate fallback UI
 */
export function MbsErrorBoundary({ children, onError }: MbsErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error for monitoring/debugging
    console.error('MBS Dashboard Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Call optional error handler
    onError?.(error, errorInfo);
    
    // You could also send error to monitoring service here
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  };

  return (
    <ErrorBoundary
      FallbackComponent={MbsErrorFallback}
      onError={handleError}
      onReset={() => {
        // Optional: Clear any error state or refresh data
        console.log('MBS Dashboard error boundary reset');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
