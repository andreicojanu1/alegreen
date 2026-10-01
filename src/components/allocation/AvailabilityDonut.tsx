import type Decimal from 'decimal.js';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryColor, CATEGORY_STYLE } from '../../lib/categoryStyle';
import { fmtKg, fmtPct } from '../../lib/format';

export interface DonutSlice {
  cod: string;
  kg: Decimal;
}

/**
 * Donut cu cantitățile colectate pe categorii (inelul exterior) și, în inelul interior, cât e deja alocat
 * vs. cât e încă disponibil. În centru: totalul colectat.
 */
export function AvailabilityDonut({ slices, total, alocat }: { slices: DonutSlice[]; total: Decimal; alocat: Decimal }) {
  const outer = slices.filter((s) => s.kg.greaterThan(0)).map((s) => ({ cod: s.cod, value: s.kg.toNumber(), kg: s.kg }));
  const alocatCapped = alocat.greaterThan(total) ? total : alocat;
  const disponibil = total.minus(alocatCapped);
  const inner = [
    { name: 'Alocat', value: alocatCapped.toNumber(), kg: alocatCapped, color: '#111827' },
    { name: 'Disponibil', value: disponibil.toNumber(), kg: disponibil, color: '#d1d5db' },
  ];

  return (
    <div className="relative h-[260px] w-[260px] shrink-0">
      {total.isZero() ? (
        <div className="flex h-full items-center justify-center rounded-full border-[18px] border-gray-100 text-center text-sm text-gray-500">
          Nimic colectat
          <br />
          în perioadă
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { cod?: string; name?: string; kg: Decimal };
                const label = p.cod ? `${p.cod} · ${CATEGORY_STYLE[p.cod]?.scurt ?? ''}` : p.name;
                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="tabular text-gray-700">
                      {fmtKg(p.kg)} kg · {fmtPct(p.kg.div(total))}
                    </div>
                  </div>
                );
              }}
            />
            <Pie data={outer} dataKey="value" innerRadius={88} outerRadius={124} paddingAngle={outer.length > 1 ? 0.8 : 0} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {outer.map((s) => (
                <Cell key={s.cod} fill={categoryColor(s.cod)} />
              ))}
            </Pie>
            <Pie data={inner} dataKey="value" innerRadius={72} outerRadius={82} stroke="#fff" strokeWidth={2} isAnimationActive={false} startAngle={90} endAngle={-270}>
              {inner.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
      {!total.isZero() && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[11px] tracking-wide text-gray-500 uppercase">Colectat</div>
          <div className="text-lg leading-tight font-bold text-gray-900 tabular">{fmtKg(total)}</div>
          <div className="text-xs text-gray-500">kg</div>
        </div>
      )}
    </div>
  );
}

export function DonutInnerLegend({ total, alocat }: { total: Decimal; alocat: Decimal }) {
  const a = alocat.greaterThan(total) ? total : alocat;
  return (
    <div className="mt-3 space-y-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm bg-gray-900" />
        <span className="text-gray-700">Alocat</span>
        <span className="ml-auto font-semibold tabular">{fmtKg(a)} kg</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" />
        <span className="text-gray-700">Încă disponibil</span>
        <span className="ml-auto font-semibold tabular">{fmtKg(total.minus(a))} kg</span>
      </div>
    </div>
  );
}
