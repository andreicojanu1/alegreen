import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { allocate } from './allocate';
import { applyAdjustments, type ManualAdjustment } from './adjustments';
import { buildEngineInput } from '../data/engineInput';
import { DEFAULT_CATEGORY_RULES } from '../data/categories';
import { seedClients, seedCollected, seedDeclarationLines } from '../data/seed/excelData';
import type { AllocationRun } from '../data/types';

const run: AllocationRun = {
  id: 'a', anObligatie: 2026, deLa: { an: 2026, luna: 7 }, panaLa: { an: 2026, luna: 8 }, baza: 'declaratii_an_curent',
  rataEfectiva: '0.2167', pragMinimImplicit: '0.3', observatii: '', luna: 8, context: { raportatAnterior: [], ajustariAnterioare: [] }, status: 'draft', reguli: DEFAULT_CATEGORY_RULES,
  snapshot: { clienti: seedClients, declaratii: seedDeclarationLines, colectari: seedCollected }, creatDe: '', creatLa: '',
};
const base = allocate(buildEngineInput(run));
const ECO = 'cl_44814078';
const ATL = 'cl_45718753';
const row = (r: ReturnType<typeof applyAdjustments>, id: string, cat = '4B') => r.clienti.find((c) => c.clientId === id && c.categorie === cat)!;
const adj = (tip: ManualAdjustment['tip'], clientId: string, kg: string, id = `${tip}-${clientId}-${kg}`): ManualAdjustment => ({ id, tip, clientId, categorie: '4B', kg });

describe('ajustări manuale (ecranul de Revizuire)', () => {
  it('fără ajustări, rezultatul e identic cu al motorului', () => {
    const r = applyAdjustments(base, []);
    expect(r.clienti.map((c) => c.totalAlocat.toString())).toEqual(base.clienti.map((c) => c.totalAlocat.toString()));
    expect(r.poateFiTrimisa).toBe(true);
  });

  it('retragere: kg trec în disponibilul de realocat, cu proporția lunară a sursei; nu se poate trimite până nu se reatribuie', () => {
    const r = applyAdjustments(base, [adj('retragere', ECO, '1000')]);
    const eco0 = row(applyAdjustments(base, []), ECO);
    expect(row(r, ECO).totalAlocat.toString()).toBe(eco0.totalAlocat.minus(1000).toString());
    expect(r.disponibilRealocat['4B'].total.toString()).toBe('1000');
    const iulShare = eco0.alocatLuna['2026-07'].div(eco0.totalAlocat);
    expect(r.disponibilRealocat['4B'].luni['2026-07'].minus(iulShare.times(1000)).abs().lessThan(1e-9)).toBe(true);
    expect(r.verificariRevizuire.find((v) => v.cod === 'R-1')!.trecut).toBe(false);
    expect(r.poateFiTrimisa).toBe(false);
    expect(r.totaluri.totalAlocat.toString()).toBe(base.totaluri.totalAlocat.minus(1000).toString());
  });

  it('mutare completă în aceeași categorie: totalul categoriei se păstrează, invarianții trec', () => {
    const r = applyAdjustments(base, [adj('retragere', ECO, '1000'), adj('atribuire', ATL, '1000')]);
    expect(row(r, ATL).totalAlocat.minus(row(applyAdjustments(base, []), ATL).totalAlocat).toString()).toBe('1000');
    expect(row(r, ATL).totalInitial).toBeDefined();
    const sum4B = r.clienti.filter((c) => c.categorie === '4B').reduce((a, c) => a.plus(c.totalAlocat), new Decimal(0));
    expect(sum4B.minus(base.categorii.find((c) => c.cod === '4B')!.totalAlocat).abs().lessThan(1e-9)).toBe(true);
    for (const i of r.invarianti) expect(i.trecut, i.cod).toBe(true);
    expect(r.poateFiTrimisa).toBe(true);
    // procentul de îndeplinire nu mai e identic în categorie
    expect(row(r, ATL).procentIndeplinire.greaterThan(row(r, ECO).procentIndeplinire)).toBe(true);
    // lunile clientului se închid pe total (afișare)
    const c = row(r, ATL);
    expect(Object.values(c.afisare.alocatLuna).reduce((a, v) => a.plus(v), new Decimal(0)).toFixed(2)).toBe(c.afisare.totalAlocat.toFixed(2));
  });

  it('plafon: un client nu poate depăși obligația (capacitatea ATLANTIS în 4B ≈ 5.309,12 kg)', () => {
    const r = applyAdjustments(base, [adj('retragere', ECO, '6000'), adj('atribuire', ATL, '6000')]);
    expect(r.erori).toHaveLength(1);
    expect(r.erori[0].mesaj).toMatch(/obligația/);
    expect(r.poateFiTrimisa).toBe(false);
  });

  it('nu se poate atribui mai mult decât e disponibil și nici retrage mai mult decât are clientul', () => {
    expect(applyAdjustments(base, [adj('atribuire', ATL, '1')]).erori).toHaveLength(1);
    const ria = base.clienti.find((c) => c.categorie === '4B' && c.clientId === 'cl_34184455')!; // IHUNT, 56,21 kg
    expect(applyAdjustments(base, [adj('retragere', ria.clientId, '100')]).erori).toHaveLength(1);
  });
});
