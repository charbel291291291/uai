import { forwardRef, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check, Trash2, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success';
export type ConfirmationSize = 'sm' | 'md' | 'lg';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  size?: ConfirmationSize;
  isLoading?: boolean;
  isDestructive?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  confirmButtonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick'>;
  cancelButtonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick'>;
}

const variantIcons: Record<ConfirmationVariant, React.ReactNode> = {
  danger: <AlertTriangle className="w-6 h-6" />,
  warning: <ShieldAlert className="w-6 h-6" />,
  info: <Check className="w-6 h-6" />,
  success: <Check className="w-6 h-6" />,
};

const variantStyles: Record<ConfirmationVariant, { iconBg: string; iconColor: string; borderColor: string }> = {
  danger: {
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/20',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  info: {
    iconBg: 'bg-[#3A86FF]/10',
    iconColor: 'text-[#3A86FF]',
    borderColor: 'border-[#3A86FF]/20',
  },
  success: {
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    borderColor: 'border-green-500/20',
  },
};

const sizeClasses: Record<ConfirmationSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const ConfirmationModal = forwardRef<HTMLDivElement, ConfirmationModalProps>(
  (
    {
      isOpen,
      onClose,
      onConfirm,
      title,
      description,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'info',
      size = 'md',
      isLoading = false,
      isDestructive = false,
      icon,
      children,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      confirmButtonProps = {},
      cancelButtonProps = {},
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    const styles = variantStyles[variant];
    const displayIcon = icon || variantIcons[variant];
    const isDanger = isDestructive || variant === 'danger';

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Focus management
    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        // Focus confirm button after animation
        setTimeout(() => {
          confirmButtonRef.current?.focus();
        }, 100);
      } else {
        previousActiveElement.current?.focus();
      }
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    const handleConfirm = () => {
      onConfirm();
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="confirmation-title"
            aria-describedby={description ? 'confirmation-description' : undefined}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleOverlayClick}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              className={`relative w-full ${sizeClasses[size]} bg-[rgba(15,23,42,0.95)] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Close button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A86FF]/50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="p-6 sm:p-8">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl ${styles.iconBg} ${styles.iconColor} border ${styles.borderColor} flex items-center justify-center mb-5`}
                  aria-hidden="true"
                >
                  {displayIcon}
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h2
                    id="confirmation-title"
                    className="text-xl font-bold text-white mb-2"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p
                      id="confirmation-description"
                      className="text-white/60 leading-relaxed"
                    >
                      {description}
                    </p>
                  )}
                  {children && <div className="mt-4">{children}</div>}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
                  <Button
                    ref={confirmButtonRef}
                    variant={isDanger ? 'danger' : 'primary'}
                    fullWidth
                    onClick={handleConfirm}
                    isLoading={isLoading}
                    leftIcon={isDanger ? <Trash2 className="w-4 h-4" /> : undefined}
                    ariaLabel={confirmText}
                    {...confirmButtonProps}
                  >
                    {confirmText}
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={onClose}
                    disabled={isLoading}
                    ariaLabel={cancelText}
                    {...cancelButtonProps}
                  >
                    {cancelText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ConfirmationModal.displayName = 'ConfirmationModal';

// Pre-built confirmation patterns
interface DeleteConfirmationProps extends Omit<ConfirmationModalProps, 'variant' | 'title' | 'description' | 'confirmText'> {
  itemName?: string;
  itemType?: string;
}

export function DeleteConfirmation({
  itemName,
  itemType = 'item',
  ...props
}: DeleteConfirmationProps) {
  return (
    <ConfirmationModal
      variant="danger"
      title={`Delete ${itemType}`}
      description={itemName ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.` : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`}
      confirmText="Delete"
      isDestructive
      {...props}
    />
  );
}

interface LogoutConfirmationProps extends Omit<ConfirmationModalProps, 'variant' | 'title' | 'description' | 'confirmText' | 'icon'> {}

export function LogoutConfirmation(props: LogoutConfirmationProps) {
  return (
    <ConfirmationModal
      variant="warning"
      title="Log Out"
      description="Are you sure you want to log out? You'll need to sign in again to access your account."
      confirmText="Log Out"
      icon={<LogOut className="w-6 h-6" />}
      {...props}
    />
  );
}

interface UnsavedChangesConfirmationProps extends Omit<ConfirmationModalProps, 'variant' | 'title' | 'description' | 'confirmText' | 'cancelText'> {
  onDiscard: () => void;
  onSave?: () => void;
}

export function UnsavedChangesConfirmation({
  onDiscard,
  onSave,
  ...props
}: UnsavedChangesConfirmationProps) {
  return (
    <ConfirmationModal
      variant="warning"
      title="Unsaved Changes"
      description="You have unsaved changes. Do you want to save them before leaving?"
      confirmText={onSave ? 'Save Changes' : 'Leave Without Saving'}
      cancelText="Stay"
      onConfirm={onSave || onDiscard}
      {...props}
    >
      {onSave && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onDiscard}
            className="text-sm text-white/50 hover:text-red-400 transition-colors"
          >
            Discard changes
          </button>
        </div>
      )}
    </ConfirmationModal>
  );
}

interface ActionConfirmationProps extends Omit<ConfirmationModalProps, 'variant' | 'icon'> {
  actionName: string;
  targetName?: string;
}

export function ActionConfirmation({
  actionName,
  targetName,
  ...props
}: ActionConfirmationProps) {
  return (
    <ConfirmationModal
      variant="info"
      title={actionName}
      description={targetName ? `Are you sure you want to ${actionName.toLowerCase()} "${targetName}"?` : `Are you sure you want to ${actionName.toLowerCase()}?`}
      confirmText={actionName}
      {...props}
    />
  );
}

// Hook for using confirmation modal
interface UseConfirmationOptions extends Omit<ConfirmationModalProps, 'isOpen' | 'onClose' | 'onConfirm'> {
  onConfirm?: () => void | Promise<void>;
}

export function useConfirmation(options: UseConfirmationOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const handleConfirm = async () => {
    if (options.onConfirm) {
      setIsLoading(true);
      try {
        await options.onConfirm();
      } finally {
        setIsLoading(false);
        close();
      }
    } else {
      close();
    }
  };

  const modal = (
    <ConfirmationModal
      {...options}
      isOpen={isOpen}
      onClose={close}
      onConfirm={handleConfirm}
      isLoading={isLoading}
    />
  );

  return { isOpen, open, close, modal };
}

// Import useState for the hook
import { useState } from 'react';
