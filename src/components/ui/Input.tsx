import { forwardRef, useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ariaLabel, ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id || `input-${generatedId}`;
    const errorId = `error-${generatedId}`;
    const helperId = `helper-${generatedId}`;
    
    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      ariaDescribedBy
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-white/70 mb-2"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
            {props.required && <span className="sr-only">(required)</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full
              bg-[rgba(30,41,59,0.4)]
              border
              ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#3A86FF]'}
              rounded-xl
              py-3 px-4
              text-white placeholder:text-white/30
              transition-all duration-200
              focus:outline-none
              focus:ring-2 focus:ring-[#3A86FF]/20
              focus:shadow-[0_0_20px_rgba(58,134,255,0.15)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              ${className}
            `}
            aria-label={ariaLabel || (label ? undefined : props.placeholder)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={props.required}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-white/40">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ariaLabel, ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = props.id || `textarea-${generatedId}`;
    const errorId = `error-${generatedId}`;
    const helperId = `helper-${generatedId}`;
    
    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      ariaDescribedBy
    ].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-white/70 mb-2"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
            {props.required && <span className="sr-only">(required)</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full
            bg-[rgba(30,41,59,0.4)]
            border
            ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#3A86FF]'}
            rounded-xl
            py-3 px-4
            text-white placeholder:text-white/30
            transition-all duration-200
            focus:outline-none
            focus:ring-2 focus:ring-[#3A86FF]/20
            focus:shadow-[0_0_20px_rgba(58,134,255,0.15)]
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${className}
          `}
          aria-label={ariaLabel || (label ? undefined : props.placeholder)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={props.required}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-white/40">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
