// /src/components/security/InlineErrorFallback.tsx
import type { ErrorFallbackProps } from "@/core/types/error-boundary";
import { AlertHexaIcon } from "@/core/icons";

// Specialized error fallback for smaller components
export const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  // error,
  resetError,
  errorId
}) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex items-start space-x-3">
      <AlertHexaIcon className="h-5 w-5 text-red-500 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Component Error
        </h3>
        <p className="text-sm text-red-700 mt-1">
          This section couldn"t load properly.
        </p>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={resetError}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
          <span className="text-xs text-red-600">ID: {errorId.slice(-8)}</span>
        </div>
      </div>
    </div>
  </div>
);
