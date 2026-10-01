import type Decimal from 'decimal.js';
import type { AllocationResult } from '../../engine/types';
import { fmtKg } from '../../lib/format';

/** Cele trei verificări de reconciliere de sub tabelul pe categorii (rândurile 18–20 din foaia Excel). */
export function ReconciliationCards({ result }: { result: AllocationResult }) {
  const ok = (d: Decimal) => d.abs().lessThan('0.01');
  const items = [
    {
      label: 'Total alocat vs. colectat disponibil',
      value: result.reconciliere.alocatMinusColectat,
      okText: 'OK – Tot colectatul este alocat',
      koText: 'Diferență = colectat rămas nealocat',
    },
    {
      label: 'Colectat rămas nealocat (pool neutilizat)',
      value: result.reconciliere.poolNeutilizat,
      okText: 'OK – Pool-ul a fost distribuit integral',
      koText: 'Au rămas cantități în pool (vezi A-03)',
    },
    {
      label: 'Suma lunilor = total alocat',
      value: result.reconciliere.luniMinusTotal,
      okText: 'OK – Defalcarea lunară este completă',
      koText: 'Defalcarea lunară nu se închide',
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
      {items.map((it) => {
        const good = ok(it.value);
        return (
          <div
            key={it.label}
            className={`rounded-xl border px-4 py-3 ${good ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}
          >
            <div className="text-xs text-gray-700">{it.label}</div>
            <div className="mt-1 text-base font-semibold text-gray-900 tabular">{fmtKg(it.value)} kg</div>
            <div className={`mt-1 text-xs ${good ? 'text-green-700' : 'text-amber-800'}`}>{good ? it.okText : it.koText}</div>
          </div>
        );
      })}
    </div>
  );
}
