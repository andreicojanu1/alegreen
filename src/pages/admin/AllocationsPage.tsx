import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Decimal from 'decimal.js';
import { ExternalLink } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { VisibilityBanner } from '../../components/allocation/VisibilityBanner';
import { AllocationTabs, type AllocationTab } from '../../components/allocation/AllocationTabs';
import { AvailabilitySection } from '../../components/allocation/AvailabilitySection';
import { NewAllocationSection } from '../../components/allocation/NewAllocationSection';
import { RunWorkspace } from '../../components/allocation/RunWorkspace';
import { RunHistoryTable } from '../../components/allocation/RunHistoryTable';
import { SessionCode } from '../../components/allocation/SessionCode';
import { RunStatusBadge } from '../../components/allocation/RunStatusBadge';
import { RulesEditor, rulesEqual, type RulesDraft } from '../../components/allocation/RulesEditor';
import { defaultParams } from '../../components/allocation/PeriodPicker';
import { useActions, useStore } from '../../data/store';
import { previewResult, type RunParams } from '../../data/preview';
import { runResult } from '../../data/useRunResult';
import { fmtDateTime } from '../../lib/format';
import { STATUS_META, cumulLabel, sessionLabel } from '../../lib/runLabels';

export function AllocationsPage() {
  const { state } = useStore();
  const { createRun, saveRules } = useActions();
  const [search, setSearch] = useSearchParams();
  const tabParam = search.get('tab');
  const tab: AllocationTab = tabParam === 'reguli' || tabParam === 'istoric' ? tabParam : 'alocari';
  const activeRunId = search.get('rulare');
  const setParam = (k: string, v: string | null) =>
    setSearch(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (v === null) n.delete(k);
        else n.set(k, v);
        return n;
      },
      { replace: true },
    );

  // ---- M1: ciorna regulilor, păstrată la schimbarea tab-ului ----
  const saved = state.rules;
  const [draft, setDraft] = useState<RulesDraft>(() => ({ rataEfectiva: saved.rataEfectiva, pragMinimImplicit: saved.pragMinimImplicit, reguli: saved.reguli }));
  const rulesDirty = !rulesEqual(draft, saved);

  // ---- M2/M3: parametrii perioadei + panoul de alocare nouă ----
  const [params, setParams] = useState<RunParams>(defaultParams);
  const [panelOpen, setPanelOpen] = useState(false);
  const [autoplayId, setAutoplayId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ runId: string; alocat: Decimal } | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const preview = useMemo(() => previewResult(state, params), [state.rules, state.clients, state.declarations, state.collected, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeRun = state.runs.find((r) => r.id === activeRunId);

  const lastRun = useMemo(() => {
    const r = [...state.runs].filter((x) => x.anObligatie === params.anObligatie).sort((a, b) => b.creatLa.localeCompare(a.creatLa))[0];
    if (!r) return undefined;
    const res = runResult(r);
    const alocat = progress && progress.runId === r.id ? progress.alocat : res.totaluri.totalAlocat;
    return { alocat, obligatie: res.totaluri.obligatie, label: `${STATUS_META[r.status].label} · ${fmtDateTime(r.creatLa)}` };
  }, [state.runs, params.anObligatie, progress]);

  useEffect(() => {
    if (autoplayId && workspaceRef.current) workspaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [autoplayId]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Alocări DEEE</h1>
        <p className="mt-1 text-sm text-gray-600">
          Calculul alocării cantităților colectate pe categorii și clienți. O rulare devine finală doar după aprobarea unui
          Aprobator, altul decât cel care a calculat-o.
        </p>
      </header>
      <VisibilityBanner />

      <Card>
        <AllocationTabs value={tab} onChange={(t) => setParam('tab', t === 'alocari' ? null : t)} rulesDirty={rulesDirty} />
        {tab === 'istoric' ? (
          <RunHistoryTable embedded />
        ) : tab === 'reguli' ? (
          <RulesEditor draft={draft} onChange={setDraft} onSave={() => saveRules(draft)} />
        ) : (
          <AvailabilitySection
            preview={preview}
            reguli={saved.reguli}
            lastRun={lastRun}
            footer={
              <NewAllocationSection
                params={params}
                onParamsChange={setParams}
                open={panelOpen}
                onOpen={() => setPanelOpen(true)}
                panel={{
                  rulesDirty,
                  onCancel: () => setPanelOpen(false),
                  onEditRules: () => setParam('tab', 'reguli'),
                  onOpenSession: (id) => {
                    setPanelOpen(false);
                    setParam('rulare', id);
                  },
                  onConfirm: (p) => {
                    const id = createRun({
                      ...p,
                      rataEfectiva: saved.rataEfectiva,
                      pragMinimImplicit: saved.pragMinimImplicit,
                      observatii: '',
                      reguli: saved.reguli,
                    });
                    setParams(p);
                    setPanelOpen(false);
                    setAutoplayId(id);
                    setParam('rulare', id);
                  },
                }}
              />
            }
          />
        )}
      </Card>

      {tab === 'alocari' && (
        <>
          {activeRun && (
            <div ref={workspaceRef} className="scroll-mt-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">Alocare {sessionLabel(activeRun)}</h2>
                  <SessionCode code={activeRun.codSesiune} />
                  <RunStatusBadge status={activeRun.status} />
                  <span className="text-sm text-gray-600">Colectat cumulat {cumulLabel(activeRun)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Link to={`/admin/alocari/${activeRun.id}`} className="inline-flex items-center gap-1.5 text-gray-800 hover:underline">
                    <ExternalLink size={15} /> Pagina rulării
                  </Link>
                  <button type="button" onClick={() => setParam('rulare', null)} className="text-gray-500 hover:underline">
                    Închide
                  </button>
                </div>
              </div>
              <RunWorkspace
                key={activeRun.id}
                run={activeRun}
                autoplay={autoplayId === activeRun.id}
                onProgress={(alocat) => setProgress({ runId: activeRun.id, alocat })}
              />
            </div>
          )}

        </>
      )}
    </div>
  );
}
