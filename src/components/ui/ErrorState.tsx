import { ReactNode } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  WifiOff, 
  ServerOff,
  RefreshCw,
  Home,
  ArrowLeft,
  LucideIcon
} from 'lucide-react';
import { Button } from './Button';

const iconMap: Record<string, LucideIcon> = {
  error: AlertCircle,
  warning: AlertTriangle,
  offline: WifiOff,
  server: ServerOff,
};

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorStateProps {
  severity?: ErrorSeverity;
  icon?: keyof typeof iconMap | ReactNode;
  title: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  compact?: boolean;
}

const severityConfig = {
  error: {
    icon: 'error' as const,
    iconColor: 'text-red-400',
    bgColor: 'from-red-500/20 to-red-600/10',
    borderColor: 'border-red-500/30',
    glowColor: 'bg-red-500/20',
  },
  warning: {
    icon: 'warning' as const,
    iconColor: 'text-amber-400',
    bgColor: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    glowColor: 'bg-amber-500/20',
  },
  info: {
    icon: 'error' as const,
    iconColor: 'text-[#3A86FF]',
    bgColor: 'from-[#3A86FF]/20 to-[#00C6FF]/10',
    borderColor: 'border-[#3A86FF]/30',
    glowColor: 'bg-[#3A86FF]/20',
  },
};

export function ErrorState({
  severity = 'error',
  icon,
  title,
  message,
  error,
  onRetry,
  onGoBack,
  onGoHome,
  retryCount,
  maxRetries,
  className = '',
  compact = false,
}: ErrorStateProps) {
  const config = severityConfig[severity];
  const IconComponent = typeof icon === 'string' ? (iconMap[icon] || iconMap[config.icon]) : null;
  
  const errorMessage = error instanceof Error ? error.message : error;
  const showRetry = onRetry && (!maxRetries || (retryCount || 0) < maxRetries);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-[rgba(15,23,42,0.8)] backdrop-blur-xl border ${config.borderColor} rounded-xl ${className}`}>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.bgColor} border ${config.borderColor} flex items-center justify-center flex-shrink-0`}>
          {IconComponent ? (
            <IconComponent className={config.iconColor} size={20} />
          ) : (
            icon
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {message && (
            <p className="text-xs text-white/50 truncate">{message}</p>
          )}
        </div>
        
        {showRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw size={14} />}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {/* Icon */}
      <div className="relative mb-6">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
          {IconComponent ? (
            <IconComponent className={config.iconColor} size={48} />
          ) : (
            icon
          )}
        </div>
        
        {/* Decorative glow */}
        <div className={`absolute inset-0 rounded-3xl ${config.glowColor} blur-3xl -z-10`} />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>

      {/* Message */}
      {message && (
        <p className="text-white/50 max-w-md mb-4 leading-relaxed">{message}</p>
      )}

      {/* Error Details */}
      {errorMessage && (
        <div className="max-w-md mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <p className="text-xs text-red-400/80 font-mono break-all">{errorMessage}</p>
        </div>
      )}

      {/* Retry Info */}
      {retryCount !== undefined && maxRetries && (
        <p className="text-sm text-white/40 mb-6">
          Attempt {retryCount + 1} of {maxRetries}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {showRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            leftIcon={<RefreshCw size={18} />}
          >
            Try Again
          </Button>
        )}
        
        {onGoBack && (
          <Button
            variant="secondary"
            onClick={onGoBack}
            leftIcon={<ArrowLeft size={18} />}
          >
            Go Back
          </Button>
        )}
        
        {onGoHome && (
          <Button
            variant="ghost"
            onClick={onGoHome}
            leftIcon={<Home size={18} />}
          >
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}

// Pre-built error state patterns

interface NetworkErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, className = '' }: NetworkErrorProps) {
  return (
    <ErrorState
      severity="warning"
      icon="offline"
      title="You're offline"
      message="Please check your internet connection and try again."
      onRetry={onRetry}
      className={className}
    />
  );
}

interface ServerErrorProps {
  statusCode?: number;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function ServerError({ statusCode, onRetry, onGoHome, className = '' }: ServerErrorProps) {
  const titles: Record<number, string> = {
    404: 'Page not found',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
  };

  const messages: Record<number, string> = {
    404: "The page you're looking for doesn't exist or has been moved.",
    500: "Something went wrong on our end. We're working to fix it.",
    502: "We're having trouble connecting to our servers. Please try again.",
    503: "Our service is temporarily unavailable. Please check back soon.",
  };

  return (
    <ErrorState
      severity="error"
      icon="server"
      title={statusCode ? titles[statusCode] || 'Server error' : 'Something went wrong'}
      message={statusCode ? messages[statusCode] || 'An unexpected error occurred.' : 'An unexpected error occurred.'}
      onRetry={onRetry}
      onGoHome={onGoHome}
      className={className}
    />
  );
}

interface NotFoundProps {
  resource?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function NotFound({ resource = 'page', onGoBack, onGoHome, className = '' }: NotFoundProps) {
  return (
    <ErrorState
      severity="info"
      icon="error"
      title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`}
      message={`The ${resource} you're looking for doesn't exist or has been removed.`}
      onGoBack={onGoBack}
      onGoHome={onGoHome}
      className={className}
    />
  );
}

interface PermissionDeniedProps {
  onGoHome?: () => void;
  className?: string;
}

export function PermissionDenied({ onGoHome, className = '' }: PermissionDeniedProps) {
  return (
    <ErrorState
      severity="warning"
      icon="warning"
      title="Access denied"
      message="You don't have permission to access this resource. Please contact an administrator if you think this is a mistake."
      onGoHome={onGoHome}
      className={className}
    />
  );
}

interface ErrorBoundaryProps {
  error: Error;
  onReset?: () => void;
  className?: string;
}

export function ErrorBoundaryFallback({ error, onReset, className = '' }: ErrorBoundaryProps) {
  return (
    <ErrorState
      severity="error"
      title="Something went wrong"
      message="An unexpected error occurred. We've been notified and are working to fix it."
      error={error}
      onRetry={onReset}
      className={className}
    />
  );
}

// Error toast/notification component
interface ErrorToastProps {
  title: string;
  message?: string;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorToast({ title, message, onClose, onRetry, className = '' }: ErrorToastProps) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl ${className}`}>
      <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        {message && (
          <p className="text-xs text-white/60 mt-1">{message}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Retry
          </button>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/60 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
