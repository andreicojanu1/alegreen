import { useState } from 'react';
import { Play, Settings2, TriangleAlert, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label, Select } from '../ui/Field';
import { CategoryRulesTable } from './CategoryRulesTable';
import { PeriodPicker, periodInvalid } from './PeriodPicker';
import { useStore } from '../../data/store';
import type { RunParams } from '../../data/preview';
import type { CalculationBase } from '../../data/types';
import { fmtDateTime } from '../../lib/format';
import { rateLabel, ratioToPctText } from '../../lib/runLabels';

/**
 * Panoul „Alocare nouă" (M3): parametrii rulării (an, perioadă, bază) + regulile active, read-only.
 * La confirmare se creează o rulare draft cu o copie a regulilor salvate.
 */
export function NewAllocationPanel({
  initial,
  rulesDirty,
  onCancel,
  onConfirm,
  onEditRules,
}: {
  initial: RunParams;
  rulesDirty: boolean;
  onCancel: () => void;
  onConfirm: (p: RunParams) => void;
  onEditRules: () => void;
}) {
  const { state } = useStore();
  const [p, setP] = useState<RunParams>(initial);
  const rules = state.rules;
  const author = state.admins.find((a) => a.id === rules.modificatDe)?.nume;

  return (
    <Card className="ring-2 ring-gray-900/10">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Alocare nouă</h2>
        <button type="button" onClick={onCancel} aria-label="Închide" className="rounded p-1 text-gray-500 hover:bg-gray-100">
          <X size={18} />
        </button>
      </div>
      <div className="space-y-6 px-6 py-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
          <PeriodPicker value={p} onChange={setP} />
          <label className="block">
            <Label>Baza de calcul a obligației</Label>
            <Select value={p.baza} onChange={(e) => setP({ ...p, baza: e.target.value as CalculationBase })}>
              <option value="declaratii_an_curent">Declarațiile anului {p.anObligatie} (tranziție, ca în Excel)</option>
              <option value="medie_3_ani_anteriori" disabled>
                Media declarațiilor {p.anObligatie - 3}–{p.anObligatie - 1} (formula legală) — decizia D-01 deschisă
              </option>
            </Select>
          </label>
        </div>

        <div className="rounded-xl border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="text-sm">
              <span className="font-semibold text-gray-900">Reguli active</span>
              <span className="ml-2 text-gray-600">
                rată {rateLabel(rules.rataEfectiva)} · prag minim implicit {ratioToPctText(rules.pragMinimImplicit)}% · salvate{' '}
                {fmtDateTime(rules.modificatLa)} de {author}
              </span>
            </div>
            <button type="button" onClick={onEditRules} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline">
              <Settings2 size={15} /> Modifică în Reguli de alocare
            </button>
          </div>
          {rulesDirty && (
            <p className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              <TriangleAlert size={14} className="text-amber-600" /> Aveți modificări nesalvate în „Reguli de alocare". Alocarea folosește
              regulile salvate, afișate mai jos.
            </p>
          )}
          <CategoryRulesTable reguli={rules.reguli} pragMinimImplicit={rules.pragMinimImplicit} readOnly />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Anulează
          </Button>
          <Button icon={<Play size={16} />} disabled={periodInvalid(p)} onClick={() => onConfirm(p)}>
            Pornește alocarea
          </Button>
        </div>
      </div>
    </Card>
  );
}
