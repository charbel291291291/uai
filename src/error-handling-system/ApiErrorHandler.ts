import { useToast } from './ToastContext';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
  retryable?: boolean;
}

export interface ApiErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customMessages?: Record<number | string, string>;
  retryableStatuses?: number[];
}

// ============================================================================
// API ERROR HANDLER CLASS
// ============================================================================

export class ApiErrorHandler {
  public showToast: (options: { title: string; message?: string; retry?: () => Promise<void> }) => void;
  private logError: boolean;
  private customMessages: Record<number | string, string>;
  private retryableStatuses: number[];

  constructor(options: ApiErrorHandlerOptions = {}, toastFn?: (options: { title: string; message?: string; retry?: () => Promise<void> }) => void) {
    // Use provided toast function or try to get from window context
    if (toastFn) {
      this.showToast = toastFn;
    } else {
      const toastContext = (window as any).__toastContext;
      this.showToast = toastContext?.error || (() => {});
    }
    
    this.logError = options.logError ?? true;
    this.customMessages = options.customMessages ?? {};
    this.retryableStatuses = options.retryableStatuses ?? [408, 429, 500, 502, 503, 504];
  }

  /**
   * Handle an API error
   */
  handleError(error: any, options: ApiErrorHandlerOptions = {}): ApiError {
    const apiError = this.parseError(error);

    // Log error if enabled
    if (this.logError && options.logError !== false) {
      this.log(apiError, error);
    }

    // Show toast if enabled
    if (options.showToast !== false) {
      this.displayError(apiError);
    }

    return apiError;
  }

  /**
   * Parse different error types into a standard ApiError format
   */
  private parseError(error: any): ApiError {
    // Already an ApiError
    if (error && typeof error === 'object' && 'message' in error) {
      return error as ApiError;
    }

    // Fetch/HTTP errors
    if (error?.response) {
      const { response } = error;
      return {
        message: this.getErrorMessage(response.status, response.data),
        code: response.data?.code || response.data?.error,
        status: response.status,
        details: response.data,
        retryable: this.retryableStatuses.includes(response.status),
      };
    }

    // Network errors
    if (error?.name === 'TypeError' && error?.message === 'Failed to fetch') {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }

    // AbortError (request cancelled)
    if (error?.name === 'AbortError') {
      return {
        message: 'Request cancelled',
        code: 'ABORTED',
        retryable: false,
      };
    }

    // Generic error
    return {
      message: error?.message || 'An unexpected error occurred',
      code: error?.code || 'UNKNOWN_ERROR',
      retryable: false,
    };
  }

  /**
   * Get user-friendly error message based on status code
   */
  private getErrorMessage(status: number, data?: any): string {
    // Check custom messages first
    if (this.customMessages[status]) {
      return this.customMessages[status];
    }

    // Check if server provided a message
    if (data?.message) {
      return data.message;
    }

    // Default messages by status code
    const defaultMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Please log in to continue.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      408: 'Request timed out. Please try again.',
      409: 'Conflict. The resource already exists.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please wait a moment.',
      500: 'Server error. Please try again later.',
      502: 'Server unavailable. Please try again later.',
      503: 'Service temporarily unavailable. Please try again later.',
      504: 'Gateway timeout. Please try again later.',
    };

    return defaultMessages[status] || 'An unexpected error occurred.';
  }

  /**
   * Display error toast
   */
  private displayError(apiError: ApiError) {
    this.showToast({
      title: 'Error',
      message: apiError.message,
      retry: apiError.retryable
        ? async () => {
            // Retry logic would go here
            // This should be called with the original request
          }
        : undefined,
    });
  }

  /**
   * Log error to console / error tracking service
   */
  private log(apiError: ApiError, originalError: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', apiError);
      console.error('[Original Error]', originalError);
    }

    // TODO: Integrate with error tracking service (Sentry, etc.)
    // Example:
    // Sentry.captureException(originalError, {
    //   extra: { apiError }
    // });
  }

  /**
   * Create a handler for specific API calls
   */
  createHandler(overrides: Partial<ApiErrorHandlerOptions>) {
    return (error: any) => this.handleError(error, overrides);
  }
}

// ============================================================================
// HOOK FOR USING API ERROR HANDLER
// ============================================================================

export const useApiErrorHandler = (options: ApiErrorHandlerOptions = {}) => {
  const toast = useToast();

  // Initialize handler with toast context
  const handler = new ApiErrorHandler(options);
  
  // Override showToast to use actual toast context
  handler.showToast = toast.error;

  return handler;
};

export default ApiErrorHandler;
