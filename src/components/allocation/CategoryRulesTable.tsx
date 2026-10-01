import Decimal from 'decimal.js';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { CategoryRule } from '../../data/types';
import { effectiveRules } from '../../data/engineInput';
import { PercentInput } from './PercentInput';

/** Ordonează: active după ordinea pool-ului, apoi inactive. */
export function sortRules(reguli: CategoryRule[]): CategoryRule[] {
  return [...reguli].sort((a, b) => Number(b.activ) - Number(a.activ) || a.ordineAlocare - b.ordineAlocare);
}

/** Renumerotează ordinea pool-ului (10, 20, 30…) după ordinea din listă. */
function renumber(list: CategoryRule[]): CategoryRule[] {
  return list.map((r, i) => ({ ...r, ordineAlocare: (i + 1) * 10 }));
}

/**
 * Tabelul de reguli pe categorii: minim din categoria proprie, maxim din alte categorii, activă, ordinea pool-ului.
 * Categoriile cu prag implicit urmează pragul minim implicit (plafon = 100% − prag) până când sunt editate punctual.
 */
export function CategoryRulesTable({
  reguli,
  pragMinimImplicit,
  onChange,
  readOnly = false,
}: {
  reguli: CategoryRule[];
  pragMinimImplicit: string;
  onChange?: (reguli: CategoryRule[]) => void;
  readOnly?: boolean;
}) {
  const shown = sortRules(effectiveRules(reguli, pragMinimImplicit));
  const active = shown.filter((r) => r.activ);
  const update = (next: CategoryRule[]) => onChange?.(renumber(sortRules(next)));

  const move = (cod: string, dir: -1 | 1) => {
    const list = sortRules(reguli);
    const i = list.findIndex((r) => r.cod === cod);
    const j = i + dir;
    if (j < 0 || j >= active.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    onChange?.(renumber(list));
  };
  const patch = (cod: string, p: Partial<CategoryRule>) =>
    update(reguli.map((r) => (r.cod === cod ? { ...r, ...p } : r)));
  const toggleActive = (cod: string) => {
    const r = reguli.find((x) => x.cod === cod)!;
    // la reactivare categoria intră ultima în ordinea pool-ului
    patch(cod, { activ: !r.activ, ordineAlocare: r.activ ? 9999 : 9998 });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-700 uppercase">
            <th className="w-36 rounded-l-lg px-3 py-3">Ordine pool</th>
            <th className="px-3 py-3">Categorie</th>
            <th className="w-64 px-3 py-3 text-right">Minim din categoria proprie (%)</th>
            <th className="w-64 px-3 py-3 text-right">Maxim din alte categorii (%)</th>
            <th className="w-20 rounded-r-lg px-3 py-3 text-center">Activă</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => {
            const idx = active.findIndex((a) => a.cod === r.cod);
            return (
              <tr key={r.cod} className={`border-b border-gray-100 ${r.activ ? '' : 'bg-gray-50 text-gray-400'}`}>
                <td className="px-3 py-2">
                  {r.activ && (
                    <div className="flex items-center gap-3">
                      <span className="w-4 tabular">{idx + 1}</span>
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            aria-label={`Mută categoria ${r.cod} mai sus`}
                            disabled={idx === 0}
                            onClick={() => move(r.cod, -1)}
                            className="text-gray-700 disabled:text-gray-300"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Mută categoria ${r.cod} mai jos`}
                            disabled={idx === active.length - 1}
                            onClick={() => move(r.cod, 1)}
                            className="text-gray-700 disabled:text-gray-300"
                          >
                            <ArrowDown size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className={`mr-2 font-semibold ${r.activ ? 'text-gray-900' : ''}`}>{r.cod}</span>
                  <span className={r.activ ? 'text-gray-800' : ''}>{r.denumire}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  {readOnly ? (
                    <span className="tabular">{new Decimal(r.pragMinimPropriu).times(100).toString().replace('.', ',')}</span>
                  ) : (
                    <PercentInput
                      ariaLabel={`Minim din categoria proprie, categoria ${r.cod}`}
                      value={r.pragMinimPropriu}
                      disabled={!r.activ}
                      onChange={(v) => patch(r.cod, { pragMinimPropriu: v, plafonSubstitutie: r.plafonSubstitutie, folosestePragImplicit: false })}
                      className="w-24"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {readOnly ? (
                    <span className="tabular">{new Decimal(r.plafonSubstitutie).times(100).toString().replace('.', ',')}</span>
                  ) : (
                    <PercentInput
                      ariaLabel={`Maxim din alte categorii, categoria ${r.cod}`}
                      value={r.plafonSubstitutie}
                      disabled={!r.activ}
                      onChange={(v) => patch(r.cod, { plafonSubstitutie: v, pragMinimPropriu: r.pragMinimPropriu, folosestePragImplicit: false })}
                      className="w-24"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {readOnly ? (
                    r.activ ? 'Da' : 'Nu'
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleActive(r.cod)}
                      title={r.activ ? 'Dezactivează categoria' : 'Activează categoria'}
                      className="rounded px-2 py-1 hover:bg-gray-100"
                    >
                      {r.activ ? 'Da' : 'Nu'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
