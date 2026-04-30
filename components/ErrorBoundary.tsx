
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch runtime errors in the component tree.
 * Explicitly extending Component to ensure robust type inheritance for state and props.
 */
// Adding comment above fix: Using Component explicitly from 'react' to resolve inheritance and fix missing setState/props errors
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Adding comment above fix: Explicitly defining state with interface to ensure correct typing in class methods
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  // Adding comment above fix: Accessing inherited setState from Component to update error details
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Catch errors in components below and update state to re-render with error info
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  // Adding comment above fix: Accessing inherited setState from Component to reset error state
  handleReset = () => {
    // Manually reset error state using inherited setState method
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  // Adding comment above fix: Accessing inherited state and props from Component in render method
  render() {
    // Accessing state property inherited from Component
    if (this.state.hasError) {
      // Accessing props property inherited from Component
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white p-6">
          <div className="max-w-lg w-full bg-gray-900 border border-red-900/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-red-900/20 p-6 border-b border-red-900/30 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Application Error</h2>
                <p className="text-red-400 text-sm">A critical issue stopped the app.</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-black/50 p-4 rounded-lg border border-gray-800">
                <p className="text-sm font-mono text-gray-300 break-words">
                  {/* Access state property inherited from Component */}
                  {this.state.error?.message || "Unknown error occurred"}
                </p>
                {/* Conditionally render debug info if errorInfo exists in state */}
                {this.state.errorInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <details className="text-xs text-gray-500 font-mono">
                      <summary className="cursor-pointer hover:text-gray-300 mb-2">Stack Trace</summary>
                      <pre className="overflow-auto max-h-40 whitespace-pre-wrap">
                        {/* Access state property inherited from Component */}
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reload Application
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Adding comment above fix: Accessing inherited children from props in Component
    return this.props.children;
  }
}

export default ErrorBoundary;
