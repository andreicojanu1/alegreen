import { describe, expect, it } from 'vitest';
import { buildSeedRuns } from '../data/sessions';
import { runResult } from '../data/useRunResult';
import { buildTimeline, viewAt } from './allocationTimeline';

const runs = buildSeedRuns();
const aug = runs.find((r) => r.luna === 8)!;
const res = runResult(aug);
const tl = buildTimeline(res);

describe('cronologia animației unei sesiuni lunare (august 2026)', () => {
  it('doar luna curentă se derulează: întâi propriu, apoi pool, în ordinea pool-ului', () => {
    expect(tl.steps.every((s) => s.monthKey === '2026-08' && s.kg > 0)).toBe(true);
    const firstPool = tl.steps.findIndex((s) => s.faza === 'pool');
    expect(firstPool).toBeGreaterThan(0);
    expect(tl.steps.slice(firstPool).every((s) => s.faza === 'pool')).toBe(true);
  });
  it('la final, totalul pe categorie și lună coincide cu rezultatul sesiunii', () => {
    const v = viewAt(tl, tl.steps.length);
    for (const c of res.categorii) {
      expect(Math.abs(v.catMonth(c.cod, '2026-08') - c.alocatLuna['2026-08'].toNumber())).toBeLessThan(1e-6);
      expect(Math.abs(v.catMonth(c.cod, '2026-07') - c.alocatLuna['2026-07'].toNumber())).toBeLessThan(1e-6);
    }
    expect(Math.abs(v.totalLuna - res.totalLuna.toNumber())).toBeLessThan(1e-6);
  });
  it('stările lunilor: iulie (raportată) = done, martie (fără alocări) = empty, august = active în timpul derulării', () => {
    const v = viewAt(tl, 1.5);
    expect(v.monthState('2026-07')).toBe('done');
    expect(v.monthState('2026-03')).toBe('empty');
    expect(v.monthState('2026-08')).toBe('active');
    expect(v.catMonth('4', '2026-07')).toBeGreaterThan(0);
  });
});
