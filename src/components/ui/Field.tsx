import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export const inputClass =
  'h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400';

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-gray-800">{children}</span>;
}

const width = (className: string) => (/(^|\s)w-/.test(className) ? '' : 'w-full');

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} ${width(className)} pr-8 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${width(className)} ${className}`} {...rest} />;
}
