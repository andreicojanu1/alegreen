import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { AllocationRun } from '../../data/types';
import { useStore } from '../../data/store';
import { fmtDateTime, fmtKg } from '../../lib/format';
import { CategoryChip } from './CategoryChip';

/** Jurnalul ajustărilor manuale ale unei rulări (DAT-08): cine, când, ce cantitate, de la / către cine. */
export function AdjustmentLog({ run, erori = [] }: { run: AllocationRun; erori?: { id: string; mesaj: string }[] }) {
  const { state } = useStore();
  const items = run.ajustari ?? [];
  const client = (id: string) => run.snapshot.clienti.find((c) => c.id === id)?.denumire ?? id;
  const admin = (id: string) => state.admins.find((a) => a.id === id)?.nume ?? id;
  if (items.length === 0) return <p className="text-sm text-gray-500">Nicio ajustare manuală. Alocarea este cea calculată automat.</p>;
  return (
    <ol className="divide-y divide-gray-100 rounded-xl border border-gray-100">
      {items.map((a, i) => {
        const err = erori.find((e) => e.id === a.id);
        const out = a.tip === 'retragere';
        return (
          <li key={a.id} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${err ? 'bg-red-50' : ''}`}>
            <span className="w-6 text-xs text-gray-400 tabular">{i + 1}.</span>
            {out ? <ArrowUpRight size={16} className="text-amber-600" /> : <ArrowDownLeft size={16} className="text-green-700" />}
            <CategoryChip cod={a.categorie} size="sm" />
            <span className="flex-1">
              {out ? 'Retras' : 'Atribuit'} <strong className="tabular">{fmtKg(a.kg)} kg</strong> {out ? 'de la' : 'către'} {client(a.clientId)}
              {err && <span className="ml-2 text-xs text-red-700">· {err.mesaj}</span>}
            </span>
            <span className="text-xs text-gray-500">
              {fmtDateTime(a.la)} · {admin(a.autorId)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
