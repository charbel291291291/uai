import React from 'react';
import { useToast, Toast } from './ToastContext';

// ============================================================================
// STYLES (Inline for portability - move to CSS file in production)
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '400px',
  },
  toast: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideIn 0.3s ease-out',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  toastHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  toastTitle: {
    fontWeight: 600,
    fontSize: '0.95rem',
    margin: 0,
  },
  toastMessage: {
    fontSize: '0.875rem',
    margin: 0,
    opacity: 0.9,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  retryButton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s',
  },
  progressBar: {
    height: '3px',
    borderRadius: '0 0 8px 8px',
    marginTop: '0.75rem',
    animation: 'shrink linear forwards',
  },
};

// Color schemes for different toast types
const typeStyles: Record<string, Partial<typeof styles>> = {
  success: {
    toast: {
      backgroundColor: '#10B981',
      color: 'white',
    },
    retryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
  },
  error: {
    toast: {
      backgroundColor: '#EF4444',
      color: 'white',
    },
    retryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
  },
  warning: {
    toast: {
      backgroundColor: '#F59E0B',
      color: 'white',
    },
    retryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
  },
  info: {
    toast: {
      backgroundColor: '#3B82F6',
      color: 'white',
    },
    retryButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
    },
    progressBar: {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
  },
};

// Icons for each toast type
const icons: Record<string, JSX.Element> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

// ============================================================================
// TOAST COMPONENT
// ============================================================================

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  retry,
  onDismiss,
}) => {
  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (retry) {
      try {
        await retry();
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  };

  const currentTypeStyles = typeStyles[type] || {};

  return (
    <div
      style={{
        ...styles.toast,
        ...currentTypeStyles.toast,
      }}
      onClick={() => onDismiss(id)}
      role="alert"
    >
      <div style={styles.toastHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icons[type]}
          <p style={styles.toastTitle}>{title}</p>
        </div>
        <button
          style={styles.closeButton}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(id);
          }}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {message && <p style={styles.toastMessage}>{message}</p>}

      {retry && (
        <button
          style={{
            ...styles.retryButton,
            ...currentTypeStyles.retryButton,
          }}
          onClick={handleRetry}
        >
          Retry
        </button>
      )}

      {duration > 0 && (
        <div
          style={{
            ...styles.progressBar,
            ...currentTypeStyles.progressBar,
            animationDuration: `${duration}ms`,
          }}
        />
      )}

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
};

// ============================================================================
// TOAST CONTAINER COMPONENT
// ============================================================================

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
