import { ReactNode } from 'react';
import { 
  Search, 
  FileX, 
  Inbox, 
  Users, 
  FolderOpen, 
  Bell,
  MessageSquare,
  Heart,
  Star,
  Zap,
  LucideIcon
} from 'lucide-react';
import { Button } from './Button';

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  file: FileX,
  inbox: Inbox,
  users: Users,
  folder: FolderOpen,
  bell: Bell,
  message: MessageSquare,
  heart: Heart,
  star: Star,
  zap: Zap,
};

interface EmptyStateProps {
  icon?: keyof typeof iconMap | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  secondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : null;

  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center text-center py-12 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          {IconComponent ? (
            <IconComponent className="text-white/30" size={24} />
          ) : (
            icon
          )}
        </div>
        <h3 className="text-sm font-semibold text-white/60 mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-white/40 max-w-xs">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3A86FF]/20 to-[#00C6FF]/10 border border-[#3A86FF]/20 flex items-center justify-center">
          {IconComponent ? (
            <IconComponent className="text-[#3A86FF]" size={40} />
          ) : (
            icon
          )}
        </div>
        
        {/* Decorative glow */}
        <div className="absolute inset-0 rounded-3xl bg-[#3A86FF]/20 blur-2xl -z-10" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-white/50 max-w-sm mb-6 leading-relaxed">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty state patterns for common scenarios

interface EmptySearchProps {
  query?: string;
  onClear?: () => void;
  className?: string;
}

export function EmptySearch({ query, onClear, className = '' }: EmptySearchProps) {
  return (
    <EmptyState
      icon="search"
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={onClear ? {
        label: 'Clear search',
        onClick: onClear,
        variant: 'secondary',
      } : undefined}
      className={className}
    />
  );
}

interface EmptyInboxProps {
  type?: 'messages' | 'notifications' | 'invites';
  className?: string;
}

export function EmptyInbox({ type = 'messages', className = '' }: EmptyInboxProps) {
  const config = {
    messages: {
      icon: 'message' as const,
      title: 'No messages yet',
      description: 'Your inbox is empty. Start a conversation to see messages here.',
    },
    notifications: {
      icon: 'bell' as const,
      title: 'No notifications',
      description: "You're all caught up! Check back later for updates.",
    },
    invites: {
      icon: 'users' as const,
      title: 'No invites',
      description: 'You have no pending invitations at the moment.',
    },
  };

  const { icon, title, description } = config[type];

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      className={className}
    />
  );
}

interface EmptyContentProps {
  type?: 'posts' | 'files' | 'projects' | 'favorites';
  onCreate?: () => void;
  className?: string;
}

export function EmptyContent({ type = 'posts', onCreate, className = '' }: EmptyContentProps) {
  const config = {
    posts: {
      icon: 'folder' as const,
      title: 'No posts yet',
      description: 'Get started by creating your first post.',
      actionLabel: 'Create post',
    },
    files: {
      icon: 'file' as const,
      title: 'No files uploaded',
      description: 'Upload files to see them here.',
      actionLabel: 'Upload file',
    },
    projects: {
      icon: 'folder' as const,
      title: 'No projects yet',
      description: 'Start your first project to organize your work.',
      actionLabel: 'New project',
    },
    favorites: {
      icon: 'heart' as const,
      title: 'No favorites',
      description: 'Items you favorite will appear here.',
    },
  };

  const { icon, title, description, actionLabel } = config[type];

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreate && actionLabel ? {
        label: actionLabel,
        onClick: onCreate,
        variant: 'primary',
      } : undefined}
      className={className}
    />
  );
}

interface EmptyStateCardProps {
  icon?: keyof typeof iconMap;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyStateCard({
  icon = 'search',
  title,
  description,
  action,
  className = '',
}: EmptyStateCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className={`p-8 bg-[rgba(15,23,42,0.5)] backdrop-blur-xl border border-white/10 rounded-2xl text-center ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <IconComponent className="text-white/30" size={28} />
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-white/50 mb-4">{description}</p>
      )}
      
      {action && (
        <Button
          variant="secondary"
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
