// /src/components/security/DefaultErrorFallback.tsx
import React from "react";
import type { ErrorFallbackProps } from "@/core/types/error-boundary";
import { AlertHexaIcon } from "@/core/icons";
import Button from "@/core/components/ui/button/Button";

// Default error fallback component
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorId, 
  retryCount 
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyErrorDetails = async () => {
    const errorDetails = `
      Error ID: ${errorId}
      Message: ${error.message}
      Stack: ${error.stack}
      Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error details", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 dark:bg-gray-600 flex items-center justify-center p-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="shrink-0">
            <AlertHexaIcon className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We"re sorry for the inconvenience
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="bg-gray-200 dark:bg-gray-700 rounded p-3 text-xs font-mono text-gray-600 dark:text-gray-300">
            Error ID: {errorId}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={resetError}
            variant="primary"
            size="sm"
            className="w-full flex items-center justify-center"
          >
            {/* <RefreshCw className="h-4 w-4" /> */}
            <span>Try Again {retryCount > 0 && `(${retryCount})`}</span>
          </Button>

          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center"
          >
            {/* <Home className="h-4 w-4" /> */}
            <span>Go Home</span>
          </Button>

          <Button
            onClick={copyErrorDetails}
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center"
          >
            {copied ? (
              <>
                {/* <CheckCircle className="h-4 w-4 text-green-600" /> */}
                <span>Copied!</span>
              </>
            ) : (
              <>
                {/* <Copy className="h-4 w-4" /> */}
                <span>Copy Error Details</span>
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-800 dark:text-gray-100">
              Technical Details
            </summary>
            <pre className="mt-2 bg-gray-200 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-32 text-gray-600 dark:text-gray-300">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};
