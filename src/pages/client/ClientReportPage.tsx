import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useStore } from '../../data/store';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SituatieEEEReport } from '../../components/reports/SituatieEEEReport';
import { RaportAFMReport } from '../../components/reports/RaportAFMReport';
import { RaportareEEEReport } from '../../components/reports/RaportareEEEReport';
import { IS_ARTIFACT } from '../../lib/env';
import { sessionLabel } from '../../lib/runLabels';

export const REPORT_TYPES = {
  situatie: 'Situație EEE',
  afm: 'Raport AFM',
  raportare: 'Raportare EEE',
} as const;
export type ReportType = keyof typeof REPORT_TYPES;

/** Un raport lunar al clientului; disponibil doar din sesiuni aprobate (UI-C2) și doar pentru clientul autentificat. */
export function ClientReportPage() {
  const { runId, tip } = useParams();
  const { state } = useStore();
  const clientId = state.role.tip === 'client' ? state.role.clientId : '';
  const client = state.clients.find((c) => c.id === clientId);
  const run = state.runs.find((r) => r.id === runId && r.status === 'finalizata');
  const type = (tip ?? 'situatie') as ReportType;

  if (!run || !client || !state.clientVisibility || !(type in REPORT_TYPES)) {
    return (
      <Card className="mx-auto max-w-xl px-6 py-10 text-center text-gray-600">
        Raportul nu este disponibil. <Link to="/client/alocari" className="underline">Înapoi la Alocări EEE</Link>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="no-print mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3">
        <Link to="/client/alocari" className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
          <ArrowLeft size={15} /> Înapoi la Alocări EEE
        </Link>
        <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-sm">
          {(Object.keys(REPORT_TYPES) as ReportType[]).map((t) => (
            <Link
              key={t}
              to={`/client/rapoarte/${run.id}/${t}`}
              className={`rounded-md px-3 py-1.5 text-sm ${t === type ? 'bg-ink font-medium text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {REPORT_TYPES[t]}
            </Link>
          ))}
        </div>
        {!IS_ARTIFACT && (
          <Button variant="secondary" icon={<Printer size={15} />} onClick={() => window.print()}>
            Descarcă PDF
          </Button>
        )}
      </div>
      <p className="no-print mx-auto max-w-[860px] text-xs text-gray-500">Raportul lunii {sessionLabel(run)}, generat din alocarea aprobată.</p>
      {type === 'situatie' && <SituatieEEEReport run={run} client={client} />}
      {type === 'afm' && <RaportAFMReport run={run} client={client} />}
      {type === 'raportare' && <RaportareEEEReport run={run} client={client} />}
    </div>
  );
}
