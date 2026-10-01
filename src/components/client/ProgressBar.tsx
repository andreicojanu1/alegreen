import Decimal from 'decimal.js';

/** Bară de progres 0–100%; verde la 100%, albastru sub. */
export function ProgressBar({ ratio, className = '' }: { ratio: Decimal.Value; className?: string }) {
  const r = Decimal.min(Decimal.max(new Decimal(ratio), 0), 1);
  const full = r.greaterThanOrEqualTo('0.99995');
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-gray-200 ${className}`} role="progressbar" aria-valuenow={Number(r.times(100).toFixed(2))} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${full ? 'bg-green-600' : 'bg-blue-500'}`} style={{ width: `${r.times(100).toFixed(2)}%` }} />
    </div>
  );
}
