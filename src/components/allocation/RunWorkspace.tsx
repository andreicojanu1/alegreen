import { useEffect, useState } from 'react';
import Decimal from 'decimal.js';
import type { AllocationRun } from '../../data/types';
import { runResult } from '../../data/useRunResult';
import { useAllocationPlayback } from '../../hooks/useAllocationPlayback';
import { fmtKg, fmtPct } from '../../lib/format';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { KpiCards } from './KpiCards';
import { PlaybackBar } from './PlaybackBar';
import { FinalizationCard } from './FinalizationCard';
import { WarningsPanel } from './WarningsPanel';
import { CategoryResultTable } from './CategoryResultTable';
import { ClientAllocationTable } from './ClientAllocationTable';

type Tab = 'clienti' | 'categorii';

/**
 * Rezultatul unei rulări: KPI-uri sincronizate cu animația, controalele de redare, tabelul de clienți (live),
 * rezultatul pe categorii, avertizările/invarianții și fluxul de aprobare.
 */
export function RunWorkspace({
  run,
  autoplay,
  onProgress,
}: {
  run: AllocationRun;
  autoplay: boolean;
  /** kg alocate până acum (pentru KPI-urile și graficul paginii) */
  onProgress?: (alocat: Decimal, done: boolean) => void;
}) {
  const res = runResult(run);
  const playback = useAllocationPlayback(res, autoplay);
  const { view } = playback;
  const [tab, setTab] = useState<Tab>('clienti');
  const names = Object.fromEntries(run.reguli.map((r) => [r.cod, r.denumire]));
  const alocat = view.done ? res.totaluri.totalAlocat : new Decimal(view.totalAlocat);
  const clientCount = new Set(res.clienti.map((c) => c.clientId)).size;

  useEffect(() => {
    onProgress?.(alocat, view.done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.totalAlocat, view.done]);

  return (
    <div className="space-y-5">
      <KpiCards
        items={[
          { label: 'Obligație totală', value: `${fmtKg(res.totaluri.obligatie)} kg` },
          { label: 'Total alocat', value: `${fmtKg(alocat)} kg` },
          {
            label: 'Îndeplinire globală',
            value: fmtPct(view.done ? res.totaluri.procentIndeplinire : res.totaluri.obligatie.isZero() ? 0 : alocat.div(res.totaluri.obligatie)),
          },
          { label: 'Clienți în alocare', value: clientCount },
        ]}
      />
      <PlaybackBar playback={playback} result={res} />
      <Card>
        <Tabs
          tabs={[
            { id: 'clienti', label: 'Rezultat pe clienți' },
            { id: 'categorii', label: 'Rezultat pe categorii' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'clienti' ? (
          <ClientAllocationTable result={res} clients={run.snapshot.clienti} names={names} view={view} />
        ) : (
          <div className="px-4 pt-2">
            <CategoryResultTable result={res} names={names} />
          </div>
        )}
      </Card>
      <WarningsPanel warnings={res.avertizari} invariants={res.invarianti} />
      <div className="no-print">
        <FinalizationCard run={run} finalizabil={res.finalizabil} />
      </div>
    </div>
  );
}
