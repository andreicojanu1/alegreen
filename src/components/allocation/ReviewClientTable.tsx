import { Fragment, useState } from 'react';
import Decimal from 'decimal.js';

import type { MonthlyClientInfo, MonthlyResult } from '../../engine/monthly';
import type { ClientResult } from '../../engine/types';
import type { Client } from '../../data/types';
import { LUNI_SCURT, fmtKg, fmtNum, fmtPct, parseRoDecimal } from '../../lib/format';
import { monthKey } from '../../engine/months';
import { CategoryChip } from './CategoryChip';
import { AnnualProgressBar } from './AnnualProgressBar';
import { TextInput } from '../ui/Field';

export type AdjustmentRequest = { tip: 'retragere' | 'atribuire'; clientId: string; categorie: string; kg: string };

/**
 * Tabelul de revizuire: clienți grupați pe categorii, cu „Alocat final" editabil.
 * Scăderea valorii retrage diferența în disponibilul de realocat al categoriei; creșterea o ia din disponibil,
 * fără a depăși obligația clientului. Lunile urmează proporțional sursa (engine/adjustments.ts).
 */
export function ReviewClientTable({
  res,
  clients,
  names,
  readOnly,
  onAdjust,
}: {
  res: MonthlyResult;
  clients: Client[];
  names: Record<string, string>;
  readOnly: boolean;
  onAdjust: (r: AdjustmentRequest) => void;
}) {
  const months = res.luni.map((m) => ({ key: monthKey(m), label: LUNI_SCURT[m.luna - 1] }));
  const lunaLabel = LUNI_SCURT[Number(res.lunaCurenta.slice(5)) - 1];
  const prevLabel = res.luni.length > 1 ? `ian–${LUNI_SCURT[res.luni.length - 2].toLowerCase()}` : '—';
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const groups = res.categorii
    .map((c) => ({ cat: c, rows: res.clienti.filter((r) => r.categorie === c.cod).sort((a, b) => b.declarat.comparedTo(a.declarat)) }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50 align-bottom text-xs font-semibold tracking-wide text-gray-700 uppercase">
            <th className="px-3 py-3 text-left">Client</th>
            <th className="px-3 py-3 text-left">CUI</th>
            <th className="px-3 py-3 text-right whitespace-normal">Declarat (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">Obligație (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">Raportat {prevLabel} (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">{lunaLabel} calculat automat (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">Ajustare (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">{lunaLabel} final (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">Cumulat (kg)</th>
            <th className="px-3 py-3 text-right whitespace-normal">Capacitate rămasă (kg)</th>
            <th className="min-w-[230px] px-3 py-3 text-left whitespace-normal">Îndeplinirea obligației anuale</th>
            {months.map((m) => (
              <th key={m.key} className="px-3 py-3 text-right whitespace-normal">
                Alocat {m.label} (kg)
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(({ cat, rows }) => {
            const buf = res.disponibilRealocat[cat.cod];
            return (
              <Fragment key={cat.cod}>
                <tr className="border-t-2 border-gray-200 bg-gray-50/70">
                  <td colSpan={11 + months.length} className="px-3 py-2">
                    <span className="inline-flex items-center gap-3">
                      <CategoryChip cod={cat.cod} size="sm" />
                      <span className="font-medium text-gray-800">{names[cat.cod]}</span>
                      <span className="text-xs text-gray-500">
                        alocat categoriei {fmtKg(cat.totalAlocat)} kg · {fmtPct(cat.procentIndeplinire)} din obligație
                      </span>
                      {buf.total.greaterThanOrEqualTo('0.005') && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          {fmtKg(buf.total)} kg de realocat
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
                {rows.map((r) => (
                  <ReviewRow
                    key={r.clientId}
                    r={r}
                    info={res.lunar[`${r.clientId}|${r.categorie}`]}
                    client={clientById.get(r.clientId)}
                    buffer={buf.total}
                    months={months}
                    readOnly={readOnly}
                    onAdjust={onAdjust}
                  />
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReviewRow({
  r,
  info,
  client,
  buffer,
  months,
  readOnly,
  onAdjust,
}: {
  r: ClientResult;
  info: MonthlyClientInfo;
  client?: Client;
  buffer: Decimal;
  months: { key: string; label: string }[];
  readOnly: boolean;
  onAdjust: (a: AdjustmentRequest) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ajustarea din sesiunea curentă (pe cumulat = pe luna curentă, lunile anterioare fiind înghețate)
  const delta = r.totalInitial !== undefined ? r.totalAlocat.minus(r.totalInitial) : new Decimal(0);
  const shown = info.lunaCurenta;
  const initialMonth = Decimal.max(0, shown.minus(delta));
  const capacity = Decimal.max(r.obligatie.minus(r.totalAlocat), 0);
  const canTake = Decimal.min(buffer, capacity);
  const adjusted = r.totalInitial !== undefined;

  const commit = (raw: string) => {
    setText(null);
    const parsed = raw.trim() === '' ? null : parseRoDecimal(raw);
    if (parsed === null) return setError(raw.trim() === '' ? null : 'Valoare invalidă.');
    const target = new Decimal(parsed);
    if (target.isNegative()) return setError('Valoarea nu poate fi negativă.');
    if (target.decimalPlaces() > 2) return setError('Maximum 2 zecimale.');
    if (target.equals(shown)) return setError(null);
    if (target.lessThan(shown)) {
      // retragere doar din luna curentă (lunile raportate sunt înghețate)
      const kg = Decimal.min(shown.minus(target), r.totalAlocat);
      setError(null);
      onAdjust({ tip: 'retragere', clientId: r.clientId, categorie: r.categorie, kg: kg.toString() });
    } else {
      const want = target.minus(shown);
      if (want.greaterThan(buffer.plus('0.005'))) return setError(`Disponibil de realocat în categorie: doar ${fmtKg(buffer)} kg.`);
      if (want.greaterThan(capacity.plus('0.005'))) return setError(`Depășește obligația clientului (capacitate rămasă ${fmtKg(capacity)} kg).`);
      setError(null);
      onAdjust({ tip: 'atribuire', clientId: r.clientId, categorie: r.categorie, kg: Decimal.min(want, canTake).toString() });
    }
  };

  return (
    <tr className={`border-t border-gray-100 align-top ${adjusted ? 'bg-blue-50/40' : ''}`}>
      <td className="max-w-[190px] min-w-[160px] px-3 py-2.5 leading-snug whitespace-normal">
        {client?.denumire}
        {adjusted && <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-800">ajustat manual</span>}
      </td>
      <td className="px-3 py-2.5 text-gray-600">{client?.cui}</td>
      <td className="px-3 py-2.5 text-right tabular">{fmtKg(r.declarat)}</td>
      <td className="px-3 py-2.5 text-right tabular">{fmtKg(r.obligatie)}</td>
      <td className="px-3 py-2.5 text-right text-gray-500 tabular">{fmtKg(info.raportatAnterior)}</td>
      <td className="px-3 py-2.5 text-right text-gray-600 tabular">{fmtKg(initialMonth)}</td>
      <td className={`px-3 py-2.5 text-right font-medium tabular ${delta.isZero() ? 'text-gray-300' : delta.isNegative() ? 'text-amber-700' : 'text-green-700'}`}>
        {delta.isZero() ? '—' : `${delta.isPositive() ? '+' : ''}${fmtKg(delta)}`}
      </td>
      <td className="px-3 py-1.5 text-right">
        {readOnly ? (
          <span className="font-semibold tabular">{fmtKg(shown)}</span>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <TextInput
                aria-label={`Luna final ${client?.denumire} categoria ${r.categorie}`}
                inputMode="decimal"
                value={text ?? fmtNum(shown, 2)}
                onChange={(e) => setText(e.target.value)}
                onBlur={(e) => text !== null && commit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className={`h-8 w-36 text-right font-semibold tabular ${error ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                title={canTake.greaterThan(0) ? `Ia din disponibil ${fmtKg(canTake)} kg` : 'Nimic de luat din disponibil'}
                disabled={canTake.lessThan('0.005')}
                onClick={() => onAdjust({ tip: 'atribuire', clientId: r.clientId, categorie: r.categorie, kg: canTake.toString() })}
                className="h-8 rounded-md border border-gray-300 px-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
              >
                Max
              </button>
            </div>
            {info.negativ && <span className="max-w-[220px] text-right text-xs whitespace-normal text-red-600">A-06: cumulat sub raportat ({fmtKg(info.cumulatCalculat)} kg)</span>}
            {error && <span className="max-w-[220px] text-right text-xs whitespace-normal text-red-600">{error}</span>}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 text-right font-medium tabular">{fmtKg(r.afisare.totalAlocat)}</td>
      <td className="px-3 py-2.5 text-right text-gray-600 tabular">{fmtKg(capacity)}</td>
      <td className="px-3 py-2.5">
        <AnnualProgressBar
          obligatie={r.obligatie.toNumber()}
          done
          pctLabel={fmtPct(r.procentIndeplinire)}
          complete={r.procentIndeplinire.greaterThanOrEqualTo('0.999999')}
          segments={months.map((m) => ({ key: m.key, kg: r.afisare.alocatLuna[m.key].toNumber(), active: false }))}
        />
      </td>
      {months.map((m) => (
        <td key={m.key} className={`px-3 py-2.5 text-right tabular ${r.afisare.alocatLuna[m.key].isZero() ? 'text-gray-300' : ''}`}>
          {r.afisare.alocatLuna[m.key].isZero() ? '—' : fmtKg(r.afisare.alocatLuna[m.key])}
        </td>
      ))}
    </tr>
  );
}

