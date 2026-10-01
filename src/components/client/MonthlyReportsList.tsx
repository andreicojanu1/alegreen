import { Link } from 'react-router-dom';
import Decimal from 'decimal.js';
import { FileText } from 'lucide-react';
import type { AllocationRun } from '../../data/types';
import { Card, CardHeader } from '../ui/Card';
import { fmtDate, fmtKg } from '../../lib/format';
import { sessionLabel } from '../../lib/runLabels';

const ZERO = new Decimal(0);

/** Rapoartele lunare ale clientului (o linie pe sesiune aprobată), cu acces la Situație EEE, Raport AFM și Raportare EEE. */
export function MonthlyReportsList({ runs, clientId }: { runs: AllocationRun[]; clientId: string }) {
  let cumul = ZERO;
  const rows = [...runs]
    .sort((a, b) => a.luna - b.luna)
    .map((r) => {
      const luna = (r.raportLuna ?? []).filter((e) => e.clientId === clientId).reduce((a, e) => a.plus(e.kg), ZERO);
      cumul = cumul.plus(luna);
      return { r, luna, cumul };
    })
    .reverse();
  return (
    <Card>
      <CardHeader title="Rapoarte lunare" />
      <p className="px-6 pt-4 text-sm text-gray-600">
        Rapoartele lunare obligatorii pentru AFM, generate din alocarea aprobată a fiecărei luni. Lunile raportate nu se mai
        modifică.
      </p>
      <div className="overflow-x-auto px-2 pb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold tracking-wide text-gray-600 uppercase">
              <th className="px-4 py-3">Luna</th>
              <th className="px-4 py-3 text-right">Colectat alocat în lună (kg)</th>
              <th className="px-4 py-3 text-right">Cumulat în an (kg)</th>
              <th className="px-4 py-3">Publicat</th>
              <th className="px-4 py-3">Documente</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, luna, cumul }) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-medium">{sessionLabel(r)}</td>
                <td className={`px-4 py-2.5 text-right tabular ${luna.isZero() ? 'text-gray-400' : ''}`}>{fmtKg(luna)}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular">{fmtKg(cumul)}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.finalizatLa ? fmtDate(r.finalizatLa) : '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['situatie', 'Situație EEE'],
                        ['afm', 'Raport AFM'],
                        ['raportare', 'Raportare EEE'],
                      ] as const
                    ).map(([t, label]) => (
                      <Link
                        key={t}
                        to={`/client/rapoarte/${r.id}/${t}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
                      >
                        <FileText size={13} /> {label}
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
