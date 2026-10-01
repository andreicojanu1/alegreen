import { Label, Select } from '../ui/Field';
import type { RunParams } from '../../data/preview';
import { LUNI } from '../../lib/format';

export const YEARS = [2025, 2026, 2027];

/** Ultima lună încheiată (o lună se poate aloca doar după ce s-a încheiat). */
export function lastCompleteMonth(now = new Date()) {
  const m = now.getMonth();
  return m === 0 ? { an: now.getFullYear() - 1, luna: 12 } : { an: now.getFullYear(), luna: m };
}

export function defaultParams(luna?: number): RunParams {
  const last = lastCompleteMonth();
  return { anObligatie: last.an, luna: luna ?? last.luna, baza: 'declaratii_an_curent' };
}

/** An de obligație + luna (colectarea se cumulează din ianuarie până la luna aleasă). */
export function PeriodPicker({
  value,
  onChange,
  compact = false,
  lockMonth = false,
  monthHint,
}: {
  value: RunParams;
  onChange: (p: RunParams) => void;
  compact?: boolean;
  /** sesiunile merg strict în ordine: luna nu se alege, e următoarea de alocat */
  lockMonth?: boolean;
  monthHint?: string;
}) {
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
      <label className="block">
        <Label>{compact ? 'Colectat ianuarie –' : 'Luna alocată'}</Label>
        <Select
          value={value.luna}
          disabled={lockMonth}
          onChange={(e) => onChange({ ...value, luna: Number(e.target.value) })}
          className={compact ? 'w-[150px]' : ''}
        >
          {LUNI.map((l, i) => (
            <option key={l} value={i + 1}>
              {l} {value.anObligatie}
            </option>
          ))}
        </Select>
        {monthHint && <p className="mt-1 text-xs text-gray-600">{monthHint}</p>}
      </label>
    </div>
  );
}
