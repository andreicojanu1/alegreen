import { CATEGORY_STYLE } from '../../lib/categoryStyle';

/** Codul categoriei cu iconița și culoarea ei fixă. */
export function CategoryChip({ cod, size = 'md' }: { cod: string; size?: 'sm' | 'md' }) {
  const s = CATEGORY_STYLE[cod];
  const Icon = s?.icon;
  const box = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-flex ${box} shrink-0 items-center justify-center rounded-lg text-white`} style={{ background: s?.color ?? '#9ca3af' }} aria-hidden>
        {Icon && <Icon size={size === 'sm' ? 14 : 17} strokeWidth={2} />}
      </span>
      <span className="font-semibold text-gray-900">{cod}</span>
    </span>
  );
}
