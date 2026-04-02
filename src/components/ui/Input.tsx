import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/70 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
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
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-white/40">{helperText}</p>
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
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/70 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
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
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-white/40">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
