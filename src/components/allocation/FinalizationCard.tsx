import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';
import { AdjustmentLog } from './AdjustmentLog';
import { RejectRunForm } from './RejectRunForm';
import { useConfirm } from '../ui/ConfirmDialog';
import { LastRejection } from './LastRejection';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { useActions, useStore } from '../../data/store';
import type { AllocationRun } from '../../data/types';
import { fmtDateTime } from '../../lib/format';

/**
 * Fluxul de aprobare (neschimbat față de platformă): draft → „Trimite spre aprobare" → aprobarea unui ALT admin → finalizată.
 * La finalizare, rularea finalizată anterioară pentru același an devine „înlocuită" (DAT-03).
 */
export function FinalizationCard({ run, finalizabil, ready = true }: { run: AllocationRun; finalizabil: boolean; ready?: boolean }) {
  const { state } = useStore();
  const { approveRun, rejectRun, deleteDraft } = useActions();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const name = (id?: string) => state.admins.find((a) => a.id === id)?.nume ?? '—';
  const me = state.role.tip === 'admin' ? state.role.adminId : undefined;
  const previous = state.runs.find((r) => r.anObligatie === run.anObligatie && r.status === 'finalizata' && r.id !== run.id);

  let body;
  switch (run.status) {
    case 'draft':
      body = (
        <>
          <LastRejection run={run} />
          <p className="text-sm text-gray-700">
            Calculul automat este gata. Rularea este în draft și nu este vizibilă nimănui în afara administratorilor. Pasul
            următor: verificați datele, faceți eventualele ajustări manuale și confirmați alocarea pentru aprobare.
          </p>
          {!finalizabil && (
            <p className="mt-2 text-sm text-red-700">Cel puțin un invariant a eșuat — rularea nu poate fi confirmată.</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to={`/admin/alocari/${run.id}/revizuire`}
              aria-disabled={!ready || !finalizabil}
              className={`inline-flex h-12 items-center gap-2 rounded-lg px-6 text-base font-semibold ${
                ready && finalizabil ? 'bg-ink text-white hover:bg-gray-800' : 'pointer-events-none bg-gray-200 text-gray-500'
              }`}
            >
              Revizuiește și confirmă <ArrowRight size={18} />
            </Link>
            {!ready && <span className="text-xs text-gray-500">Disponibil după terminarea alocării automate.</span>}
            {(run.ajustari?.length ?? 0) > 0 && (
              <span className="text-xs text-amber-800">{run.ajustari!.length} ajustări manuale în lucru</span>
            )}
            <Button
              variant="secondary"
              icon={<Trash2 size={16} />}
              className="ml-auto"
              onClick={async () => {
                if (await confirm({ title: 'Ștergeți draftul?', message: 'Acțiunea nu poate fi anulată.', confirmLabel: 'Șterge draftul', danger: true })) {
                  deleteDraft(run.id);
                  navigate('/admin/alocari');
                }
              }}
            >
              Șterge draftul
            </Button>
          </div>
        </>
      );
      break;
    case 'in_aprobare': {
      const own = me === run.creatDe;
      const label = previous ? `Aprobă și înlocuiește alocarea din ${fmtDateTime(previous.finalizatLa!)}` : 'Aprobă și finalizează';
      body = (
        <>
          <p className="text-sm text-gray-700">
            Rularea a fost trimisă spre aprobare de {name(run.creatDe)} la {fmtDateTime(run.trimisSpreAprobareLa!)} și
            așteaptă aprobarea unui Aprobator, altul decât cel care a calculat-o.
          </p>
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">
              Ajustări manuale la revizuire{run.revizuitDe ? ` (revizuit de ${name(run.revizuitDe)})` : ''}
            </h3>
            <AdjustmentLog run={run} />
            {run.motivAjustari && (
              <p className="mt-2 text-sm text-gray-700">
                <span className="font-semibold">Motiv:</span> {run.motivAjustari}
              </p>
            )}
          </div>
          {own ? (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Nu puteți aproba o rulare calculată de dumneavoastră. Comutați pe alt administrator (în prototip: colțul din
              dreapta jos) pentru a o aproba.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap items-start gap-2">
              <Button
                icon={<CheckCircle2 size={16} />}
                disabled={!finalizabil}
                onClick={async () => {
                  const ok = await confirm({
                    title: previous ? 'Aprobați și înlocuiți alocarea?' : 'Aprobați și finalizați rularea?',
                    message: previous
                      ? `Rularea finalizată din ${fmtDateTime(previous.finalizatLa!)} va fi marcată „înlocuită". Noua rulare devine imutabilă.`
                      : 'După finalizare, rularea devine imutabilă.',
                    confirmLabel: 'Aprobă',
                  });
                  if (ok) approveRun(run.id);
                }}
              >
                {label}
              </Button>
              <RejectRunForm onReject={(motiv) => rejectRun(run.id, motiv)} />
            </div>
          )}
        </>
      );
      break;
    }
    case 'finalizata':
      body = (
        <div className="text-sm text-gray-700">
          Rularea este finalizată și imutabilă. Calculată de {name(run.creatDe)}, aprobată de {name(run.aprobatDe)} la{' '}
          {fmtDateTime(run.finalizatLa!)}.{' '}
          {state.clientVisibility
            ? 'Rezultatul este vizibil clienților.'
            : 'Rezultatul va deveni vizibil clienților după activarea vizibilității („Publică pentru clienți").'}
          {(run.ajustari?.length ?? 0) > 0 && (
            <div className="mt-3">
              <AdjustmentLog run={run} />
              {run.motivAjustari && (
                <p className="mt-2">
                  <span className="font-semibold">Motivul ajustărilor:</span> {run.motivAjustari}
                </p>
              )}
            </div>
          )}
        </div>
      );
      break;
    case 'inlocuita':
      body = (
        <p className="text-sm text-gray-700">
          Rularea a fost finalizată la {fmtDateTime(run.finalizatLa!)} și ulterior înlocuită de o rulare mai nouă. Rămâne în
          istoric, nemodificată.
        </p>
      );
      break;
  }

  return (
    <Card>
      <CardHeader title="Finalizare" />
      <div className="px-6 py-5">{body}</div>
    </Card>
  );
}
