import { useState } from 'react';
import { CheckCircle2, RotateCcw, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Label } from '../ui/Field';
import { PercentInput } from './PercentInput';
import { CategoryRulesTable } from './CategoryRulesTable';
import { useStore, type RulesConfig } from '../../data/store';
import { fmtDateTime } from '../../lib/format';

export type RulesDraft = Pick<RulesConfig, 'rataEfectiva' | 'pragMinimImplicit' | 'reguli'>;

export const rulesEqual = (a: RulesDraft, b: RulesDraft) =>
  a.rataEfectiva === b.rataEfectiva && a.pragMinimImplicit === b.pragMinimImplicit && JSON.stringify(a.reguli) === JSON.stringify(b.reguli);

/**
 * Tab-ul „Reguli de alocare" (M1): rata efectivă, pragul minim implicit, regulile pe categorii și ordinea pool-ului.
 * Se salvează explicit; rulările deja calculate își păstrează propria copie a regulilor.
 */
export function RulesEditor({
  draft,
  onChange,
  onSave,
}: {
  draft: RulesDraft;
  onChange: (d: RulesDraft) => void;
  onSave: () => void;
}) {
  const { state } = useStore();
  const saved = state.rules;
  const dirty = !rulesEqual(draft, saved);
  const [justSaved, setJustSaved] = useState(false);
  const author = state.admins.find((a) => a.id === saved.modificatDe)?.nume ?? saved.modificatDe;

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label>Rata efectivă (% din declarat)</Label>
          <PercentInput
            value={draft.rataEfectiva}
            onChange={(v) => onChange({ ...draft, rataEfectiva: v })}
            className="h-10 w-full"
            ariaLabel="Rata efectivă"
          />
          <p className="mt-1 text-xs text-green-700">65% ÷ 3 ani de referință = 21,67%</p>
        </div>
        <div>
          <Label>Prag minim implicit din categoria proprie (%)</Label>
          <PercentInput
            value={draft.pragMinimImplicit}
            onChange={(v) => onChange({ ...draft, pragMinimImplicit: v })}
            className="h-10 w-full"
            ariaLabel="Prag minim implicit"
          />
          <p className="mt-1 text-xs text-gray-500">Se aplică categoriilor cu pragul implicit (plafon = 100% − prag).</p>
        </div>
      </div>

      <div>
        <CategoryRulesTable
          reguli={draft.reguli}
          pragMinimImplicit={draft.pragMinimImplicit}
          onChange={(reguli) => onChange({ ...draft, reguli })}
        />
        <p className="mt-3 text-xs text-gray-600">
          Pool-ul se distribuie în ordinea de mai sus. Modificarea ordinii schimbă rezultatul doar când surplusul nu ajunge
          pentru toate categoriile. Regulile salvate se aplică alocărilor noi; fiecare rulare păstrează copia regulilor cu care
          a fost calculată.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
        <div className="text-xs text-gray-600">
          Ultima modificare: <strong className="font-semibold text-gray-800">{fmtDateTime(saved.modificatLa)}</strong> · {author}
          {dirty && <span className="ml-3 rounded bg-amber-50 px-2 py-0.5 text-amber-800">Modificări nesalvate</span>}
          {!dirty && justSaved && (
            <span className="ml-3 inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-green-800" role="status">
              <CheckCircle2 size={13} /> Regulile au fost salvate.
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<RotateCcw size={15} />}
            disabled={!dirty}
            onClick={() => onChange({ rataEfectiva: saved.rataEfectiva, pragMinimImplicit: saved.pragMinimImplicit, reguli: saved.reguli })}
          >
            Renunță la modificări
          </Button>
          <Button
            icon={<Save size={15} />}
            disabled={!dirty}
            onClick={() => {
              onSave();
              setJustSaved(true);
            }}
          >
            Salvează regulile
          </Button>
        </div>
      </div>
    </div>
  );
}
