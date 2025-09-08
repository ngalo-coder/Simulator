import { Component, ErrorInfo, ReactNode } from 'react';
import SpecialtyFallback from './SpecialtyFallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class SpecialtyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('SpecialtyErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Determine error type for better user experience
      let errorType = 'Unknown error';
      if (this.state.error) {
        if (this.state.error.message.includes('ChunkLoadError') || 
            this.state.error.message.includes('Loading chunk')) {
          errorType = 'Network error';
        } else if (this.state.error.message.includes('specialty') || 
                   this.state.error.message.includes('Specialty')) {
          errorType = 'Specialty not found';
        } else if (this.state.error.message.includes('fetch') || 
                   this.state.error.message.includes('Network')) {
          errorType = 'Network error';
        }
      }

      return (
        <>
          <SpecialtyFallback
            error={errorType}
            onRetry={() => window.location.reload()}
            showRetry={true}
          />
          
          {/* Development error details */}
          {import.meta.env.DEV && this.state.error && (
            <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
              <details>
                <summary className="cursor-pointer text-sm text-red-700 font-medium hover:text-red-800">
                  🐛 Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
                  <div className="font-semibold mb-1">Error:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  <div className="font-semibold mb-1">Stack:</div>
                  <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                </div>
              </details>
            </div>
          )}
        </>
      );
    }

    return this.props.children;
  }
}

export default SpecialtyErrorBoundary;