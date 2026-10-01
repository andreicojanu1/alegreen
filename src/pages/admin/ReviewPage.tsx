import { useState } from 'react';
import Decimal from 'decimal.js';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, RotateCcw, Send, Undo2, XCircle } from 'lucide-react';
import { useActions, useStore } from '../../data/store';
import { runResult } from '../../data/useRunResult';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KpiCards } from '../../components/allocation/KpiCards';
import { RunStepper, stepOf } from '../../components/allocation/RunStepper';
import { RunStatusBadge } from '../../components/allocation/RunStatusBadge';
import { ReallocationPanel } from '../../components/allocation/ReallocationPanel';
import { ReviewClientTable } from '../../components/allocation/ReviewClientTable';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { SessionCode } from '../../components/allocation/SessionCode';
import { LastRejection } from '../../components/allocation/LastRejection';
import { AdjustmentLog } from '../../components/allocation/AdjustmentLog';
import { WarningsPanel } from '../../components/allocation/WarningsPanel';
import { LUNI, fmtKg, fmtNum, fmtPct } from '../../lib/format';
import { cumulLabel, rateLabel, sessionLabel } from '../../lib/runLabels';

/**
 * Ecranul „Revizuire și confirmare" — pasul 2 al sesiunii de alocare. Operatorul verifică rezultatul automat,
 * poate muta cantități între clienții aceleiași categorii (cantitățile disponibile se actualizează live) și
 * trimite rularea spre aprobarea unui alt admin. După aprobare, rezultatul ajunge în conturile clienților.
 */
export function ReviewPage() {
  const { runId } = useParams();
  const { state } = useStore();
  const { addAdjustments, undoAdjustment, clearAdjustments, submitRun } = useActions();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [motiv, setMotiv] = useState('');
  const run = state.runs.find((r) => r.id === runId);
  const me = state.role.tip === 'admin' ? state.role.adminId : '';

  if (!run) {
    return (
      <Card className="px-6 py-10 text-center text-gray-600">
        Rularea nu există sau a fost ștearsă. <Link to="/admin/alocari" className="underline">Înapoi la Alocări DEEE</Link>
      </Card>
    );
  }
  const res = runResult(run);
  const names = Object.fromEntries(run.reguli.map((r) => [r.cod, r.denumire]));
  const editable = run.status === 'draft';
  const nAdj = run.ajustari?.length ?? 0;
  const buffer = Object.values(res.disponibilRealocat).reduce((a, b) => a.plus(b.total), new Decimal(0));
  const motivLipsa = nAdj > 0 && motiv.trim().length < 5;
  const blockers = [
    !res.finalizabil && 'cel puțin un invariant a eșuat',
    res.verificariRevizuire.some((v) => !v.trecut) && 'verificările de revizuire nu trec (vezi lista)',
    motivLipsa && 'completați motivul ajustărilor manuale',
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-[1700px] space-y-5">
      <Link to={`/admin/alocari/${run.id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
        <ArrowLeft size={15} /> Înapoi la rezultatul alocării
      </Link>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Revizuire și confirmare · {sessionLabel(run)}</h1>
          <SessionCode code={run.codSesiune} />
          <RunStatusBadge status={run.status} />
        </div>
        <p className="text-sm text-gray-700">
          Colectat cumulat {cumulLabel(run)} · rată {rateLabel(run.rataEfectiva)}. Verificați alocarea lunii și, unde e cazul, mutați
          cantități între clienții aceleiași categorii: scădeți „Luna final" la un client (cantitatea trece în „disponibil de
          realocat"), apoi creșteți-o la altul. Lunile deja raportate nu se modifică, iar un client nu poate depăși obligația lui.
        </p>
        <RunStepper current={stepOf(run.status, true)} inlocuita={run.status === 'inlocuita'} />
      </header>

      <LastRejection run={run} />
      {!editable && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Rularea a fost deja trimisă spre aprobare — revizuirea este închisă și afișată doar pentru consultare.
        </p>
      )}

      <KpiCards
        items={[
          { label: 'Obligație totală', value: `${fmtKg(res.totaluri.obligatie)} kg` },
          {
            label: `Alocat în ${LUNI[run.luna - 1].toLowerCase()}`,
            value: `${fmtKg(res.totalLuna)} kg`,
            hint: `cumulat ${fmtKg(res.clienti.reduce((a, c) => a.plus(c.afisare.totalAlocat), new Decimal(0)))} kg · ${fmtPct(res.totaluri.procentIndeplinire)} din obligație`,
          },
          {
            label: 'Disponibil de realocat',
            value: <span className={buffer.greaterThanOrEqualTo('0.005') ? 'text-amber-700' : ''}>{fmtKg(buffer)} kg</span>,
            hint: buffer.greaterThanOrEqualTo('0.005') ? 'trebuie reatribuit înainte de trimitere' : 'tot ce s-a retras a fost reatribuit',
          },
          { label: 'Ajustări manuale', value: nAdj, hint: nAdj ? 'vezi jurnalul de mai jos' : 'alocarea automată, neschimbată' },
        ]}
      />

      <Card>
        <CardHeader title="Cantități disponibile pe categorii" />
        <div className="px-6 py-5">
          <ReallocationPanel res={res} names={names} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Alocarea pe clienți"
          actions={
            editable && (
              <div className="flex gap-2">
                <Button variant="secondary" icon={<Undo2 size={15} />} disabled={!nAdj} onClick={() => undoAdjustment(run.id)}>
                  Anulează ultima ajustare
                </Button>
                <Button
                  variant="secondary"
                  icon={<RotateCcw size={15} />}
                  disabled={!nAdj}
                  onClick={async () =>
                    (await confirm({ title: 'Reveniți la calculul automat?', message: 'Toate ajustările manuale ale acestei rulări vor fi anulate.', confirmLabel: 'Anulează ajustările', danger: true })) &&
                    clearAdjustments(run.id)
                  }
                >
                  Revino la calculul automat
                </Button>
              </div>
            )
          }
        />
        <ReviewClientTable
          res={res}
          clients={run.snapshot.clienti}
          names={names}
          readOnly={!editable}
          onAdjust={(a) => addAdjustments(run.id, [a], me)}
        />
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Jurnalul ajustărilor manuale" />
          <div className="px-6 py-5">
            <AdjustmentLog run={run} erori={res.erori} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Verificări de revizuire" />
          <ul className="divide-y divide-gray-100 px-6 py-3">
            {res.verificariRevizuire.map((v) => (
              <li key={v.cod} className="flex items-center gap-3 py-2.5 text-sm">
                {v.trecut ? <CheckCircle2 size={17} className="text-green-600" /> : <XCircle size={17} className="text-red-600" />}
                <span className="w-9 font-semibold">{v.cod}</span>
                <span className="flex-1">{v.descriere}</span>
                <span className={`text-xs tabular ${v.trecut ? 'text-teal-600' : 'font-semibold text-red-600'}`}>
                  {v.valoare.abs().lessThan('0.0000005') ? '0' : fmtNum(v.valoare, v.cod === 'R-3' ? 0 : 2)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <WarningsPanel warnings={res.avertizari} invariants={res.invarianti} />

      {editable && (
        <Card className="ring-2 ring-gray-900/10">
          <CardHeader title="Confirmare" />
          <div className="space-y-4 px-6 py-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Motivul ajustărilor manuale {nAdj > 0 ? <span className="text-red-600">*</span> : <span className="text-gray-500">(nu există ajustări)</span>}
              </span>
              <textarea
                value={motiv}
                onChange={(e) => setMotiv(e.target.value)}
                disabled={nAdj === 0}
                rows={2}
                placeholder="ex. corecție la cererea clientului, conform contractului…"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none disabled:bg-gray-50"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-700">
                {blockers.length
                  ? `Nu se poate trimite încă: ${blockers.join('; ')}.`
                  : 'Totul este în regulă. După trimitere, revizuirea se închide, iar rularea așteaptă aprobarea unui alt administrator; la aprobare, rezultatul ajunge în conturile clienților.'}
              </p>
              <button
                type="button"
                disabled={blockers.length > 0}
                onClick={() => {
                  submitRun(run.id, motiv.trim());
                  navigate(`/admin/alocari/${run.id}`);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 text-base font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
              >
                <Send size={18} /> Confirmă și trimite spre aprobare
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
