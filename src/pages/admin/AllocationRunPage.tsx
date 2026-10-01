import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useStore } from '../../data/store';
import { runResult } from '../../data/useRunResult';
import { Button } from '../../components/ui/Button';
import { SessionCode } from '../../components/allocation/SessionCode';
import { RunWorkspace } from '../../components/allocation/RunWorkspace';
import { Card } from '../../components/ui/Card';
import { RunStatusBadge } from '../../components/allocation/RunStatusBadge';
import { fmtDateLong } from '../../lib/format';
import { baseLabel, cumulLabel, rateLabel, sessionLabel } from '../../lib/runLabels';
import { exportRunExcel } from '../../lib/exportRun';
import { IS_ARTIFACT } from '../../lib/env';

export function AllocationRunPage() {
  const { runId } = useParams();
  const { state } = useStore();
  const run = state.runs.find((r) => r.id === runId);

  if (!run) {
    return (
      <div className="space-y-4">
        <Link to="/admin/alocari" className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
          <ArrowLeft size={15} /> Înapoi la Alocări DEEE
        </Link>
        <Card className="px-6 py-10 text-center text-gray-600">Rularea nu există sau a fost ștearsă.</Card>
      </div>
    );
  }

  const res = runResult(run);
  const names = Object.fromEntries(run.reguli.map((r) => [r.cod, r.denumire]));
  const creator = state.admins.find((a) => a.id === run.creatDe)?.nume ?? run.creatDe;

  return (
    <div className="space-y-5">
      <Link to="/admin/alocari" className="no-print inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
        <ArrowLeft size={15} /> Înapoi la Alocări DEEE
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Alocare {sessionLabel(run)}</h1>
            <SessionCode code={run.codSesiune} />
            <RunStatusBadge status={run.status} />
          </div>
          <p className="mt-1 text-sm text-gray-700">
            Colectat cumulat {cumulLabel(run)} · rată {rateLabel(run.rataEfectiva)} · bază: {baseLabel(run)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Calculată {fmtDateLong(run.creatLa)} de {creator}
            {run.observatii && <> · {run.observatii}</>}
          </p>
        </div>
        <div className={`no-print flex gap-2 ${IS_ARTIFACT ? 'hidden' : ''}`}>
          <Button variant="secondary" icon={<FileText size={16} />} onClick={() => exportRunExcel(run, res, names, run.snapshot.clienti)}>
            Export Excel
          </Button>
          <Button variant="secondary" icon={<FileText size={16} />} onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </header>

      <RunWorkspace run={run} autoplay={false} />
    </div>
  );
}
