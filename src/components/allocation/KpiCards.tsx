import type { ReactNode } from 'react';

export function KpiCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="mt-1 text-xl font-bold text-gray-900 tabular">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

export function KpiCards({ items }: { items: { label: string; value: ReactNode; hint?: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}
