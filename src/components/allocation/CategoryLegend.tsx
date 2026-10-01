import Decimal from 'decimal.js';
import { TriangleAlert } from 'lucide-react';
import type { AllocationResult } from '../../engine/types';
import type { CategoryRule } from '../../data/types';
import { byDisplayOrder } from '../../data/categories';
import { CATEGORY_STYLE, categoryColor } from '../../lib/categoryStyle';
import { fmtKg, fmtPct } from '../../lib/format';

/**
 * Legenda donut-ului ca listă de categorii (M2): iconiță, cod, nume, kg colectat, % din total, obligația categoriei
 * și o mini-bară obligație vs. colectat propriu, cu marcaj la minimul propriu și semnalare A-01.
 * Categoriile inactive apar estompate.
 */
export function CategoryLegend({ preview, reguli }: { preview: AllocationResult; reguli: CategoryRule[] }) {
  const total = preview.totaluri.colectat;
  const rows = [...reguli].sort((a, b) => byDisplayOrder(a.cod, b.cod));

  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((rule) => {
        const r = preview.categorii.find((c) => c.cod === rule.cod);
        const style = CATEGORY_STYLE[rule.cod];
        const Icon = style?.icon;
        const colectat = r?.colectat ?? new Decimal(0);
        const obligatie = r?.obligatie ?? new Decimal(0);
        const sub = r ? r.colectat.lessThan(r.minimPropriu) : false;
        const fill = obligatie.isZero() ? 0 : Decimal.min(colectat.div(obligatie), 1).toNumber() * 100;
        const minPos = obligatie.isZero() || !r ? 0 : r.pragMinimPropriu.toNumber() * 100;
        return (
          <li key={rule.cod} className={`grid grid-cols-[36px_1fr_auto] items-center gap-3 py-2.5 ${rule.activ ? '' : 'opacity-45'}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: categoryColor(rule.cod) }} aria-hidden>
              {Icon && <Icon size={18} />}
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold">{rule.cod}</span>
                <span className="truncate text-gray-800">{rule.denumire}</span>
                {!rule.activ && <span className="text-xs text-gray-500">· inactivă</span>}
              </div>
              {rule.activ && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    className="relative h-1.5 w-full max-w-[260px] rounded-full bg-gray-200"
                    title={`Colectat propriu ${fmtKg(colectat)} kg din obligația de ${fmtKg(obligatie)} kg`}
                  >
                    <div className="h-full rounded-full" style={{ width: `${fill}%`, background: categoryColor(rule.cod) }} />
                    {minPos > 0 && minPos < 100 && (
                      <span className="absolute -top-1 h-3.5 w-0.5 bg-gray-700" style={{ left: `${minPos}%` }} title="Minim din categoria proprie" />
                    )}
                  </div>
                  {sub ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-800">
                      <TriangleAlert size={13} className="text-amber-600" /> A-01 sub minimul propriu
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-gray-500 tabular">
                      {obligatie.isZero() ? 'fără obligație' : `${fmtPct(colectat.div(obligatie), 1)} din obligație`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular">{fmtKg(colectat)} kg</div>
              <div className="text-xs text-gray-500 tabular">
                {total.isZero() ? '0,00%' : fmtPct(colectat.div(total))} · obligație {fmtKg(obligatie)} kg
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
