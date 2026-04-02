// Global Error Handling System
// Complete solution for React applications

// Core Components
export { ErrorBoundary } from './ErrorBoundary';
export { ToastProvider, useToast } from './ToastContext';
export { ToastContainer } from './ToastContainer';
export { default as ToastContext } from './ToastContext';

// API Error Handling
export { ApiErrorHandler, useApiErrorHandler } from './ApiErrorHandler';
export type { ApiError, ApiErrorHandlerOptions } from './ApiErrorHandler';

// Custom Hooks
export { useApi, useFetch } from './useApi';
export type { UseApiOptions, UseApiReturn } from './useApi';

// Re-export types
export type { Toast, ToastType, ToastOptions } from './ToastContext';
