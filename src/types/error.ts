/**
 * Error types that can occur in the application
 */
export const ErrorType = {
  SYNTAX_ERROR: 'syntax_error',
  RENDER_ERROR: 'render_error',
  NESTED_ERROR: 'nested_error',
  EXPORT_ERROR: 'export_error',
  NETWORK_ERROR: 'network_error'
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

/**
 * Diagram error information
 */
export interface DiagramError {
  type: ErrorType;
  message: string;
  line?: number;
  column?: number;
  diagramId?: string;
  stack?: string;
}

/**
 * Error handling result
 */
export interface ErrorResult {
  hasError: boolean;
  error?: DiagramError;
  recoverable: boolean;
}

/**
 * Error recovery options
 */
export interface ErrorRecoveryOptions {
  autoRetry: boolean;
  maxRetries: number;
  fallbackToCache: boolean;
  showPartialRender: boolean;
}