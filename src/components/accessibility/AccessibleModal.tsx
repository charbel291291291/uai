import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccessibleModal } from '../../hooks/useAccessibility';
import { Button } from '../ui/Button';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlayClick?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  ariaLabel,
  ariaDescribedBy,
}: AccessibleModalProps) {
  const { containerRef, handleKeyDown } = useAccessibleModal(isOpen, onClose);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`).current;
  const contentId = useRef(`modal-content-${Math.random().toString(36).substr(2, 9)}`).current;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  useEffect(() => {
    if (isOpen) {
      // Announce modal opening
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Dialog opened: ${title}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [isOpen, title]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="presentation"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className={`
          relative w-full ${sizeClasses[size]}
          bg-[#0f172a] border border-white/10 rounded-2xl
          shadow-2xl
          max-h-[90vh] overflow-y-auto
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || contentId}
        aria-label={ariaLabel}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 id={titleId} className="text-xl font-bold text-white">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            ariaLabel="Close dialog"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div id={contentId} className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
