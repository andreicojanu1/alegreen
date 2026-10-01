import { VisibilityBanner } from '../../components/allocation/VisibilityBanner';
import { NewRunForm } from '../../components/allocation/NewRunForm';
import { RunHistoryTable } from '../../components/allocation/RunHistoryTable';

export function AllocationsPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Alocări DEEE</h1>
        <p className="mt-1 text-sm text-gray-600">
          Calculul alocării cantităților colectate pe categorii și clienți. O rulare devine finală doar după aprobarea unui
          Aprobator, altul decât cel care a calculat-o.
        </p>
      </header>
      <VisibilityBanner />
      <NewRunForm />
      <RunHistoryTable />
    </div>
  );
}
