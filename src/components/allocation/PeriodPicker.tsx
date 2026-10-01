import { Label, Select } from '../ui/Field';
import type { RunParams } from '../../data/preview';
import { LUNI } from '../../lib/format';

export const YEARS = [2025, 2026, 2027];

/** Ultima lună încheiată (implicit „Colectare până la"). */
export function lastCompleteMonth(now = new Date()) {
  const m = now.getMonth();
  return m === 0 ? { an: now.getFullYear() - 1, luna: 12 } : { an: now.getFullYear(), luna: m };
}

export function defaultParams(): RunParams {
  const last = lastCompleteMonth();
  const an = last.an;
  return { anObligatie: an, deLa: { an, luna: 1 }, panaLa: last, baza: 'declaratii_an_curent' };
}

export const periodInvalid = (p: RunParams) => p.deLa.an > p.panaLa.an || (p.deLa.an === p.panaLa.an && p.deLa.luna > p.panaLa.luna);

/** An de obligație + perioada de colectare (de la / până la). */
export function PeriodPicker({ value, onChange, compact = false }: { value: RunParams; onChange: (p: RunParams) => void; compact?: boolean }) {
  const month = (v: { an: number; luna: number }, set: (v: { an: number; luna: number }) => void, label: string) => (
    <div className="flex gap-2">
      <Select aria-label={`${label} – luna`} value={v.luna} onChange={(e) => set({ ...v, luna: Number(e.target.value) })} className={compact ? 'w-[140px]' : 'min-w-0 flex-[3]'}>
        {LUNI.map((l, i) => (
          <option key={l} value={i + 1}>
            {l}
          </option>
        ))}
      </Select>
      <Select aria-label={`${label} – anul`} value={v.an} onChange={(e) => set({ ...v, an: Number(e.target.value) })} className={compact ? 'w-[100px]' : 'min-w-0 flex-[2]'}>
        {YEARS.map((y) => (
          <option key={y}>{y}</option>
        ))}
      </Select>
    </div>
  );
  const bad = periodInvalid(value);
  return (
    <div className={compact ? 'flex flex-wrap items-end gap-3' : 'contents'}>
      <label className="block">
        <Label>An de obligație</Label>
        <Select value={value.anObligatie} onChange={(e) => onChange({ ...value, anObligatie: Number(e.target.value) })} className={compact ? 'w-[104px]' : ''}>
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </Select>
      </label>
      <div>
        <Label>Colectare de la</Label>
        {month(value.deLa, (deLa) => onChange({ ...value, deLa }), 'Colectare de la')}
      </div>
      <div>
        <Label>Colectare până la</Label>
        {month(value.panaLa, (panaLa) => onChange({ ...value, panaLa }), 'Colectare până la')}
        {bad && <p className="mt-1 text-xs text-red-600">Perioada de colectare este invalidă.</p>}
      </div>
    </div>
  );
}
