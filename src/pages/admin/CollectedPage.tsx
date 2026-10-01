import { useState } from 'react';
import Decimal from 'decimal.js';
import { TriangleAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { useActions, useStore } from '../../data/store';
import { LUNI_SCURT, fmtKg, fmtNum, parseRoDecimal } from '../../lib/format';
import { byDisplayOrder } from '../../data/categories';

/**
 * UI-A1 · Cantități colectate (simplificat pentru prototip): grilă categorii × luni, editabilă, cu totaluri live.
 * Nu conține jurnalul de audit, observațiile pe celulă și importul CSV din brief.
 */
export function CollectedPage() {
  const { state } = useStore();
  const { setCollected } = useActions();
  const [an, setAn] = useState(2026);
  const cats = [...state.rules.reguli].sort((a, b) => byDisplayOrder(a.cod, b.cod));
  const get = (cod: string, luna: number) =>
    new Decimal(state.collected.find((c) => c.an === an && c.luna === luna && c.categorie === cod)?.cantitateKg ?? 0);

  const lastFinal = state.runs.find((r) => r.anObligatie === an && r.status === 'finalizata');
  const key = (rows: { an: number; luna: number; categorie: string; cantitateKg: string }[]) =>
    rows
      .filter((c) => c.an === an && !new Decimal(c.cantitateKg).isZero())
      .map((c) => `${c.luna}-${c.categorie}-${new Decimal(c.cantitateKg).toString()}`)
      .sort()
      .join('|');
  const changed = lastFinal && key(lastFinal.snapshot.colectari) !== key(state.collected);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Cantități colectate</h1>
        <p className="mt-1 text-sm text-gray-600">Cantitățile de DEEE colectate efectiv, pe categorie și lună (kg). Nu sunt vizibile clienților.</p>
      </header>
      <div className="flex items-center gap-3">
        <Select value={an} onChange={(e) => setAn(Number(e.target.value))} className="w-28" aria-label="An">
          {[2025, 2026, 2027].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </Select>
        {changed && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <TriangleAlert size={16} className="text-amber-600" />
            Există modificări neincluse în alocarea curentă. Rulați o alocare nouă.
          </span>
        )}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold tracking-wide text-gray-700 uppercase">
              <th className="px-3 py-3 text-left">Categorie</th>
              {LUNI_SCURT.map((l) => (
                <th key={l} className="px-2 py-3 text-right">
                  {l}
                </th>
              ))}
              <th className="px-3 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.cod} className={`border-t border-gray-100 ${c.activ ? '' : 'text-gray-400'}`}>
                <td className="px-3 py-2">
                  <span className="mr-2 font-semibold">{c.cod}</span>
                  {c.denumire}
                </td>
                {LUNI_SCURT.map((_, i) => (
                  <td key={i} className="px-1 py-1.5">
                    <CellInput value={get(c.cod, i + 1)} onCommit={(v) => setCollected(an, i + 1, c.cod, v)} />
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-semibold tabular">
                  {fmtKg(LUNI_SCURT.reduce((a, _, i) => a.plus(get(c.cod, i + 1)), new Decimal(0)))}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 font-semibold">
              <td className="px-3 py-2">Total pe lună</td>
              {LUNI_SCURT.map((_, i) => (
                <td key={i} className="px-2 py-2 text-right tabular">
                  {fmtKg(cats.reduce((a, c) => a.plus(get(c.cod, i + 1)), new Decimal(0)))}
                </td>
              ))}
              <td className="px-3 py-2 text-right tabular">
                {fmtKg(cats.reduce((a, c) => a.plus(LUNI_SCURT.reduce((b, _, i) => b.plus(get(c.cod, i + 1)), new Decimal(0))), new Decimal(0)))}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/** Celulă editabilă: valori ≥ 0, maximum 2 zecimale (UI-A1); se salvează la blur. */
function CellInput({ value, onCommit }: { value: Decimal; onCommit: (v: string) => void }) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (value.isZero() ? '' : fmtNum(value, 2));
  const parsed = text === null ? null : text.trim() === '' ? '0' : parseRoDecimal(text);
  const invalid = text !== null && (parsed === null || new Decimal(parsed).lessThan(0) || new Decimal(parsed).decimalPlaces() > 2);
  return (
    <input
      inputMode="decimal"
      value={shown}
      placeholder="0"
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== null && !invalid && parsed !== null) onCommit(parsed);
        setText(null);
      }}
      className={`h-8 w-[104px] rounded border px-2 text-right text-sm tabular focus:outline-none ${
        invalid ? 'border-red-400' : 'border-transparent hover:border-gray-300 focus:border-gray-400'
      }`}
    />
  );
}
