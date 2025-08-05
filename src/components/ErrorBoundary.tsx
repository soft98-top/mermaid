import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Suppress SES-related errors
    if (error.message?.includes('SES_UNCAUGHT_EXCEPTION') || 
        error.stack?.includes('lockdown-install.js')) {
      console.warn('Suppressed SES error:', error.message);
      this.setState({ hasError: false });
      return;
    }
  }

  componentDidMount() {
    // Add global error handler for SES errors
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleGlobalError = (event: ErrorEvent) => {
    if (event.filename?.includes('lockdown-install.js') || 
        event.message?.includes('SES_UNCAUGHT_EXCEPTION')) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Suppressed SES global error:', event.message);
      return false;
    }
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (event.reason?.message?.includes('SES_UNCAUGHT_EXCEPTION')) {
      event.preventDefault();
      console.warn('Suppressed SES promise rejection:', event.reason);
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <div className="text-red-800 font-semibold">组件渲染错误</div>
            <div className="text-red-600 text-sm mt-1">
              {this.state.error?.message || '未知错误'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}