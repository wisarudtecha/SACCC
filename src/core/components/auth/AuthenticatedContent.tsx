// /src/components/auth/AuthenticatedContent.tsx
// Updated: [06-07-2025] v0.1.1
import React, { useState } from "react";
import { useAuth } from "@/core/hooks/useAuth";
import { TokenManager } from "@/core/utils/tokenManager";
import { JWTTokenInspector } from "@/core/components/auth/JWTTokenInspector";
import Button from "@/core/components/ui/button/Button";

export const AuthenticatedContent: React.FC = () => {
  const { state } = useAuth();
  const [debugVisible, setDebugVisible] = useState(false);

  return (
    <>
      <div className="mb-6">
        <Button
          onClick={() => setDebugVisible(!debugVisible)}
          variant="outline"
        >
          {debugVisible ? "🔒 Hide" : "🔧 Show"} Debug Info
        </Button>
        
        {debugVisible && (
          <div className="mt-2 bg-gray-800 dark:bg-gray-100 text-green-400 dark:text-green-500 p-4 rounded-lg font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div>🔐 Auth State:</div>
                <div>├─ isLoading: {String(state.isLoading)}</div>
                <div>├─ isAuthenticated: {String(state.isAuthenticated)}</div>
                <div>├─ user: {state.user ? "✅" : "❌"}</div>
                <div>└─ token: {state.token ? "✅" : "❌"}</div>
              </div>
              <div>
                <div>🎯 Storage:</div>
                <div>├─ localStorage: {TokenManager.getToken() ? "✅" : "❌"}</div>
                <div>├─ sessionStorage: {sessionStorage.getItem("access_token") ? "✅" : "❌"}</div>
                <div>└─ timestamp: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-green-900 dark:text-white mb-2">✅ JWT Token Decryption Added!</h3>
        <p className="text-sm text-green-700 dark:text-green-200 mb-3">
          Complete JWT token handling with decryption, validation, and auto-refresh capabilities.
        </p>
        <div className="text-xs text-green-600 dark:text-green-300 mb-2">
          <strong>New Features:</strong><br/>
          • Full JWT token decoding and validation<br/>
          • Automatic token refresh before expiry<br/>
          • Comprehensive token inspection<br/>
          • Security validation and error handling
        </div>
      </div>

      {/* JWT Token Inspector */}
      <div className="mb-6">
        <JWTTokenInspector />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome to the CMS Portal</h2>
          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
            <span>Authentication Active</span>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You are successfully authenticated and can access the protected content.
        </p>
        
        <div className="bg-blue-100 dark:bg-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-white mb-2">🔄 Refresh Test</h3>
          <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
            The page should now load without showing the login form on refresh!
          </p>
          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                window.location.reload();
              }}
              variant="primary"
            >
              🔄 Test Refresh
            </Button>
            <Button 
              onClick={() => {
                console.log("🧹 Clearing tokens and refreshing");
                TokenManager.clearTokens();
                window.location.reload();
              }}
              variant="error"
            >
              🧹 Clear & Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-100 dark:bg-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-white">Ticket Management</h3>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">Manage and track support tickets</p>
          </div>
          <div className="bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 className="font-medium text-green-900 dark:text-white">Workflow Engine</h3>
            <p className="text-sm text-green-700 dark:text-green-200 mt-1">Design and execute workflows</p>
          </div>
          <div className="bg-purple-100 dark:bg-purple-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 dark:text-white">Analytics Dashboard</h3>
            <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">View reports and metrics</p>
          </div>
        </div>
      </div>
    </>
  );
};
