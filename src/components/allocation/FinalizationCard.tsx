import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Send, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { useActions, useStore } from '../../data/store';
import type { AllocationRun } from '../../data/types';
import { fmtDateTime } from '../../lib/format';

/**
 * Fluxul de aprobare (neschimbat față de platformă): draft → „Trimite spre aprobare" → aprobarea unui ALT admin → finalizată.
 * La finalizare, rularea finalizată anterioară pentru același an devine „înlocuită" (DAT-03).
 */
export function FinalizationCard({ run, finalizabil }: { run: AllocationRun; finalizabil: boolean }) {
  const { state } = useStore();
  const { submitRun, approveRun, deleteDraft } = useActions();
  const navigate = useNavigate();
  const name = (id?: string) => state.admins.find((a) => a.id === id)?.nume ?? '—';
  const me = state.role.tip === 'admin' ? state.role.adminId : undefined;
  const previous = state.runs.find((r) => r.anObligatie === run.anObligatie && r.status === 'finalizata' && r.id !== run.id);

  let body;
  switch (run.status) {
    case 'draft':
      body = (
        <>
          <p className="text-sm text-gray-700">
            Rularea este în draft și nu este vizibilă nimănui în afara administratorilor. Trimiteți-o spre aprobare când ați
            verificat rezultatul.
          </p>
          {!finalizabil && (
            <p className="mt-2 text-sm text-red-700">Cel puțin un invariant a eșuat — rularea nu poate fi trimisă spre aprobare.</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button icon={<Send size={16} />} disabled={!finalizabil} onClick={() => submitRun(run.id)}>
              Trimite spre aprobare
            </Button>
            <Button
              variant="secondary"
              icon={<Trash2 size={16} />}
              onClick={() => {
                if (confirm('Ștergeți draftul? Acțiunea nu poate fi anulată.')) {
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
          {own ? (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Nu puteți aproba o rulare calculată de dumneavoastră. Comutați pe alt administrator (în prototip: colțul din
              dreapta jos) pentru a o aproba.
            </p>
          ) : (
            <div className="mt-4">
              <Button
                icon={<CheckCircle2 size={16} />}
                disabled={!finalizabil}
                onClick={() => {
                  const msg = previous
                    ? `Rularea finalizată din ${fmtDateTime(previous.finalizatLa!)} va fi marcată „înlocuită". Continuați?`
                    : 'Aprobați și finalizați rularea? După finalizare devine imutabilă.';
                  if (confirm(msg)) approveRun(run.id);
                }}
              >
                {label}
              </Button>
            </div>
          )}
        </>
      );
      break;
    }
    case 'finalizata':
      body = (
        <p className="text-sm text-gray-700">
          Rularea este finalizată și imutabilă. Calculată de {name(run.creatDe)}, aprobată de {name(run.aprobatDe)} la{' '}
          {fmtDateTime(run.finalizatLa!)}.{' '}
          {state.clientVisibility
            ? 'Rezultatul este vizibil clienților.'
            : 'Rezultatul va deveni vizibil clienților după activarea vizibilității („Publică pentru clienți").'}
        </p>
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
