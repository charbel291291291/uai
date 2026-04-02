/**
 * Test utilities for error handling system
 * Provides mock factories and test helpers
 */

import { ApiErrorHandler, ApiError } from './ApiErrorHandler';

/**
 * Create a mock toast function for testing
 */
export const createMockToast = () => jest.fn();

/**
 * Create a pre-configured mock ApiErrorHandler for testing
 */
export const createMockApiErrorHandler = (overrides?: Partial<ApiErrorHandler>) => {
  const mockHandler = {
    handleError: jest.fn().mockReturnValue({ message: 'Test error' } as ApiError),
    parseError: jest.fn(),
    createHandler: jest.fn(),
    ...overrides,
  };
  
  return mockHandler;
};

/**
 * Create an instance of ApiErrorHandler with mocked dependencies
 */
export const createTestableErrorHandler = (toastFn?: jest.Mock) => {
  const mockToast = toastFn || createMockToast();
  return new ApiErrorHandler({}, mockToast);
};

/**
 * Mock factory for Jest mocking
 */
export const createErrorHandlingMocks = () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismissAll: jest.fn(),
  }),
  ApiErrorHandler: jest.fn().mockImplementation(() => createMockApiErrorHandler()),
  useApiErrorHandler: jest.fn(),
});
