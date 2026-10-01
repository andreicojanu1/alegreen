import type React from 'react';
import { Link } from 'react-router-dom';
import Decimal from 'decimal.js';
import { Eye } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { RunStatusBadge } from './RunStatusBadge';
import { SessionCode } from './SessionCode';
import { useStore } from '../../data/store';
import { runResult } from '../../data/useRunResult';
import { fmtDateTime, fmtKg, fmtPct } from '../../lib/format';
import { rateLabel, sessionLabel } from '../../lib/runLabels';

/** Istoricul sesiunilor de alocare; `embedded` = în tab-ul „Istoric rulări”, fără card propriu. */
export function RunHistoryTable({ embedded = false }: { embedded?: boolean }) {
  const { state } = useStore();
  const runs = [...state.runs].sort((a, b) => b.anObligatie - a.anObligatie || b.luna - a.luna || b.creatLa.localeCompare(a.creatLa));
  const adminName = (id: string) => state.admins.find((a) => a.id === id)?.nume ?? id;

  return (
    <Wrapper embedded={embedded}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-700 uppercase">
              <th className="px-4 py-3">ID sesiune</th>
              <th className="px-4 py-3">Luna alocată</th>
              <th className="px-4 py-3 text-right">Rată</th>
              <th className="px-4 py-3 text-right">Obligație (kg)</th>
              <th className="px-4 py-3 text-right">Alocat în lună (kg)</th>
              <th className="px-4 py-3 text-right">Cumulat (kg)</th>
              <th className="px-4 py-3 text-right">% cumulat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Calculată</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  Nu există încă nicio rulare.
                </td>
              </tr>
            )}
            {runs.map((r) => {
              const res = runResult(r);
              const cum = res.clienti.reduce((a, c) => a.plus(c.afisare.totalAlocat), new Decimal(0));
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <SessionCode code={r.codSesiune} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-medium">{sessionLabel(r)}</td>
                  <td className="px-4 py-3 text-right tabular">{rateLabel(r.rataEfectiva)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtKg(res.totaluri.obligatie)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular">{fmtKg(res.totalLuna)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtKg(cum)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtPct(res.totaluri.obligatie.isZero() ? 0 : cum.div(res.totaluri.obligatie))}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RunStatusBadge status={r.status} />
                    {r.status === 'draft' && (r.respingeri?.length ?? 0) > 0 && (
                      <Link to={`/admin/alocari/${r.id}/revizuire`} className="ml-2 text-xs text-red-700 hover:underline">
                        respinsă · de revizuit
                      </Link>
                    )}
                    {r.status === 'in_aprobare' && (
                      <Link to={`/admin/alocari/${r.id}`} className="ml-2 text-xs text-blue-700 hover:underline">
                        așteaptă aprobarea
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-600">
                    {fmtDateTime(r.creatLa)} · {adminName(r.creatDe)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/alocari/${r.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-900 hover:underline">
                      <Eye size={15} /> Deschide
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Wrapper>
  );
}

function Wrapper({ embedded, children }: { embedded: boolean; children: React.ReactNode }) {
  if (embedded) return <div className="py-2">{children}</div>;
  return (
    <Card>
      <CardHeader title="Istoric rulări" />
      {children}
    </Card>
  );
}
