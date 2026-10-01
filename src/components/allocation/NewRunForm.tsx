import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label, Select, TextInput } from '../ui/Field';
import { PercentInput } from './PercentInput';
import { RulesEditor } from './RulesEditor';
import { useActions, useStore } from '../../data/store';
import type { CalculationBase, CategoryRule } from '../../data/types';
import { LUNI } from '../../lib/format';

const YEARS = [2025, 2026, 2027];

/** Ultima lună încheiată (implicit „Colectare până la"). */
function lastCompleteMonth(now = new Date()) {
  const m = now.getMonth(); // 0-based => luna anterioară, 1-based
  return m === 0 ? { an: now.getFullYear() - 1, luna: 12 } : { an: now.getFullYear(), luna: m };
}

/** Cardul „Rulare nouă": parametrii rulării + regulile pe categorii + „Calculează (draft)". */
export function NewRunForm() {
  const { state } = useStore();
  const { createRun } = useActions();
  const navigate = useNavigate();
  const last = lastCompleteMonth();

  const [an, setAn] = useState(2026);
  const [deLa, setDeLa] = useState({ an: 2026, luna: 1 });
  const [panaLa, setPanaLa] = useState(last.an === 2026 ? last : { an: 2026, luna: 12 });
  const [baza, setBaza] = useState<CalculationBase>('declaratii_an_curent');
  const [rata, setRata] = useState(state.defaults.rataEfectiva);
  const [prag, setPrag] = useState(state.defaults.pragMinimImplicit);
  const [observatii, setObservatii] = useState('');
  const [reguli, setReguli] = useState<CategoryRule[]>(state.defaults.reguli);

  const periodInvalid = deLa.an > panaLa.an || (deLa.an === panaLa.an && deLa.luna > panaLa.luna);

  const submit = () => {
    if (periodInvalid) return;
    const id = createRun({ anObligatie: an, deLa, panaLa, baza, rataEfectiva: rata, pragMinimImplicit: prag, observatii, reguli });
    navigate(`/admin/alocari/${id}`);
  };

  const monthSelect = (v: { an: number; luna: number }, set: (v: { an: number; luna: number }) => void, label: string) => (
    <div className="flex gap-2">
      <Select aria-label={`${label} – luna`} value={v.luna} onChange={(e) => set({ ...v, luna: Number(e.target.value) })} className="min-w-0 flex-[3]">
        {LUNI.map((l, i) => (
          <option key={l} value={i + 1}>
            {l}
          </option>
        ))}
      </Select>
      <Select aria-label={`${label} – anul`} value={v.an} onChange={(e) => set({ ...v, an: Number(e.target.value) })} className="min-w-0 flex-[2]">
        {YEARS.map((y) => (
          <option key={y}>{y}</option>
        ))}
      </Select>
    </div>
  );

  return (
    <Card>
      <CardHeader title="Rulare nouă" />
      <div className="space-y-6 px-6 py-6">
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <Label>An de obligație</Label>
            <Select value={an} onChange={(e) => setAn(Number(e.target.value))}>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </Select>
          </label>
          <div>
            <Label>Colectare de la</Label>
            {monthSelect(deLa, setDeLa, 'Colectare de la')}
          </div>
          <div>
            <Label>Colectare până la</Label>
            {monthSelect(panaLa, setPanaLa, 'Colectare până la')}
            {periodInvalid && <p className="mt-1 text-xs text-red-600">Perioada de colectare este invalidă.</p>}
          </div>
          <label className="block">
            <Label>Baza de calcul a obligației</Label>
            <Select value={baza} onChange={(e) => setBaza(e.target.value as CalculationBase)}>
              <option value="declaratii_an_curent">Declarațiile anului {an} (tranziție, ca în Excel)</option>
              <option value="medie_3_ani_anteriori" disabled>
                Media declarațiilor {an - 3}–{an - 1} (formula legală) — decizia D-01 deschisă
              </option>
            </Select>
          </label>

          <div>
            <Label>Rata efectivă (% din declarat)</Label>
            <PercentInput value={rata} onChange={setRata} className="h-10 w-full" ariaLabel="Rata efectivă" />
            <p className="mt-1 text-xs text-green-700">65% ÷ 3 ani de referință = 21,67%</p>
          </div>
          <div>
            <Label>Prag minim implicit din categoria proprie (%)</Label>
            <PercentInput value={prag} onChange={setPrag} className="h-10 w-full" ariaLabel="Prag minim implicit" />
            <p className="mt-1 text-xs text-gray-500">
              Se aplică categoriilor cu pragul implicit (plafon = 100% − prag).
            </p>
          </div>
          <label className="block md:col-span-2">
            <Label>Observații (opțional)</Label>
            <TextInput
              value={observatii}
              onChange={(e) => setObservatii(e.target.value)}
              placeholder="ex. alocare iulie–august, după colectarea din august"
            />
          </label>
        </div>

        <div>
          <RulesEditor reguli={reguli} pragMinimImplicit={prag} onChange={setReguli} />
          <p className="mt-3 text-xs text-gray-600">
            Pool-ul se distribuie în ordinea de mai sus. Modificarea ordinii schimbă rezultatul doar când surplusul nu ajunge
            pentru toate categoriile. Parametrii se salvează pe rulare și intră în aprobare.
          </p>
        </div>

        <div className="flex justify-end">
          <Button icon={<Calculator size={16} />} onClick={submit} disabled={periodInvalid}>
            Calculează (draft)
          </Button>
        </div>
      </div>
    </Card>
  );
}
