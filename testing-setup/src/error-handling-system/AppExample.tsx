import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ToastProvider, useToast } from './ToastContext';
import { ToastContainer } from './ToastContainer';
import { useApi, useFetch } from './useApi';
import { ApiErrorHandler } from './ApiErrorHandler';

// ============================================================================
// EXAMPLE COMPONENT: API CALL WITH ERROR HANDLING
// ============================================================================

const UserProfile: React.FC = () => {
  const [userId, setUserId] = useState('1');
  
  // Mock API function
  const fetchUser = async (id: string) => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
    if (!response.ok) throw { response };
    return response.json();
  };

  // Use the useApi hook with error handling
  const { data: user, loading, error, execute, retry } = useApi(fetchUser, {
    showToast: true,
    showLoading: true,
    successMessage: 'User loaded successfully!',
    errorMessage: 'Failed to load user. Please try again.',
    retryable: true,
  });

  const handleLoadUser = () => {
    execute(userId);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>User Profile Example</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <button onClick={handleLoadUser} style={{ padding: '0.5rem 1rem' }}>
          Load User
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          <p>Error: {error.message}</p>
          {error.retryable && (
            <button onClick={retry} style={{ padding: '0.5rem 1rem' }}>
              Retry
            </button>
          )}
        </div>
      )}

      {user && (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>City:</strong> {user.address?.city}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE COMPONENT: MANUAL TOAST USAGE
// ============================================================================

const ToastDemo: React.FC = () => {
  const toast = useToast();

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Toast Demo</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() =>
            toast.success({
              title: 'Success!',
              message: 'Operation completed successfully.',
            })
          }
          style={{ padding: '0.5rem 1rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Success Toast
        </button>

        <button
          onClick={() =>
            toast.error({
              title: 'Error!',
              message: 'Something went wrong.',
              duration: 0, // Persistent until dismissed
              retry: async () => {
                console.log('Retrying...');
              },
            })
          }
          style={{ padding: '0.5rem 1rem', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Error Toast
        </button>

        <button
          onClick={() =>
            toast.warning({
              title: 'Warning!',
              message: 'Please be careful.',
            })
          }
          style={{ padding: '0.5rem 1rem', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Warning Toast
        </button>

        <button
          onClick={() =>
            toast.info({
              title: 'Info',
              message: 'Here is some information.',
            })
          }
          style={{ padding: '0.5rem 1rem', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Info Toast
        </button>

        <button
          onClick={() => toast.dismissAll()}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Dismiss All
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE COMPONENT: ERROR BOUNDARY TEST
// ============================================================================

class BrokenComponent extends React.Component<{}, never> {
  render(): never {
    throw new Error('This is a test error!');
  }
}

const ErrorBoundaryTest: React.FC = () => {
  const [showError, setShowError] = useState(false);

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>Error Boundary Test</h3>
      <button
        onClick={() => setShowError(true)}
        style={{ padding: '0.5rem 1rem' }}
      >
        Trigger Error
      </button>

      {showError && (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Caught by ErrorBoundary:', error, errorInfo);
          }}
        >
          <BrokenComponent />
        </ErrorBoundary>
      )}
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT WITH FULL INTEGRATION
// ============================================================================

const App: React.FC = () => {
  return (
    <ToastProvider defaultDuration={5000} maxToasts={5}>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Global Error Handling System - Demo</h1>
        
        <ErrorBoundary>
          <UserProfile />
          <ToastDemo />
          <ErrorBoundaryTest />
        </ErrorBoundary>
      </div>
      
      {/* Toast notifications container */}
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;
