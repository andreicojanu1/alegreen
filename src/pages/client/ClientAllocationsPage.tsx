import { Fragment, useMemo, useState } from 'react';
import Decimal from 'decimal.js';
import { ChevronDown, ChevronRight, Download, Info } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../data/store';
import { runResult } from '../../data/useRunResult';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
import { ProgressBar } from '../../components/client/ProgressBar';
import { monthKey } from '../../engine/months';
import { LUNI, fmtDate, fmtKg, fmtPct } from '../../lib/format';
import { periodLabel } from '../../lib/runLabels';
import { IS_ARTIFACT } from '../../lib/env';

const ZERO = new Decimal(0);
const sum = (xs: Decimal[]) => xs.reduce((a, b) => a.plus(b), ZERO);
const FOOTNOTE =
  'Defalcarea pe luni a cantităților provenite din realocare între categorii este o repartizare proporțională, nu o trasabilitate fizică a transporturilor.';

/**
 * Ecranul clientului „Alocări EEE" (brief §9.1). Clientul vede EXCLUSIV ultima rulare finalizată și doar liniile proprii
 * (UI-C2 — în platforma reală, filtrarea se face pe server).
 */
export function ClientAllocationsPage() {
  const { state } = useStore();
  const clientId = state.role.tip === 'client' ? state.role.clientId : '';
  const client = state.clients.find((c) => c.id === clientId);

  const finalRuns = state.runs.filter((r) => r.status === 'finalizata');
  const years = [...new Set([2026, ...finalRuns.map((r) => r.anObligatie)])].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const run = finalRuns.find((r) => r.anObligatie === year);
  const data = useMemo(() => {
    if (!run) return null;
    const res = runResult(run);
    const rows = res.clienti.filter((c) => c.clientId === clientId);
    const months = res.luni.map((m) => ({ key: monthKey(m), label: `${LUNI[m.luna - 1]} ${m.an}`, short: LUNI[m.luna - 1].slice(0, 3) }));
    const declarat = sum(rows.map((r) => r.declarat));
    const obligatie = sum(rows.map((r) => r.obligatie));
    const alocat = sum(rows.map((r) => r.afisare.totalAlocat));
    let cumul = ZERO;
    const monthly = months.map((m) => {
      const v = sum(rows.map((r) => r.afisare.alocatLuna[m.key]));
      cumul = cumul.plus(v);
      return { ...m, alocat: v, cumulat: cumul, pct: obligatie.isZero() ? ZERO : cumul.div(obligatie) };
    });
    return { res, rows, months, declarat, obligatie, alocat, monthly, pct: obligatie.isZero() ? ZERO : alocat.div(obligatie) };
  }, [run, clientId]);
  const names = Object.fromEntries((run?.reguli ?? []).map((r) => [r.cod, r.denumire]));

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alocări EEE</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cât din obligația de colectare a {client?.denumire ?? 'companiei'} a fost acoperită, cu ce și în ce luni.
        </p>
      </div>
      {state.clientVisibility && (
        <div className="no-print flex items-center gap-2">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="An de obligație">
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
          {data && data.rows.length > 0 && !IS_ARTIFACT && (
            <Button icon={<Download size={16} />} onClick={() => window.print()}>
              Situație alocare DEEE
            </Button>
          )}
        </div>
      )}
    </header>
  );

  // Vizibilitatea modulului oprită: clientul vede placeholder-ul actual al platformei.
  if (!state.clientVisibility) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-5">
        {header}
        <Card className="px-6 py-16 text-center text-gray-600">Alocările EEE vor începe din luna Ianuarie 2026</Card>
      </div>
    );
  }
  if (!run || !data) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-5">
        {header}
        <Card className="px-6 py-16 text-center text-gray-600">Alocarea pentru {year} nu a fost încă publicată.</Card>
      </div>
    );
  }
  if (data.rows.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-5">
        {header}
        <Card className="px-6 py-16 text-center text-gray-600">
          Nu aveți cantități declarate în baza de calcul a alocării pentru {year}, deci nu există obligație de acoperit.
        </Card>
      </div>
    );
  }

  const chartData = data.monthly.map((m) => ({
    luna: m.short,
    alocat: Number(m.alocat.toFixed(2)),
    pct: Number(m.pct.times(100).toFixed(2)),
  }));

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      {header}

      {/* Card de sumar */}
      <Card className="px-6 py-5">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          <Stat label="An de obligație" value={String(year)} hint={`Colectare ${periodLabel(run)}`} />
          <Stat label="Total declarat" value={`${fmtKg(data.declarat)} kg`} hint="Baza de calcul a obligației" />
          <Stat label="Obligație anuală totală" value={`${fmtKg(data.obligatie)} kg`} hint={`${fmtPct(run.rataEfectiva)} din declarat`} />
          <Stat label="Total alocat" value={`${fmtKg(data.alocat)} kg`} hint={`Publicată ${fmtDate(run.finalizatLa!)}`} />
          <div>
            <div className="text-xs text-gray-600">Îndeplinire globală</div>
            <div className="mt-1 text-xl font-bold tabular">{fmtPct(data.pct)}</div>
            <ProgressBar ratio={data.pct} className="mt-2" />
          </div>
        </div>
      </Card>

      {/* Evoluția cumulată pe luni (inspirată din logica cumulativă din captura 06) */}
      <Card>
        <CardHeader title="Evoluția alocării în anul de obligație" />
        <div className="grid grid-cols-1 gap-6 px-6 py-5 lg:grid-cols-[1fr_380px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  <th className="px-3 py-3">Luna colectării</th>
                  <th className="px-3 py-3 text-right">Alocat în lună (kg)</th>
                  <th className="px-3 py-3 text-right">Alocat cumulat (kg)</th>
                  <th className="w-56 px-3 py-3">Cumulat din obligația anuală</th>
                  <th className="px-3 py-3 text-right">Rămas de acoperit (kg)</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((m) => {
                  const empty = m.alocat.isZero();
                  return (
                    <tr key={m.key} className="border-t border-gray-100">
                      <td className="px-3 py-2.5">{m.label}</td>
                      <td className={`px-3 py-2.5 text-right tabular ${empty ? 'text-gray-400' : ''}`}>{empty ? '—' : fmtKg(m.alocat)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular">{fmtKg(m.cumulat)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar ratio={m.pct} className="flex-1" />
                          <span className="w-16 text-right text-xs tabular">{fmtPct(m.pct)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular text-gray-700">{fmtKg(Decimal.max(data.obligatie.minus(m.cumulat), 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="h-64">
            <div className="mb-1 flex gap-4 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-300" /> Alocat în lună</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-gray-900" /> Cumulat din obligație</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="luna" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="kg" hide />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  formatter={(v, n) => (n === 'pct' ? [`${String(v).replace('.', ',')}%`, 'Cumulat din obligație'] : [`${fmtKg(Number(v))} kg`, 'Alocat în lună'])}
                />
                <ReferenceLine yAxisId="pct" y={100} stroke="#16a34a" strokeDasharray="4 4" />
                <Bar yAxisId="kg" dataKey="alocat" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Line yAxisId="pct" dataKey="pct" stroke="#111827" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Tabel pe categorii, cu extindere pe luni */}
      <Card>
        <CardHeader title="Alocarea pe categorii" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-700 uppercase">
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3 text-right">Declarat (kg)</th>
                <th className="px-4 py-3 text-right">Obligație (kg)</th>
                <th className="px-4 py-3 text-right">Alocat (kg)</th>
                <th className="w-64 px-4 py-3">% îndeplinire</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => {
                const isOpen = !!open[r.categorie];
                return (
                  <Fragment key={r.categorie}>
                    <tr
                      className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                      onClick={() => setOpen((o) => ({ ...o, [r.categorie]: !o[r.categorie] }))}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          <span className="font-semibold">{r.categorie}</span> {names[r.categorie]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular">{fmtKg(r.declarat)}</td>
                      <td className="px-4 py-3 text-right tabular">{fmtKg(r.obligatie)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular">{fmtKg(r.afisare.totalAlocat)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar ratio={r.procentIndeplinire} className="flex-1" />
                          <span className="w-16 text-right text-xs tabular">{fmtPct(r.procentIndeplinire)}</span>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50/70">
                        <td colSpan={5} className="px-12 py-3">
                          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
                            {data.months.map((m) => (
                              <div key={m.key}>
                                <div className="text-gray-500">{m.label}</div>
                                <div className="font-semibold tabular">
                                  {r.afisare.alocatLuna[m.key].isZero() ? '—' : `${fmtKg(r.afisare.alocatLuna[m.key])} kg`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="flex gap-2 border-t border-gray-100 px-6 py-4 text-xs text-gray-600">
          <Info size={14} className="mt-0.5 shrink-0" />
          {FOOTNOTE}
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="mt-1 text-xl font-bold tabular">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}
