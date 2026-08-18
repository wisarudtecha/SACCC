// /src/components/auth/JWTTokenInspector.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { TokenManager } from "@/core/utils/tokenManager";
import type { DecodedJWT, TokenValidationResult } from "@/core/types/auth";
import Button from "@/core/components/ui/button/Button";

export const JWTTokenInspector: React.FC = () => {
  const { state } = useAuth();
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [decodedToken, setDecodedToken] = useState<DecodedJWT | null>(null);
  const [validation, setValidation] = useState<TokenValidationResult | null>(null);
  const [expiry, setExpiry] = useState<{ expiresAt: Date; timeLeft: number; isExpired: boolean } | null>(null);

  useEffect(() => {
    if (state.token && inspectorVisible) {
      try {
        const decoded = TokenManager.decodeToken(state.token);
        const validationResult = TokenManager.validateToken(state.token);
        const expiryInfo = TokenManager.getTokenExpiry(state.token);
        
        setDecodedToken(decoded);
        setValidation(validationResult);
        setExpiry(expiryInfo);
      }
      catch (error) {
        console.error("Failed to decode token:", error);
        setDecodedToken(null);
        setValidation(null);
        setExpiry(null);
      }
    }
  }, [state.token, inspectorVisible]);

  const formatTimeLeft = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Expired";
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!state.token) {
    return (
      <div className="bg-red-100 dark:bg-red-800 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <h3 className="font-medium text-red-900 dark:text-white mb-2">❌ No Token Available</h3>
        <p className="text-sm text-red-700 dark:text-red-200">No JWT token found to inspect.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">🔍 JWT Token Inspector</h3>
        <Button
          onClick={() => setInspectorVisible(!inspectorVisible)}
          variant="outline"
        >
          {inspectorVisible ? "Hide Details" : "Show Details"}
        </Button>
      </div>

      {/* Token Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-900 p-3 rounded border">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
          <div className={`font-medium ${validation?.isValid ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
            {validation?.isValid ? "✅ Valid" : "❌ Invalid"}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-3 rounded border">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expires</div>
          <div className={`font-medium ${expiry?.isExpired ? "text-red-600 dark:text-red-300" : "text-blue-600 dark:text-blue-300"}`}>
            {expiry ? formatTimeLeft(expiry.timeLeft) : "Unknown"}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-3 rounded border">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Auto Refresh</div>
          <div className={`font-medium ${TokenManager.shouldRefreshToken(state.token) ? "text-orange-600 dark:text-orange-300" : "text-green-600 dark:text-green-300"}`}>
            {TokenManager.shouldRefreshToken(state.token) ? "🔄 Soon" : "✅ Good"}
          </div>
        </div>
      </div>

      {inspectorVisible && decodedToken && (
        <div className="space-y-4">
          {/* Token Parts */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Token Structure</h4>
            
            {/* Header */}
            <div className="mb-4">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">Header</div>
              <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(decodedToken.header, null, 2)}</pre>
              </div>
            </div>

            {/* Payload */}
            <div className="mb-4">
              <div className="text-sm font-medium text-green-600 dark:text-green-300 mb-2">Payload</div>
              <div className="bg-green-100 dark:bg-green-800 p-3 rounded font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify({
                  ...decodedToken.payload,
                  iat: `${decodedToken.payload.iat} (${new Date(decodedToken.payload.iat * 1000).toLocaleString()})`,
                  exp: `${decodedToken.payload.exp} (${new Date(decodedToken.payload.exp * 1000).toLocaleString()})`
                }, null, 2)}</pre>
              </div>
            </div>

            {/* Signature */}
            <div>
              <div className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">Signature</div>
              <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded font-mono text-xs break-all">
                {decodedToken.signature}
              </div>
            </div>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Validation Results</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Status</div>
                  <div className={`text-sm ${validation.isValid ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                    {validation.isValid ? "✅ Token is valid" : "❌ Token is invalid"}
                  </div>
                  <div className={`text-sm ${validation.isExpired ? "text-red-600 dark:text-red-300" : "text-green-600 dark:text-green-300"}`}>
                    {validation.isExpired ? "❌ Token is expired" : "✅ Token is not expired"}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Time Info</div>
                  {validation.issuedAt && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Issued: {validation.issuedAt.toLocaleString()}
                    </div>
                  )}
                  {validation.expiresAt && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Expires: {validation.expiresAt.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {validation.errors.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-red-600 dark:text-red-300 mb-2">Validation Errors</div>
                  <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Raw Token */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Raw Token</h4>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">Header (Base64)</div>
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded font-mono text-xs break-all">
                  {decodedToken.raw.header}
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 dark:text-green-300 mb-1">Payload (Base64)</div>
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded font-mono text-xs break-all">
                  {decodedToken.raw.payload}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-600 dark:text-purple-300 mb-1">Signature (Base64)</div>
                <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded font-mono text-xs break-all">
                  {decodedToken.raw.signature}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Token Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (state.token) {
                    navigator.clipboard.writeText(state.token);
                    alert("Token copied to clipboard!");
                  }
                }}
                variant="primary"
              >
                📋 Copy Token
              </Button>
              
              <Button
                onClick={() => {
                  const url = `https://jwt.io/#debugger-io?token=${state.token}`;
                  window.open(url, "_blank");
                }}
                variant="success"
              >
                🔗 Open in JWT.io
              </Button>
              
              <Button
                onClick={() => {
                  if (!state.token) {
                    return;
                  }
                  const validation = TokenManager.validateToken(state.token);
                  setValidation(validation);
                  alert("Token re-validated!");
                }}
                variant="outline"
              >
                🔄 Re-validate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
