import type { AllocationResult } from '../engine/types';
import { monthKey } from '../engine/months';

/**
 * Cronologia animației „live" (M4), derivată din rezultatul FINAL al motorului — nu recalculează nimic.
 * Ordinea pașilor: lună cu lună; în fiecare lună, întâi colectatul propriu pe categorii (în ordinea pool-ului),
 * apoi partea din pool pe categorii, în ordinea configurată. Pașii cu cantitate zero sunt omiși.
 * Cantitățile sunt convertite în number DOAR pentru interpolarea vizuală; la final se afișează valorile exacte.
 */
export interface TimelineStep {
  monthKey: string;
  cod: string;
  faza: 'propriu' | 'pool';
  kg: number;
}

export function buildTimeline(res: AllocationResult): TimelineStep[] {
  const steps: TimelineStep[] = [];
  for (const m of res.luni) {
    const key = monthKey(m);
    for (const faza of ['propriu', 'pool'] as const) {
      for (const c of res.categorii) {
        const v = faza === 'propriu' ? c.propriuLuna[key] : c.poolLuna[key];
        if (v.greaterThan(0)) steps.push({ monthKey: key, cod: c.cod, faza, kg: v.toNumber() });
      }
    }
  }
  return steps;
}

export type MonthState = 'empty' | 'pending' | 'active' | 'done';

/** Starea animației la „timpul" t ∈ [0, steps.length] (partea întreagă = pași încheiați, fracția = pasul curent). */
export interface PlaybackView {
  done: boolean;
  /** kg alocate până acum pentru (categorie, lună) */
  catMonth: (cod: string, key: string) => number;
  monthState: (key: string) => MonthState;
  current?: TimelineStep;
  totalAlocat: number;
}

export function viewAt(steps: TimelineStep[], t: number): PlaybackView {
  const done = t >= steps.length;
  const acc = new Map<string, number>();
  const monthsWithSteps = new Set(steps.map((s) => s.monthKey));
  const lastIdxOfMonth = new Map<string, number>();
  const firstIdxOfMonth = new Map<string, number>();
  steps.forEach((s, i) => {
    lastIdxOfMonth.set(s.monthKey, i);
    if (!firstIdxOfMonth.has(s.monthKey)) firstIdxOfMonth.set(s.monthKey, i);
  });
  let total = 0;
  const whole = Math.floor(t);
  for (let i = 0; i < steps.length && i <= whole; i++) {
    const frac = i < whole ? 1 : t - whole;
    if (frac <= 0) break;
    const s = steps[i];
    const k = `${s.cod}|${s.monthKey}`;
    const v = s.kg * frac;
    acc.set(k, (acc.get(k) ?? 0) + v);
    total += v;
  }
  const current = done ? undefined : steps[Math.min(whole, steps.length - 1)];
  return {
    done,
    current,
    totalAlocat: total,
    catMonth: (cod, key) => acc.get(`${cod}|${key}`) ?? 0,
    monthState: (key) => {
      if (!monthsWithSteps.has(key)) return 'empty';
      if (done || t >= lastIdxOfMonth.get(key)! + 1) return 'done';
      if (t >= firstIdxOfMonth.get(key)!) return 'active';
      return 'pending';
    },
  };
}
