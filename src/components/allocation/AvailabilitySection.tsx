import Decimal from 'decimal.js';
import { Plus } from 'lucide-react';
import type { AllocationResult } from '../../engine/types';
import type { CategoryRule } from '../../data/types';
import type { RunParams } from '../../data/preview';
import { fmtKg, fmtPct } from '../../lib/format';
import { Button } from '../ui/Button';
import { KpiCards } from './KpiCards';
import { AvailabilityDonut, DonutInnerLegend } from './AvailabilityDonut';
import { CategoryLegend } from './CategoryLegend';
import { PeriodPicker } from './PeriodPicker';

/** Prima secțiune a tab-ului „Alocări" (M2): cantitățile disponibile, vizual, + butonul „Alocare nouă" (M3). */
export function AvailabilitySection({
  preview,
  reguli,
  params,
  onParamsChange,
  lastRun,
  onNewAllocation,
}: {
  preview: AllocationResult;
  reguli: CategoryRule[];
  params: RunParams;
  onParamsChange: (p: RunParams) => void;
  /** ultima rulare pentru anul selectat (valoarea „alocat" poate fi cea animată) */
  lastRun?: { alocat: Decimal; obligatie: Decimal; label: string };
  onNewAllocation: () => void;
}) {
  const t = preview.totaluri;
  return (
    <div className="space-y-5 px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[320px] flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Cantități disponibile</h2>
          <p className="text-sm text-gray-600">Colectat pe categorii în perioada selectată, față de obligația calculată cu regulile active.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <PeriodPicker value={params} onChange={onParamsChange} compact />
          <Button icon={<Plus size={16} />} onClick={onNewAllocation}>
            Alocare nouă
          </Button>
        </div>
      </div>

      <KpiCards
        items={[
          { label: 'Obligație totală', value: `${fmtKg(t.obligatie)} kg`, hint: `${fmtPct(preview.rataEfectiva)} din declarat` },
          { label: 'Colectat disponibil', value: `${fmtKg(t.colectat)} kg`, hint: 'în perioada selectată' },
          { label: 'Alocat (ultima rulare)', value: lastRun ? `${fmtKg(lastRun.alocat)} kg` : '—', hint: lastRun?.label ?? 'Nicio rulare pentru acest an' },
          {
            label: 'Îndeplinire globală',
            value: lastRun && !lastRun.obligatie.isZero() ? fmtPct(lastRun.alocat.div(lastRun.obligatie)) : '—',
            hint: 'alocat ÷ obligația ultimei rulări',
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-8 rounded-2xl border border-gray-100 p-5 lg:grid-cols-[260px_1fr]">
        <div>
          <AvailabilityDonut
            slices={preview.categorii.map((c) => ({ cod: c.cod, kg: c.colectat }))}
            total={t.colectat}
            alocat={lastRun?.alocat ?? new Decimal(0)}
          />
          <DonutInnerLegend total={t.colectat} alocat={lastRun?.alocat ?? new Decimal(0)} />
        </div>
        <CategoryLegend preview={preview} reguli={reguli} />
      </div>
    </div>
  );
}
