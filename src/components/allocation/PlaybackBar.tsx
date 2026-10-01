import { Check, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { AllocationResult } from '../../engine/types';
import { monthKey } from '../../engine/months';
import { SPEEDS, type Playback } from '../../hooks/useAllocationPlayback';
import { LUNI, LUNI_SCURT } from '../../lib/format';
import { CATEGORY_STYLE } from '../../lib/categoryStyle';
import { Button } from '../ui/Button';

/** Controalele alocării „live" (M4): stadiul curent, lunile procesate, Pauză / Continuă / Sari la final, viteza. */
export function PlaybackBar({ playback, result }: { playback: Playback; result: AllocationResult }) {
  const { view, playing } = playback;
  const cur = view.current;
  let status: string;
  if (view.done) status = 'Alocare completă — rezultatul final este afișat.';
  else if (cur) {
    const [an, luna] = cur.monthKey.split('-').map(Number);
    status = `${LUNI[luna - 1]} ${an} · ${cur.faza === 'propriu' ? 'colectat propriu' : 'din pool'} → categoria ${cur.cod} (${CATEGORY_STYLE[cur.cod]?.scurt ?? ''})`;
  } else status = 'Nu există cantități de alocat în perioada selectată.';

  return (
    <div className="no-print flex flex-wrap items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-wrap gap-1.5" aria-label="Lunile perioadei">
        {result.luni.map((m) => {
          const s = view.monthState(monthKey(m));
          const cls =
            s === 'active'
              ? 'bg-blue-600 text-white'
              : s === 'done'
                ? 'bg-green-50 text-green-800 ring-1 ring-green-200'
                : s === 'empty'
                  ? 'bg-white text-gray-400 ring-1 ring-gray-200 ring-dashed'
                  : 'bg-gray-100 text-gray-500';
          return (
            <span
              key={monthKey(m)}
              title={s === 'empty' ? `${LUNI[m.luna - 1]}: fără colectat` : LUNI[m.luna - 1]}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium ${cls}`}
            >
              {s === 'done' && <Check size={12} />}
              {LUNI_SCURT[m.luna - 1]}
            </span>
          );
        })}
      </div>
      <div className="min-w-[260px] flex-1 text-sm text-gray-700" aria-live="polite">
        {status}
      </div>
      <div className="flex items-center gap-2">
        {!view.done &&
          (playing ? (
            <Button variant="secondary" icon={<Pause size={15} />} onClick={playback.pause}>
              Pauză
            </Button>
          ) : (
            <Button variant="secondary" icon={<Play size={15} />} onClick={playback.resume}>
              Continuă
            </Button>
          ))}
        {!view.done ? (
          <Button variant="secondary" icon={<SkipForward size={15} />} onClick={playback.skip}>
            Sari la final
          </Button>
        ) : (
          playback.steps.length > 0 && (
            <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={playback.replay}>
              Redă alocarea
            </Button>
          )
        )}
        <select
          aria-label="Viteza animației"
          value={playback.speed}
          onChange={(e) => playback.setSpeed(Number(e.target.value))}
          className="h-10 rounded-md border border-gray-300 bg-white px-2 text-sm"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {String(s).replace('.', ',')}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
