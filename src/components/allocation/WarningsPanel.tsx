import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import type { AllocationWarning, InvariantCheck } from '../../engine/types';
import { fmtNum } from '../../lib/format';

/** Avertizările A-01…A-05 (stânga) și invarianții I-1…I-6 (dreapta). */
export function WarningsPanel({ warnings, invariants }: { warnings: AllocationWarning[]; invariants: InvariantCheck[] }) {
  return (
    <Card>
      <CardHeader title="Avertizări și verificări" />
      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Avertizări</h3>
          {warnings.length === 0 ? (
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Nu există avertizări.</p>
          ) : (
            <ul className="space-y-2">
              {warnings.map((w, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    <strong className="font-semibold">{w.cod}</strong> · {w.mesaj}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Invarianți (condiție de finalizare)</h3>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {invariants.map((inv) => (
              <li key={inv.cod} className="flex items-center gap-3 px-4 py-2.5 text-sm" title={`Toleranță: ${inv.toleranta}`}>
                {inv.trecut ? (
                  <CheckCircle2 size={17} className="shrink-0 text-green-600" />
                ) : (
                  <XCircle size={17} className="shrink-0 text-red-600" />
                )}
                <span className="w-9 font-semibold">{inv.cod}</span>
                <span className="flex-1 text-gray-800">{inv.descriere}</span>
                <span className={`text-xs tabular ${inv.trecut ? 'text-teal-600' : 'font-semibold text-red-600'}`}>
                  {inv.valoare.abs().lessThan('0.0000005') ? '0' : fmtNum(inv.valoare, inv.cod === 'I-6' ? 6 : 2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
