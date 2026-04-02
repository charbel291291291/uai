import React, { lazy, Suspense, ComponentType } from 'react';

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

interface LazyPageOptions {
  /** Custom loading component */
  loadingComponent?: ComponentType;
  /** Delay before showing loader (ms) */
  loadingDelay?: number;
  /** Retry attempts on failure */
  retryAttempts?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
}

/**
 * Enhanced lazy loader with retry logic and custom loading states
 */
function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyPageOptions = {}
): T {
  const {
    loadingDelay = 300,
    retryAttempts = 2,
    retryDelay = 1000,
  } = options;

  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const module = await importFunc();
        return module;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError;
  });
}

// ============================================================================
// PAGE LOADER COMPONENT WITH DELAYED LOADING STATE
// ============================================================================

interface PageLoaderProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  children, 
  delay = 300,
  fallback
}) => {
  const [showLoader, setShowLoader] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowLoader(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!showLoader) {
    return null;
  }

  return fallback || <PageLoadingFallback />;
};

// ============================================================================
// DEFAULT LOADING FALLBACK
// ============================================================================

export const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center space-y-4">
      {/* Animated spinner with neon glow */}
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 border-4 border-brand-accent/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-brand-accent/30 rounded-full animate-spin reverse"></div>
      </div>
      
      {/* Loading text with pulse */}
      <p className="text-brand-text/60 animate-pulse">Loading...</p>
      
      {/* Progress bar */}
      <div className="w-48 h-1 bg-brand-bg rounded-full overflow-hidden mx-auto">
        <div className="h-full bg-gradient-to-r from-brand-accent to-brand-accent/50 animate-progress" />
      </div>
    </div>
    
    <style>{`
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
      
      .animate-progress {
        animation: progress 1.5s ease-in-out infinite;
      }
      
      .reverse {
        animation-direction: reverse;
        animation-duration: 2s;
      }
    `}</style>
  </div>
);

// ============================================================================
// ERROR BOUNDARY FOR LAZY COMPONENTS
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry: () => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, retryCount: 0 });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card border border-red-500/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-brand-text mb-2">Failed to Load</h3>
            <p className="text-brand-text/60 text-sm mb-6">
              We couldn't load this page. This might be due to a network issue.
            </p>
            
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-brand-accent hover:bg-brand-accent/80 text-brand-bg font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// WRAPPER FOR LAZY PAGES WITH ERROR HANDLING
// ============================================================================

interface LazyPageWrapperProps {
  lazyComponent: React.LazyExoticComponent<ComponentType<any>>;
  loadingDelay?: number;
  fallback?: React.ReactNode;
}

export const LazyPageWrapper: React.FC<LazyPageWrapperProps> = ({
  lazyComponent: LazyComponent,
  loadingDelay = 300,
  fallback,
}) => {
  const [retryKey, setRetryKey] = React.useState(0);

  const handleRetry = () => {
    setRetryKey(prev => prev + 1);
  };

  return (
    <LazyComponentErrorBoundary key={retryKey} onRetry={handleRetry}>
      <Suspense fallback={<PageLoader delay={loadingDelay} fallback={fallback || <PageLoadingFallback />} />}>
        <LazyComponent />
      </Suspense>
    </LazyComponentErrorBoundary>
  );
};

// ============================================================================
// EXPORT HOOK FOR PROGRAMMATIC PRELOADING
// ============================================================================

/**
 * Hook to programmatically preload lazy components
 */
export function usePreload<T>(importFunc: () => Promise<{ default: T }>) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const preload = React.useCallback(async () => {
    if (isPreloaded || isLoading) return;
    
    setIsLoading(true);
    try {
      await importFunc();
      setIsPreloaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [importFunc, isPreloaded, isLoading]);

  return { isPreloaded, isLoading, error, preload };
}

export { lazyWithRetry, PageLoader };
export default LazyPageWrapper;
