import { useState, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { ApiErrorHandler, ApiError } from './ApiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface UseApiOptions<T> {
  showToast?: boolean;
  showLoading?: boolean;
  successMessage?: string;
  errorMessage?: string;
  retryable?: boolean;
  onError?: (error: ApiError) => void;
  onSuccess?: (data: T) => void;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
}

// ============================================================================
// CUSTOM HOOK FOR API CALLS WITH ERROR HANDLING
// ============================================================================

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const toast = useToast();
  const errorHandler = new ApiErrorHandler();
  // Override showToast to use actual toast
  (errorHandler as any).showToast = toast.error;

  const lastCallArgs = useRef<any[]>([]);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      lastCallArgs.current = args;

      try {
        const result = await apiFunction(...args);
        setData(result);

        // Show success toast if message provided
        if (options.successMessage) {
          toast.success({
            title: 'Success',
            message: options.successMessage,
          });
        }

        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const apiError = errorHandler.handleError(err, {
          showToast: options.showToast !== false,
          logError: true,
          retryableStatuses: options.retryable ? [408, 429, 500, 502, 503, 504] : [],
        });

        // Override with custom error message if provided
        if (options.errorMessage) {
          apiError.message = options.errorMessage;
        }

        setError(apiError);

        // Call error callback
        if (options.onError) {
          options.onError(apiError);
        }

        return null;
      } finally {
        if (options.showLoading !== false) {
          setLoading(false);
        }
      }
    },
    [apiFunction, toast, options]
  );

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastCallArgs.current.length > 0) {
      return execute(...lastCallArgs.current);
    }
    return null;
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    lastCallArgs.current = [];
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry,
  };
}

// ============================================================================
// HOOK FOR FETCH WITH BUILT-IN ERROR HANDLING
// ============================================================================

interface FetchOptions extends RequestInit {
  baseUrl?: string;
  timeout?: number;
}

export function useFetch() {
  const toast = useToast();
  const errorHandler = new ApiErrorHandler();
  (errorHandler as any).showToast = toast.error;

  const fetchWithHandling = useCallback(
    async <T = any>(
      url: string,
      options: FetchOptions = {}
    ): Promise<{ data: T | null; error: ApiError | null }> => {
      const {
        baseUrl = '',
        timeout = 30000,
        headers = {},
        ...fetchOptions
      } = options;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${baseUrl}${url}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw { response };
        }

        const data = await response.json();
        return { data, error: null };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const apiError = errorHandler.handleError(err);
        return { data: null, error: apiError };
      }
    },
    [toast]
  );

  return { fetch: fetchWithHandling };
}

export default useApi;
