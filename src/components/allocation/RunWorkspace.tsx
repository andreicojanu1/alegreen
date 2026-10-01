import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Decimal from 'decimal.js';
import type { AllocationRun } from '../../data/types';
import { runResult } from '../../data/useRunResult';
import { useAllocationPlayback } from '../../hooks/useAllocationPlayback';
import { LUNI, fmtKg, fmtPct } from '../../lib/format';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { KpiCards } from './KpiCards';
import { RunStepper, stepOf } from './RunStepper';
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
  // cumulat raportat ian–M (lunile anterioare înghețate + luna curentă, derulată live)
  const cumFinal = res.clienti.reduce((a, c) => a.plus(c.afisare.totalAlocat), new Decimal(0));
  const lunaKg = view.done ? res.totalLuna : new Decimal(view.totalLuna);
  const alocat = view.done ? cumFinal : cumFinal.minus(res.totalLuna).plus(lunaKg);
  const lunaNume = LUNI[run.luna - 1];
  const clientCount = new Set(res.clienti.map((c) => c.clientId)).size;

  useEffect(() => {
    onProgress?.(alocat, view.done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.totalLuna, view.done]);

  return (
    <div className="space-y-5">
      <RunStepper current={stepOf(run.status)} inlocuita={run.status === 'inlocuita'} />
      <KpiCards
        items={[
          { label: 'Obligație totală', value: `${fmtKg(res.totaluri.obligatie)} kg` },
          { label: `Alocat în ${lunaNume.toLowerCase()}`, value: `${fmtKg(lunaKg)} kg`, hint: 'luna raportată în această sesiune' },
          {
            label: `Cumulat ianuarie–${lunaNume.toLowerCase()}`,
            value: `${fmtKg(alocat)} kg`,
            hint: `${fmtPct(res.totaluri.obligatie.isZero() ? 0 : alocat.div(res.totaluri.obligatie))} din obligația anuală`,
          },
          { label: 'Clienți în alocare', value: clientCount },
        ]}
      />
      <PlaybackBar playback={playback} result={res} />
      {run.status === 'draft' && view.done && (
        <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-900/10 bg-white px-5 py-4">
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Alocarea automată s-a încheiat.</span> Verificați rezultatul și treceți
            la revizuire și confirmare.
          </div>
          <Link
            to={`/admin/alocari/${run.id}/revizuire`}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 text-base font-semibold text-white hover:bg-gray-800"
          >
            Revizuiește și confirmă <ArrowRight size={18} />
          </Link>
        </div>
      )}
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
            <CategoryResultTable result={res} names={names} view={view} />
          </div>
        )}
      </Card>
      <WarningsPanel warnings={res.avertizari} invariants={res.invarianti} />
      <div className="no-print">
        <FinalizationCard run={run} finalizabil={res.finalizabil} ready={view.done} />
      </div>
    </div>
  );
}
