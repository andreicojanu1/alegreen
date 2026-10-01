import { useStore } from '../../data/store';
import { Card } from '../../components/ui/Card';
import { MonthlyReportsList } from '../../components/client/MonthlyReportsList';

/** Meniul „Rapoarte" al clientului: rapoartele lunare din sesiunile aprobate (cel mai recent an). */
export function ClientReportsIndex() {
  const { state } = useStore();
  const clientId = state.role.tip === 'client' ? state.role.clientId : '';
  const runs = state.runs.filter((r) => r.status === 'finalizata');
  const an = Math.max(0, ...runs.map((r) => r.anObligatie));
  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Rapoarte</h1>
      {state.clientVisibility && runs.length ? (
        <MonthlyReportsList runs={runs.filter((r) => r.anObligatie === an)} clientId={clientId} />
      ) : (
        <Card className="px-6 py-12 text-center text-gray-600">Rapoartele lunare de alocare nu au fost încă publicate.</Card>
      )}
    </div>
  );
}
