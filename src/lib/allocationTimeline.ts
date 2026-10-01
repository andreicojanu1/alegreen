import type { MonthlyResult } from '../engine/monthly';

/**
 * Cronologia animației „live" a unei sesiuni lunare, derivată din rezultatul FINAL — nu recalculează nimic.
 * Lunile deja raportate apar direct ca încheiate (valori înghețate). Luna curentă se derulează categorie cu categorie,
 * în ordinea pool-ului: întâi partea acoperită din colectatul propriu, apoi partea din pool.
 * Împărțirea lunii între „propriu" și „pool": partea proprie = creșterea colectatului propriu utilizat față de lunile
 * anterioare (min(colectat propriu ian–M−1, obligație)), plafonată la totalul lunii; restul vine din pool.
 * Cantitățile sunt number DOAR pentru interpolarea vizuală; la final se afișează valorile exacte.
 */
export interface TimelineStep {
  monthKey: string;
  cod: string;
  faza: 'propriu' | 'pool';
  kg: number;
}

export interface Timeline {
  steps: TimelineStep[];
  lunaCurenta: string;
  /** kg pe (categorie|lună) pentru lunile anterioare (înghețate) */
  baseline: Map<string, number>;
  luniCuAlocari: Set<string>;
}

export function buildTimeline(res: MonthlyResult): Timeline {
  const M = res.lunaCurenta;
  const steps: TimelineStep[] = [];
  const baseline = new Map<string, number>();
  const luniCuAlocari = new Set<string>();
  const own: TimelineStep[] = [];
  const pool: TimelineStep[] = [];
  for (const c of res.categorii) {
    for (const [k, v] of Object.entries(c.alocatLuna)) {
      if (k < M) {
        baseline.set(`${c.cod}|${k}`, v.toNumber());
        if (v.greaterThan(0)) luniCuAlocari.add(k);
      }
    }
    const monthTotal = c.alocatLuna[M]?.toNumber() ?? 0;
    if (monthTotal <= 0) continue;
    const colectatAnterior = Object.entries(c.colectatLuna).reduce((a, [k, v]) => (k < M ? a + v.toNumber() : a), 0);
    const propriuAnterior = Math.min(colectatAnterior, c.obligatie.toNumber());
    const ownPart = Math.min(monthTotal, Math.max(0, c.utilizatPropriu.toNumber() - propriuAnterior));
    if (ownPart > 0) own.push({ monthKey: M, cod: c.cod, faza: 'propriu', kg: ownPart });
    if (monthTotal - ownPart > 1e-9) pool.push({ monthKey: M, cod: c.cod, faza: 'pool', kg: monthTotal - ownPart });
  }
  steps.push(...own, ...pool);
  if (steps.length) luniCuAlocari.add(M);
  return { steps, lunaCurenta: M, baseline, luniCuAlocari };
}

export type MonthState = 'empty' | 'pending' | 'active' | 'done';

/** Starea animației la „timpul" t ∈ [0, steps.length] (partea întreagă = pași încheiați, fracția = pasul curent). */
export interface PlaybackView {
  done: boolean;
  /** kg alocate până acum pentru (categorie, lună) */
  catMonth: (cod: string, key: string) => number;
  /** kg alocate până acum în luna curentă, pe categorie și fază */
  catPhase: (cod: string, faza: 'propriu' | 'pool') => number;
  /** kg din luna curentă încă nederulate, pe categorie și fază */
  catPhaseRemaining: (cod: string, faza: 'propriu' | 'pool') => number;
  monthState: (key: string) => MonthState;
  current?: TimelineStep;
  /** kg alocate până acum în luna curentă */
  totalLuna: number;
}

export function viewAt(tl: Timeline, t: number): PlaybackView {
  const { steps } = tl;
  const done = t >= steps.length;
  const acc = new Map<string, number>();
  const phase = new Map<string, number>();
  let total = 0;
  const whole = Math.floor(t);
  for (let i = 0; i < steps.length && i <= whole; i++) {
    const frac = i < whole ? 1 : t - whole;
    if (frac <= 0) break;
    const s = steps[i];
    const v = s.kg * frac;
    acc.set(s.cod, (acc.get(s.cod) ?? 0) + v);
    phase.set(`${s.cod}|${s.faza}`, (phase.get(`${s.cod}|${s.faza}`) ?? 0) + v);
    total += v;
  }
  return {
    done,
    current: done ? undefined : steps[Math.min(whole, steps.length - 1)],
    totalLuna: total,
    catMonth: (cod, key) => (key === tl.lunaCurenta ? (acc.get(cod) ?? 0) : (tl.baseline.get(`${cod}|${key}`) ?? 0)),
    catPhase: (cod, faza) => phase.get(`${cod}|${faza}`) ?? 0,
    catPhaseRemaining: (cod, faza) => {
      const full = steps.filter((s) => s.cod === cod && s.faza === faza).reduce((a, s) => a + s.kg, 0);
      return Math.max(0, full - (phase.get(`${cod}|${faza}`) ?? 0));
    },
    monthState: (key) => {
      if (key < tl.lunaCurenta) return tl.luniCuAlocari.has(key) ? 'done' : 'empty';
      if (key > tl.lunaCurenta || !steps.length) return 'empty';
      if (done) return 'done';
      return t > 0 ? 'active' : 'pending';
    },
  };
}
