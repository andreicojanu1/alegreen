import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { RunStatusBadge } from './RunStatusBadge';
import { useStore } from '../../data/store';
import { runResult } from '../../data/useRunResult';
import { fmtDateTime, fmtKg, fmtPct } from '../../lib/format';
import { periodLabel, rateLabel } from '../../lib/runLabels';

export function RunHistoryTable() {
  const { state } = useStore();
  const runs = [...state.runs].sort((a, b) => b.creatLa.localeCompare(a.creatLa));
  const adminName = (id: string) => state.admins.find((a) => a.id === id)?.nume ?? id;

  return (
    <Card>
      <CardHeader title="Istoric rulări" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold tracking-wide text-gray-700 uppercase">
              <th className="px-4 py-3">An</th>
              <th className="px-4 py-3">Perioadă colectare</th>
              <th className="px-4 py-3 text-right">Rată</th>
              <th className="px-4 py-3 text-right">Obligație (kg)</th>
              <th className="px-4 py-3 text-right">Alocat (kg)</th>
              <th className="px-4 py-3 text-right">% Îndeplinire</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Calculată</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Nu există încă nicio rulare.
                </td>
              </tr>
            )}
            {runs.map((r) => {
              const res = runResult(r);
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold">{r.anObligatie}</td>
                  <td className="px-4 py-3">{periodLabel(r)}</td>
                  <td className="px-4 py-3 text-right tabular">{rateLabel(r.rataEfectiva)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtKg(res.totaluri.obligatie)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtKg(res.totaluri.totalAlocat)}</td>
                  <td className="px-4 py-3 text-right tabular">{fmtPct(res.totaluri.procentIndeplinire)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RunStatusBadge status={r.status} />
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
    </Card>
  );
}
