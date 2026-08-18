// src/components/security/withErrorBoundary.tsx
import React, { Component, ErrorInfo } from "react";
import type { Props, State } from "@/core/types/error-boundary";
import { InlineErrorFallback } from "@/core/components/security/InlineErrorFallback";
import { DefaultErrorFallback } from "@/core/components/security/DefaultErrorFallback";

// Error reporting service simulation
export const ErrorReportingService = {
  reportError: (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    console.error("Error reported to monitoring service:", {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    // In real implementation, send to service like Sentry, LogRocket, etc.
    // fetch("/api/errors", { method: "POST", body: JSON.stringify({...}) })
  }
};

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Report error to monitoring service
    ErrorReportingService.reportError(error, errorInfo, this.state.errorId);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetError = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Implement exponential backoff for automatic retries
    if (newRetryCount <= 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
        retryCount: newRetryCount,
        copied: false
      });

      // Auto-retry with backoff if error persists
      this.retryTimeoutId = window.setTimeout(() => {
        if (this.state.hasError && newRetryCount < 3) {
          this.resetError();
        }
      }, Math.pow(2, newRetryCount) * 1000);
    } else {
      // Max retries reached, just reset state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
        retryCount: newRetryCount,
        copied: false
      });
    }
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallbackComponent || 
        (this.props.isolate ? InlineErrorFallback : DefaultErrorFallback);

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
