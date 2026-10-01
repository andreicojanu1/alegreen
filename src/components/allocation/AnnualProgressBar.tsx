import { LUNI, fmtKg, fmtPct } from '../../lib/format';

export interface MonthSegment {
  key: string; // YYYY-MM
  kg: number;
  active: boolean;
}

/**
 * Bara obligației anuale a unui rând (client × categorie), M4: se umple progresiv, lună cu lună, până la procentul
 * final de îndeplinire. Fiecare lună e un segment separat (tonuri alternante + spațiu de 2px), cu tooltip
 * „cât a acoperit luna respectivă". Culoare: albastru în timpul alocării; la final verde (100%) sau ambră (sub 100%).
 * Lunile sunt doar o defalcare — reperul oficial rămâne obligația anuală (RB-15).
 */
export function AnnualProgressBar({
  obligatie,
  segments,
  done,
  pctLabel,
  complete,
}: {
  obligatie: number;
  segments: MonthSegment[];
  done: boolean;
  /** procentul exact (din motor) afișat la final, în locul celui interpolat */
  pctLabel?: string;
  /** la final: obligația e acoperită integral (după valoarea exactă din motor, nu după cifrele rotunjite) */
  complete?: boolean;
}) {
  const total = segments.reduce((a, s) => a + s.kg, 0);
  const ratio = obligatie > 0 ? total / obligatie : 0;
  const full = done && complete !== undefined ? complete : ratio >= 0.99995;
  const palette = !done ? ['#3b82f6', '#93c5fd'] : full ? ['#16a34a', '#86efac'] : ['#d97706', '#fcd34d'];
  const visible = segments.filter((s) => s.kg > 0);

  return (
    <div className="flex min-w-[220px] items-center gap-2">
      <div
        className="relative flex h-2.5 flex-1 gap-[2px] overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={Math.round(ratio * 10000) / 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Îndeplinirea obligației anuale"
      >
        {visible.map((s, i) => {
          const [an, luna] = s.key.split('-').map(Number);
          const w = obligatie > 0 ? Math.min(100, (s.kg / obligatie) * 100) : 0;
          return (
            <div
              key={s.key}
              title={`${LUNI[luna - 1]} ${an}: ${fmtKg(s.kg)} kg · ${fmtPct(obligatie > 0 ? s.kg / obligatie : 0)} din obligația anuală`}
              className={`h-full shrink-0 first:rounded-l-full last:rounded-r-full ${s.active ? 'animate-pulse' : ''}`}
              style={{ width: `${w}%`, background: palette[i % 2] }}
            />
          );
        })}
      </div>
      <span className={`w-16 text-right text-xs tabular ${done && !full ? 'font-semibold text-amber-700' : 'text-gray-800'}`}>
        {done && pctLabel ? pctLabel : fmtPct(ratio)}
      </span>
    </div>
  );
}
