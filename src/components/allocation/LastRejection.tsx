import { XCircle } from 'lucide-react';
import type { AllocationRun } from '../../data/types';
import { useStore } from '../../data/store';
import { fmtDateTime } from '../../lib/format';

/** Ultima respingere a rulării (dacă există și rularea e din nou în draft). */
export function LastRejection({ run }: { run: AllocationRun }) {
  const { state } = useStore();
  const last = run.respingeri?.[run.respingeri.length - 1];
  if (!last || run.status !== 'draft') return null;
  const who = state.admins.find((a) => a.id === last.deAdminId)?.nume ?? last.deAdminId;
  return (
    <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
      <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
      <div>
        <div className="font-semibold">
          Respinsă de {who} la {fmtDateTime(last.la)}
          {run.respingeri!.length > 1 && <span className="font-normal"> · a {run.respingeri!.length}-a respingere</span>}
        </div>
        <div className="mt-0.5">Motiv: {last.motiv}</div>
      </div>
    </div>
  );
}
