import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useStore } from '../../data/store';
import { runResult } from '../../data/useRunResult';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { RunStatusBadge } from '../../components/allocation/RunStatusBadge';
import { KpiCards } from '../../components/allocation/KpiCards';
import { FinalizationCard } from '../../components/allocation/FinalizationCard';
import { WarningsPanel } from '../../components/allocation/WarningsPanel';
import { CategoryResultTable } from '../../components/allocation/CategoryResultTable';
import { ClientResultTable } from '../../components/allocation/ClientResultTable';
import { fmtDateLong, fmtKg, fmtPct } from '../../lib/format';
import { baseLabel, periodLabel, rateLabel } from '../../lib/runLabels';
import { exportRunExcel } from '../../lib/exportRun';

type Tab = 'categorii' | 'clienti';

export function AllocationRunPage() {
  const { runId } = useParams();
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('categorii');
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
  const clientCount = new Set(res.clienti.map((c) => c.clientId)).size;

  return (
    <div className="space-y-5">
      <Link to="/admin/alocari" className="no-print inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
        <ArrowLeft size={15} /> Înapoi la Alocări DEEE
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Alocare {run.anObligatie}</h1>
            <RunStatusBadge status={run.status} />
          </div>
          <p className="mt-1 text-sm text-gray-700">
            Colectare {periodLabel(run)} · rată {rateLabel(run.rataEfectiva)} · bază: {baseLabel(run)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Calculată {fmtDateLong(run.creatLa)} de {creator}
            {run.observatii && <> · {run.observatii}</>}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button variant="secondary" icon={<FileText size={16} />} onClick={() => exportRunExcel(run, res, names, run.snapshot.clienti)}>
            Export Excel
          </Button>
          <Button variant="secondary" icon={<FileText size={16} />} onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </header>

      <KpiCards
        items={[
          { label: 'Obligație totală', value: `${fmtKg(res.totaluri.obligatie)} kg` },
          { label: 'Total alocat', value: `${fmtKg(res.totaluri.totalAlocat)} kg` },
          { label: 'Îndeplinire globală', value: fmtPct(res.totaluri.procentIndeplinire) },
          { label: 'Clienți în alocare', value: clientCount },
        ]}
      />

      <div className="no-print">
        <FinalizationCard run={run} finalizabil={res.finalizabil} />
      </div>

      <WarningsPanel warnings={res.avertizari} invariants={res.invarianti} />

      <Card>
        <Tabs
          tabs={[
            { id: 'categorii', label: 'Rezultat pe categorii' },
            { id: 'clienti', label: 'Rezultat pe clienți' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'categorii' ? (
          <div className="pt-2">
            <CategoryResultTable result={res} names={names} />
          </div>
        ) : (
          <ClientResultTable result={res} clients={run.snapshot.clienti} names={names} />
        )}
      </Card>
    </div>
  );
}
