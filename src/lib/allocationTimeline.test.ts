import { describe, expect, it } from 'vitest';
import { allocate } from '../engine/allocate';
import { buildEngineInput } from '../data/engineInput';
import { DEFAULT_CATEGORY_RULES } from '../data/categories';
import { seedClients, seedCollected, seedDeclarationLines } from '../data/seed/excelData';
import type { AllocationRun } from '../data/types';
import { buildTimeline, viewAt } from './allocationTimeline';

const run: AllocationRun = {
  id: 't', anObligatie: 2026, deLa: { an: 2026, luna: 1 }, panaLa: { an: 2026, luna: 9 }, baza: 'declaratii_an_curent',
  rataEfectiva: '0.2167', pragMinimImplicit: '0.3', observatii: '', status: 'draft', reguli: DEFAULT_CATEGORY_RULES,
  snapshot: { clienti: seedClients, declaratii: seedDeclarationLines, colectari: seedCollected }, creatDe: '', creatLa: '',
};
const res = allocate(buildEngineInput(run));
const steps = buildTimeline(res);

describe('cronologia animației (M4)', () => {
  it('ordinea: lună cu lună, întâi propriu apoi pool, în ordinea pool-ului', () => {
    expect(steps[0]).toMatchObject({ monthKey: '2026-07', faza: 'propriu', cod: '2' });
    const iul = steps.filter((s) => s.monthKey === '2026-07');
    const firstPool = iul.findIndex((s) => s.faza === 'pool');
    expect(iul.slice(firstPool).every((s) => s.faza === 'pool')).toBe(true);
    expect(iul.filter((s) => s.faza === 'pool').map((s) => s.cod)).toEqual(['2', '6', '4B']);
    expect(steps.every((s) => s.kg > 0)).toBe(true);
  });
  it('la final, valorile animate coincid cu rezultatul motorului', () => {
    const v = viewAt(steps, steps.length);
    expect(v.done).toBe(true);
    for (const c of res.categorii)
      for (const k of Object.keys(c.alocatLuna)) expect(Math.abs(v.catMonth(c.cod, k) - c.alocatLuna[k].toNumber())).toBeLessThan(1e-6);
    expect(Math.abs(v.totalAlocat - res.totaluri.totalAlocat.toNumber())).toBeLessThan(1e-6);
  });
  it('stările lunilor: fără colectat = empty; în curs = active', () => {
    const v = viewAt(steps, 1.5);
    expect(v.monthState('2026-03')).toBe('empty');
    expect(v.monthState('2026-07')).toBe('active');
    expect(v.monthState('2026-08')).toBe('pending');
    expect(viewAt(steps, 0).monthState('2026-07')).toBe('active');
  });
});
