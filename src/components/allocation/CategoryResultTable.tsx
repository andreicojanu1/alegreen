import type Decimal from 'decimal.js';
import type { AllocationResult, CategoryResult } from '../../engine/types';
import { monthKey } from '../../engine/months';
import { LUNI_SCURT, fmtKg, fmtPct } from '../../lib/format';
import { ReconciliationCards } from './ReconciliationCards';

/** „Rezultat pe categorii" — reproduce foaia „Alocare colectat" (UI-A2), în ordinea distribuirii pool-ului. */
export function CategoryResultTable({ result, names }: { result: AllocationResult; names: Record<string, string> }) {
  const months = result.luni.map((m) => ({ key: monthKey(m), label: LUNI_SCURT[m.luna - 1] }));
  const t = result.totaluri;

  const cols: { label: string; get: (r: CategoryResult) => Decimal; total?: Decimal; bold?: boolean }[] = [
    { label: 'Declarat (kg)', get: (r) => r.declarat, total: t.declarat },
    { label: 'Obligație (kg)', get: (r) => r.obligatie, total: t.obligatie },
    { label: 'Minim propriu (kg)', get: (r) => r.minimPropriu, total: t.minimPropriu },
    ...months.map((m) => ({ label: `Colectat ${m.label} (kg)`, get: (r: CategoryResult) => r.colectatLuna[m.key], total: t.colectatLuna[m.key] })),
    { label: 'Colectat total (kg)', get: (r) => r.colectat, total: t.colectat },
    { label: 'Utilizat din propriu (kg)', get: (r) => r.utilizatPropriu, total: t.utilizatPropriu },
    { label: 'Surplus în pool (kg)', get: (r) => r.surplus, total: t.surplus },
    { label: 'Necesar rămas (kg)', get: (r) => r.necesarRamas, total: t.necesarRamas },
    { label: 'Maxim admis din alte categorii (kg)', get: (r) => r.plafon },
    { label: 'Alocat din pool (kg)', get: (r) => r.alocatPool, total: t.alocatPool },
    { label: 'Total alocat (kg)', get: (r) => r.totalAlocat, total: t.totalAlocat, bold: true },
  ];
  const monthCols = months.map((m) => ({ label: `Alocat ${m.label} (kg)`, key: m.key }));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead>
            <tr className="align-bottom text-xs font-semibold text-gray-800">
              <th className="px-2 py-3 text-left">Cod</th>
              <th className="px-2 py-3 text-left">Categorie</th>
              {cols.map((c) => (
                <th key={c.label} className="w-[84px] px-2 py-3 text-right leading-snug whitespace-normal">
                  {c.label}
                </th>
              ))}
              <th className="w-[84px] px-2 py-3 text-right leading-snug whitespace-normal">% din obligație</th>
              {monthCols.map((c) => (
                <th key={c.key} className="w-[84px] px-2 py-3 text-right leading-snug whitespace-normal">
                  {c.label}
                </th>
              ))}
              <th className="min-w-[260px] px-2 py-3 text-left">Regulă aplicată</th>
            </tr>
          </thead>
          <tbody>
            {result.categorii.map((r) => {
              const under = r.obligatie.greaterThan(0) && r.procentIndeplinire.lessThan(1);
              return (
                <tr key={r.cod} className={`border-t border-gray-100 ${under ? 'bg-amber-50/60' : ''}`}>
                  <td className="px-2 py-3 font-semibold">{r.cod}</td>
                  <td className="max-w-[170px] min-w-[150px] px-2 py-3 leading-snug whitespace-normal">{names[r.cod] ?? r.cod}</td>
                  {cols.map((c) => (
                    <td key={c.label} className={`px-2 py-3 text-right tabular ${c.bold ? 'font-semibold' : ''}`}>
                      {fmtKg(c.get(r))}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-right tabular">{fmtPct(r.procentIndeplinire)}</td>
                  {monthCols.map((c) => (
                    <td key={c.key} className="px-2 py-3 text-right tabular">
                      {fmtKg(r.alocatLuna[c.key])}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-xs text-gray-600">{r.regulaAplicata}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-gray-200 font-semibold">
              <td className="px-2 py-3" />
              <td className="px-2 py-3">TOTAL</td>
              {cols.map((c) => (
                <td key={c.label} className="px-2 py-3 text-right tabular">
                  {c.total ? fmtKg(c.total) : ''}
                </td>
              ))}
              <td className="px-2 py-3 text-right tabular">{fmtPct(t.procentIndeplinire)}</td>
              {monthCols.map((c) => (
                <td key={c.key} className="px-2 py-3 text-right tabular">
                  {fmtKg(t.alocatLuna[c.key])}
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <ReconciliationCards result={result} />
    </div>
  );
}
