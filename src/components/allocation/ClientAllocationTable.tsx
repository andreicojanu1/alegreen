import { Fragment, useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import type { AllocationResult, ClientResult } from '../../engine/types';
import { monthKey } from '../../engine/months';
import type { Client } from '../../data/types';
import type { PlaybackView } from '../../lib/allocationTimeline';
import { LUNI, LUNI_SCURT, fmtKg, fmtPct } from '../../lib/format';
import { Select, TextInput } from '../ui/Field';
import { CategoryChip } from './CategoryChip';
import { MonthProgressCell } from './MonthProgressCell';
import { AnnualProgressBar } from './AnnualProgressBar';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dsum = (xs: Decimal[]) => xs.reduce((a, b) => a.plus(b), new Decimal(0));
const nsum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Tabelul de clienți al unei alocări (M3/M4): toți clienții care au declarat, rând = client × categorie,
 * ordonați descrescător după cantitatea declarată; opțional grupați pe categorii cu subtotaluri.
 * Valorile se derulează live după `view` (animația); la final se afișează valorile exacte, rotunjite conform §7.
 */
export function ClientAllocationTable({
  result,
  clients,
  names,
  view,
}: {
  result: AllocationResult;
  clients: Client[];
  names: Record<string, string>;
  view: PlaybackView;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [month, setMonth] = useState('');
  const [grouped, setGrouped] = useState(false);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const allMonths = result.luni.map((m) => ({ key: monthKey(m), label: LUNI_SCURT[m.luna - 1], long: `${LUNI[m.luna - 1]} ${m.an}` }));
  const months = month ? allMonths.filter((m) => m.key === month) : allMonths;
  const done = view.done;

  // valoare afișată pentru (rând, lună): exactă la final, interpolată în timpul animației
  const cell = (r: ClientResult, k: string): Decimal | number =>
    done ? r.afisare.alocatLuna[k] : view.catMonth(r.categorie, k) * r.cotaCategorie.toNumber();
  const rowTotal = (r: ClientResult): Decimal | number =>
    done ? r.afisare.totalAlocat : nsum(allMonths.map((m) => cell(r, m.key) as number));
  const sumOf = (rows: ClientResult[], f: (r: ClientResult) => Decimal | number) =>
    done ? dsum(rows.map((r) => f(r) as Decimal)) : nsum(rows.map((r) => f(r) as number));

  const matches = (r: ClientResult) => {
    if (cat && r.categorie !== cat) return false;
    if (!q) return true;
    const c = clientById.get(r.clientId);
    return norm(`${c?.denumire ?? ''} ${c?.cui ?? ''}`).includes(norm(q));
  };
  const visible = result.clienti.filter(matches);
  const sorted = [...visible].sort((a, b) => b.declarat.comparedTo(a.declarat));
  const groups = result.categorii
    .map((c) => ({ cat: c, rows: visible.filter((r) => r.categorie === c.cod) }))
    .filter((g) => g.rows.length > 0);

  const th = 'px-3 py-3 text-right whitespace-normal';
  const headerMonthClass = (k: string) => (view.monthState(k) === 'active' ? 'bg-blue-100 text-blue-900' : '');

  const row = (r: ClientResult) => {
    const cl = clientById.get(r.clientId);
    return (
      <tr key={`${r.clientId}-${r.categorie}`} className="border-t border-gray-100">
        <td className="max-w-[170px] min-w-[150px] px-3 py-2.5 leading-snug whitespace-normal">{cl?.denumire}</td>
        <td className="px-3 py-2.5 text-gray-600">{cl?.cui}</td>
        <td className="px-3 py-2.5" title={names[r.categorie]}>
          <CategoryChip cod={r.categorie} size="sm" />
        </td>
        <td className="px-3 py-2.5 text-right tabular">{fmtKg(r.declarat)}</td>
        <td className="px-3 py-2.5 text-right tabular">{fmtKg(r.obligatie)}</td>
        <td className="px-3 py-2.5 text-right tabular">{fmtPct(r.cotaCategorie)}</td>
        <td className="px-3 py-2.5 text-right font-semibold tabular">{fmtKg(rowTotal(r))}</td>
        <td className="px-3 py-2.5">
          <AnnualProgressBar
            obligatie={r.obligatie.toNumber()}
            done={done}
            pctLabel={fmtPct(r.procentIndeplinire)}
            complete={r.procentIndeplinire.greaterThanOrEqualTo('0.999999')}
            segments={allMonths.map((m) => ({
              key: m.key,
              kg: Number(cell(r, m.key).valueOf()),
              active: view.monthState(m.key) === 'active',
            }))}
          />
        </td>
        {months.map((m) => (
          <MonthProgressCell key={m.key} value={cell(r, m.key)} state={view.monthState(m.key)} />
        ))}
      </tr>
    );
  };

  const totalsRow = (label: string, rows: ClientResult[], pct: Decimal | null, className: string) => {
    const obl = dsum(rows.map((r) => r.obligatie));
    const alloc = sumOf(rows, rowTotal);
    return (
      <tr className={className}>
        <td className="px-3 py-2.5" colSpan={3}>
          {label}
        </td>
        <td className="px-3 py-2.5 text-right tabular">{fmtKg(dsum(rows.map((r) => r.declarat)))}</td>
        <td className="px-3 py-2.5 text-right tabular">{fmtKg(obl)}</td>
        <td className="px-3 py-2.5 text-right tabular">{pct ? fmtPct(dsum(rows.map((r) => r.cotaCategorie))) : ''}</td>
        <td className="px-3 py-2.5 text-right tabular">{fmtKg(alloc)}</td>
        <td className="px-3 py-2.5">
          <div className="flex justify-end">
            <span className="w-16 text-right text-xs tabular">
              {done && pct ? fmtPct(pct) : fmtPct(obl.isZero() ? 0 : new Decimal(alloc).div(obl))}
            </span>
          </div>
        </td>
        {months.map((m) => (
          <MonthProgressCell key={m.key} value={sumOf(rows, (r) => cell(r, m.key))} state={view.monthState(m.key)} />
        ))}
      </tr>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <TextInput placeholder="Caută client sau CUI" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-[340px]" aria-label="Categorie">
          <option value="">Toate categoriile</option>
          {result.categorii.map((c) => (
            <option key={c.cod} value={c.cod}>
              {c.cod} – {names[c.cod]}
            </option>
          ))}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" aria-label="Lună">
          <option value="">Toate lunile</option>
          {allMonths.map((m) => (
            <option key={m.key} value={m.key}>
              {m.long}
            </option>
          ))}
        </Select>
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm text-gray-800 select-none">
          <span
            role="switch"
            aria-checked={grouped}
            tabIndex={0}
            onClick={() => setGrouped((g) => !g)}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), setGrouped((g) => !g))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${grouped ? 'bg-ink' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${grouped ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </span>
          Grupează pe categorii
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 align-bottom text-xs font-semibold tracking-wide text-gray-700 uppercase">
              <th className="px-3 py-3 text-left">Client</th>
              <th className="px-3 py-3 text-left">CUI</th>
              <th className="px-3 py-3 text-left">Categorie</th>
              <th className={th}>Declarat (kg)</th>
              <th className={th}>Obligație (kg)</th>
              <th className={th}>Cotă în categorie</th>
              <th className={th}>Total alocat (kg)</th>
              <th className="min-w-[240px] px-3 py-3 text-left whitespace-normal">Îndeplinirea obligației anuale</th>
              {months.map((m) => (
                <th key={m.key} className={`${th} transition-colors ${headerMonthClass(m.key)}`}>
                  Alocat {m.label} (kg)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8 + months.length} className="px-3 py-8 text-center text-gray-500">
                  Niciun client nu corespunde filtrelor.
                </td>
              </tr>
            )}
            {grouped
              ? groups.map(({ cat: c, rows }) => (
                  <Fragment key={c.cod}>
                    {rows.map(row)}
                    {totalsRow(`Subtotal categoria ${c.cod}`, rows, c.procentIndeplinire, 'border-t border-gray-100 bg-gray-50 font-semibold')}
                  </Fragment>
                ))
              : sorted.map(row)}
            {visible.length > 0 &&
              totalsRow(
                'Total general',
                visible,
                null,
                'border-t-2 border-gray-200 font-semibold',
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
