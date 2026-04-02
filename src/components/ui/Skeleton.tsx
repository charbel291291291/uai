import { forwardRef } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantStyles = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-xl',
};

const animationStyles = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer',
  none: '',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className = '',
      variant = 'text',
      width,
      height,
      animation = 'pulse',
    },
    ref
  ) => {
    const baseClasses = `
      bg-white/10
      ${variantStyles[variant]}
      ${animationStyles[animation]}
      ${className}
    `;

    const style: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={style}
        aria-hidden="true"
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Pre-built skeleton patterns for common use cases

interface SkeletonCardProps {
  hasImage?: boolean;
  hasAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  hasImage = false,
  hasAvatar = false,
  lines = 3,
  className = '',
}: SkeletonCardProps) {
  return (
    <div className={`p-6 bg-[rgba(15,23,42,0.5)] backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
      {hasImage && (
        <Skeleton variant="rounded" height={160} className="w-full mb-4" />
      )}
      
      <div className="flex items-start gap-4">
        {hasAvatar && (
          <Skeleton variant="circular" width={48} height={48} />
        )}
        
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              height={i === 0 ? 24 : 16}
              width={i === 0 ? '60%' : i === lines - 1 ? '40%' : '100%'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SkeletonListProps {
  items?: number;
  hasAvatar?: boolean;
  className?: string;
}

export function SkeletonList({
  items = 5,
  hasAvatar = false,
  className = '',
}: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-[rgba(15,23,42,0.5)] backdrop-blur-xl border border-white/10 rounded-2xl"
        >
          {hasAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={16} width="40%" />
            <Skeleton variant="text" height={12} width="70%" />
          </div>
          
          <Skeleton variant="rounded" width={80} height={32} />
        </div>
      ))}
    </div>
  );
}

interface SkeletonGridProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function SkeletonGrid({
  columns = 3,
  rows = 2,
  className = '',
}: SkeletonGridProps) {
  return (
    <div
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <SkeletonCard key={i} hasImage hasAvatar lines={2} />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: SkeletonTableProps) {
  return (
    <div className={`bg-[rgba(15,23,42,0.5)] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="grid gap-4 p-4 border-b border-white/10 bg-white/5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={16} width="80%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 p-4 border-b border-white/5 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              height={14}
              width={colIndex === 0 ? '60%' : '80%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonProfileProps {
  className?: string;
}

export function SkeletonProfile({ className = '' }: SkeletonProfileProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cover */}
      <Skeleton variant="rounded" height={200} className="w-full" />
      
      {/* Avatar and Info */}
      <div className="flex items-end gap-6 px-6 -mt-16">
        <Skeleton variant="circular" width={120} height={120} className="border-4 border-[#020617]" />
        
        <div className="flex-1 pb-4 space-y-3">
          <Skeleton variant="text" height={28} width={200} />
          <Skeleton variant="text" height={16} width={120} />
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 space-y-4">
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} width="60%" />
      </div>
    </div>
  );
}
