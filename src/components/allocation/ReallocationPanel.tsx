import Decimal from 'decimal.js';
import type { AdjustedResult } from '../../engine/adjustments';
import { fmtKg } from '../../lib/format';
import { CategoryChip } from './CategoryChip';

/**
 * Cantitățile disponibile la revizuire, actualizate live: pe fiecare categorie, cât a fost alocat categoriei,
 * cât e atribuit clienților și cât e retras și încă neatribuit („disponibil de realocat").
 */
export function ReallocationPanel({ res, names }: { res: AdjustedResult; names: Record<string, string> }) {
  const cats = res.categorii.filter((c) => res.clienti.some((r) => r.categorie === c.cod));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cats.map((c) => {
        const buf = res.disponibilRealocat[c.cod]?.total ?? new Decimal(0);
        const open = buf.greaterThanOrEqualTo('0.005');
        return (
          <div key={c.cod} className={`rounded-xl border px-4 py-3 transition-colors ${open ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-2" title={names[c.cod]}>
              <CategoryChip cod={c.cod} size="sm" />
              <span className="truncate text-xs text-gray-600">{names[c.cod]}</span>
            </div>
            <dl className="mt-2 space-y-0.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-600">Alocat categoriei</dt>
                <dd className="tabular">{fmtKg(c.totalAlocat)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Atribuit clienților</dt>
                <dd className="tabular">{fmtKg(c.totalAlocat.minus(buf))}</dd>
              </div>
            </dl>
            <div className={`mt-2 flex items-baseline justify-between border-t pt-2 ${open ? 'border-amber-200' : 'border-gray-100'}`}>
              <span className={`text-xs font-medium ${open ? 'text-amber-900' : 'text-gray-600'}`}>Disponibil de realocat</span>
              <span className={`text-base font-bold tabular ${open ? 'text-amber-900' : 'text-gray-400'}`}>{fmtKg(buf)} kg</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
