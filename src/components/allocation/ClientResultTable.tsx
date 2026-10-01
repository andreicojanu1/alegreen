import { Fragment, useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import type { AllocationResult, ClientResult } from '../../engine/types';
import { monthKey } from '../../engine/months';
import type { Client } from '../../data/types';
import { LUNI, LUNI_SCURT, fmtKg, fmtPct } from '../../lib/format';
import { Select, TextInput } from '../ui/Field';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sum = (xs: Decimal[]) => xs.reduce((a, b) => a.plus(b), new Decimal(0));

/** „Rezultat pe clienți" (UI-A3): rând = client × categorie, subtotaluri pe categorie, filtre client/CUI, categorie, lună. */
export function ClientResultTable({
  result,
  clients,
  names,
}: {
  result: AllocationResult;
  clients: Client[];
  names: Record<string, string>;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [month, setMonth] = useState('');
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const allMonths = result.luni.map((m) => ({ key: monthKey(m), label: LUNI_SCURT[m.luna - 1], long: `${LUNI[m.luna - 1]} ${m.an}` }));
  const months = month ? allMonths.filter((m) => m.key === month) : allMonths;

  const matches = (r: ClientResult) => {
    if (cat && r.categorie !== cat) return false;
    if (!q) return true;
    const c = clientById.get(r.clientId);
    return norm(`${c?.denumire ?? ''} ${c?.cui ?? ''}`).includes(norm(q));
  };

  const groups = result.categorii
    .map((c) => ({ cat: c, rows: result.clienti.filter((r) => r.categorie === c.cod && matches(r)) }))
    .filter((g) => g.rows.length > 0);
  const visible = groups.flatMap((g) => g.rows);

  const th = 'px-3 py-3 text-right';
  return (
    <div>
      <div className="flex flex-wrap gap-3 px-6 py-4">
        <TextInput placeholder="Caută client sau CUI" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-[366px]" aria-label="Categorie">
          <option value="">Toate categoriile</option>
          {result.categorii.map((c) => (
            <option key={c.cod} value={c.cod}>
              {c.cod} – {names[c.cod]}
            </option>
          ))}
        </Select>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" aria-label="Lună">
          <option value="">Toate lunile</option>
          {allMonths.map((m) => (
            <option key={m.key} value={m.key}>
              {m.long}
            </option>
          ))}
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 align-bottom text-xs font-semibold tracking-wide text-gray-700 uppercase">
              <th className="px-3 py-3 text-left">Client</th>
              <th className="px-3 py-3 text-left">CUI</th>
              <th className="px-3 py-3 text-left">Categorie</th>
              <th className={th}>Declarat (kg)</th>
              <th className={`${th} whitespace-normal`}>Obligație (kg)</th>
              <th className={`${th} whitespace-normal`}>Cotă în categorie</th>
              <th className={`${th} whitespace-normal`}>Total alocat (kg)</th>
              {months.map((m) => (
                <th key={m.key} className={`${th} whitespace-normal`}>
                  Alocat {m.label} (kg)
                </th>
              ))}
              <th className={`${th} whitespace-normal`}>% Îndeplinire</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={8 + months.length} className="px-3 py-8 text-center text-gray-500">
                  Niciun client nu corespunde filtrelor.
                </td>
              </tr>
            )}
            {groups.map(({ cat: c, rows }) => (
              <Fragment key={c.cod}>
                {rows.map((r) => {
                  const cl = clientById.get(r.clientId);
                  return (
                    <tr key={`${r.clientId}-${r.categorie}`} className="border-t border-gray-100">
                      <td className="max-w-[160px] min-w-[140px] px-3 py-2.5 leading-snug whitespace-normal">{cl?.denumire}</td>
                      <td className="px-3 py-2.5 text-gray-600">{cl?.cui}</td>
                      <td className="px-3 py-2.5">{r.categorie}</td>
                      <td className="px-3 py-2.5 text-right tabular">{fmtKg(r.declarat)}</td>
                      <td className="px-3 py-2.5 text-right tabular">{fmtKg(r.obligatie)}</td>
                      <td className="px-3 py-2.5 text-right tabular">{fmtPct(r.cotaCategorie)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular">{fmtKg(r.afisare.totalAlocat)}</td>
                      {months.map((m) => (
                        <td key={m.key} className="px-3 py-2.5 text-right tabular">
                          {fmtKg(r.afisare.alocatLuna[m.key])}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right tabular">{fmtPct(r.procentIndeplinire)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-gray-100 bg-gray-50 font-semibold">
                  <td className="px-3 py-2.5" colSpan={3}>
                    Subtotal categoria {c.cod}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">{fmtKg(sum(rows.map((r) => r.declarat)))}</td>
                  <td className="px-3 py-2.5 text-right tabular">{fmtKg(sum(rows.map((r) => r.obligatie)))}</td>
                  <td className="px-3 py-2.5 text-right tabular">{fmtPct(sum(rows.map((r) => r.cotaCategorie)))}</td>
                  <td className="px-3 py-2.5 text-right tabular">{fmtKg(sum(rows.map((r) => r.afisare.totalAlocat)))}</td>
                  {months.map((m) => (
                    <td key={m.key} className="px-3 py-2.5 text-right tabular">
                      {fmtKg(sum(rows.map((r) => r.afisare.alocatLuna[m.key])))}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right tabular">{fmtPct(c.procentIndeplinire)}</td>
                </tr>
              </Fragment>
            ))}
            {groups.length > 0 && (
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="px-3 py-3" colSpan={3}>
                  Total general
                </td>
                <td className="px-3 py-3 text-right tabular">{fmtKg(sum(visible.map((r) => r.declarat)))}</td>
                <td className="px-3 py-3 text-right tabular">{fmtKg(sum(visible.map((r) => r.obligatie)))}</td>
                <td />
                <td className="px-3 py-3 text-right tabular">{fmtKg(sum(visible.map((r) => r.afisare.totalAlocat)))}</td>
                {months.map((m) => (
                  <td key={m.key} className="px-3 py-3 text-right tabular">
                    {fmtKg(sum(visible.map((r) => r.afisare.alocatLuna[m.key])))}
                  </td>
                ))}
                <td className="px-3 py-3 text-right tabular">
                  {fmtPct(
                    sum(visible.map((r) => r.obligatie)).isZero()
                      ? 0
                      : sum(visible.map((r) => r.totalAlocat)).div(sum(visible.map((r) => r.obligatie))),
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
