import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>{children}</section>;
}

export function CardHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {actions}
    </div>
  );
}
