import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult, fireEvent, waitFor, screen } from '@testing-library/react';
import { ToastProvider, ToastContainer } from './error-handling-system';

// Extend RenderResult with custom utilities
interface CustomRenderResult extends RenderResult {
  findByTextWithWait: (text: string, timeout?: number) => Promise<void>;
}

// Custom provider for app context
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider defaultDuration={1000} maxToasts={10}>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
};

/**
 * Custom render function that includes all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): CustomRenderResult => {
  const result = render(ui, { wrapper: AllTheProviders, ...options });
  return {
    ...result,
    // Add custom utilities here
    findByTextWithWait: async (text: string, timeout = 1000) => {
      await waitFor(() => {
        expect(screen.getByText(text)).toBeInTheDocument();
      }, { timeout });
    },
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Custom test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: null,
  bio: null,
  is_admin: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  id: 'conv-test-id',
  user_id: 'test-user-id',
  profile_id: 'profile-test-id',
  messages: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockMessage = (content: string, role: 'user' | 'assistant' = 'user') => ({
  role,
  content,
  timestamp: new Date().toISOString(),
});

export const mockAuthState = {
  user: null as any,
  loading: false,
  isAuthenticated: false,
};

export const flushPromises = () => new Promise(process.nextTick);

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Event helpers
export const changeInput = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } });
};

export const clickButton = (button: HTMLElement) => {
  fireEvent.click(button);
};

export const submitForm = (form: HTMLElement) => {
  fireEvent.submit(form);
};
