import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const styles: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500',
  secondary: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:text-gray-400',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

export function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
