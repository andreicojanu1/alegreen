import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { allocate } from './allocate';
import type { AllocationInput, CategoryResult, EngineCategory } from './types';
import { fmtPct } from '../lib/format';
import { buildEngineInput } from '../data/engineInput';
import { DEFAULT_CATEGORY_RULES } from '../data/categories';
import { seedClients, seedCollected, seedDeclarationLines } from '../data/seed/excelData';
import type { AllocationRun } from '../data/types';

/**
 * Setul golden din brief §14 (portofoliul real la 1 septembrie 2026): declarații februarie–iulie 2026,
 * colectare iulie + august 2026, rată 21,67%, prag minim 30%. Toleranță: 0,01 kg (AC-01).
 * Valorile așteptate sunt copiate din brief, NU calculate de motor.
 */

const TOL = 0.01;
const close = (actual: Decimal, expected: number, label: string) => {
  const diff = actual.minus(expected).abs();
  expect(diff.lessThanOrEqualTo(TOL), `${label}: ${actual.toFixed(6)} vs ${expected}`).toBe(true);
};

const goldenRun: AllocationRun = {
  id: 'golden',
  anObligatie: 2026,
  deLa: { an: 2026, luna: 7 },
  panaLa: { an: 2026, luna: 8 },
  baza: 'declaratii_an_curent',
  rataEfectiva: '0.2167',
  pragMinimImplicit: '0.3',
  observatii: '',
  luna: 8,
  context: { raportatAnterior: [], ajustariAnterioare: [] },
  status: 'draft',
  reguli: DEFAULT_CATEGORY_RULES,
  snapshot: { clienti: seedClients, declaratii: seedDeclarationLines, colectari: seedCollected },
  creatDe: 'test',
  creatLa: '2026-09-01T00:00:00Z',
};

const run = (r: AllocationRun = goldenRun) => allocate(buildEngineInput(r));
const cat = (res: ReturnType<typeof allocate>, cod: string) => res.categorii.find((c) => c.cod === cod)!;

describe('§14.1 — intrări (datele reale extrase din Excel)', () => {
  const res = run();
  it.each([
    ['2', 977.73, 30, 10],
    ['3', 301.82, 50, 20],
    ['4', 1620533.49, 1200000, 200000],
    ['5', 342940.56, 130000, 50000],
    ['6', 8339.5, 1300, 500],
    ['4B', 16040907, 2000000, 300000],
  ])('categoria %s: declarat și colectat pe luni', (cod, declarat, iul, aug) => {
    const c = cat(res, cod);
    close(c.declarat, declarat, 'declarat');
    close(c.colectatLuna['2026-07'], iul, 'colectat iulie');
    close(c.colectatLuna['2026-08'], aug, 'colectat august');
  });
  it('totaluri', () => {
    close(res.totaluri.declarat, 18014000.1, 'declarat total');
    close(res.totaluri.colectatLuna['2026-07'], 3331380, 'colectat iulie');
    close(res.totaluri.colectatLuna['2026-08'], 550530, 'colectat august');
  });
});

describe('§14.2 — ieșiri pe categorii', () => {
  const res = run();
  // cod, obligație, min. propriu, utilizat propriu, surplus, alocat din pool, total alocat, % îndeplinire
  const rows: [string, number, number, number, number, number, number, string][] = [
    ['2', 211.87, 63.56, 40.0, 0.0, 148.31, 188.31, '88,88%'],
    ['3', 65.4, 65.4, 65.4, 4.6, 0.0, 65.4, '100,00%'],
    ['4', 351169.61, 105350.88, 351169.61, 1048830.39, 0.0, 351169.61, '100,00%'],
    ['5', 74315.22, 22294.57, 74315.22, 105684.78, 0.0, 74315.22, '100,00%'],
    ['6', 1807.17, 542.15, 1800.0, 0.0, 7.17, 1807.17, '100,00%'],
    ['4B', 3476064.55, 0.0, 2300000.0, 0.0, 1154364.29, 3454364.29, '99,38%'],
  ];
  it.each(rows)('categoria %s', (cod, obl, min, util, surplus, pool, total, pct) => {
    const c: CategoryResult = cat(res, cod);
    close(c.obligatie, obl, 'obligație');
    close(c.minimPropriu, min, 'minim propriu');
    close(c.utilizatPropriu, util, 'utilizat propriu');
    close(c.surplus, surplus, 'surplus');
    close(c.alocatPool, pool, 'alocat din pool');
    close(c.totalAlocat, total, 'total alocat');
    expect(fmtPct(c.procentIndeplinire)).toBe(pct);
  });
  it('rândul TOTAL', () => {
    const t = res.totaluri;
    close(t.obligatie, 3903633.82, 'obligație');
    close(t.minimPropriu, 128316.57, 'minim propriu');
    close(t.utilizatPropriu, 2727390.23, 'utilizat propriu');
    close(t.surplus, 1154519.77, 'surplus');
    close(t.alocatPool, 1154519.77, 'alocat din pool');
    close(t.totalAlocat, 3881910.0, 'total alocat');
    expect(fmtPct(t.procentIndeplinire)).toBe('99,44%');
  });
});

describe('§14.3 — defalcare lunară', () => {
  const res = run();
  it('pool total și cota lunii iulie', () => {
    close(res.poolTotal, 1154519.77, 'pool total');
    const iul = res.luniPool.find((l) => l.key === '2026-07')!;
    close(iul.surplusLuna, 975328.66, 'pool constituit în iulie');
    expect(fmtPct(iul.cotaPool)).toBe('84,48%');
  });
  it('total alocat pe luni', () => {
    close(res.totaluri.alocatLuna['2026-07'], 3331380.0, 'alocat iulie');
    close(res.totaluri.alocatLuna['2026-08'], 550530.0, 'alocat august');
  });
  it('categoria 2 și 4B pe luni', () => {
    close(cat(res, '2').alocatLuna['2026-07'], 155.29, 'cat. 2 iulie');
    close(cat(res, '2').alocatLuna['2026-08'], 33.02, 'cat. 2 august');
    close(cat(res, '4B').alocatLuna['2026-07'], 2975197.31, 'cat. 4B iulie');
    close(cat(res, '4B').alocatLuna['2026-08'], 479166.98, 'cat. 4B august');
  });
});

describe('§14.4 — verificări punctuale pe clienți', () => {
  const res = run();
  const byName = (name: string, cod: string) => {
    const client = seedClients.find((c) => c.denumire === name)!;
    return res.clienti.find((r) => r.clientId === client.id && r.categorie === cod)!;
  };
  it.each([
    ['NOVO BRANDS SRL', '2', '100,00%', 188.31, '88,88%'],
    ['SC SPOT VISION LIGHTING DISTRIBUTION SRL', '3', '79,26%', 51.84, '100,00%'],
    ['BEKO ROMANIA S.A.', '4', '94,86%', 333130.57, '100,00%'],
    ['Elbi Electric & Lighting SRL', '5', '83,20%', 61830.31, '100,00%'],
    ['IHUNT TECHNOLOGY IMPORT-EXPORT S.A', '6', '100,00%', 1807.17, '100,00%'],
    ['ECO SUN NICULESTI S.R.L.', '4B', '67,25%', 2323036.3, '99,38%'],
  ] as const)('%s (cat. %s)', (name, cod, cota, total, pct) => {
    const r = byName(name, cod);
    expect(fmtPct(r.cotaCategorie)).toBe(cota);
    close(r.totalAlocat, total, 'total alocat');
    expect(fmtPct(r.procentIndeplinire)).toBe(pct);
  });
});

describe('§14.5 — criterii de acceptanță ale motorului', () => {
  it('AC-02: categoria 2 rămâne la 88,88% deși pool-ul depășește cu mult necesarul (RB-06)', () => {
    const res = run();
    expect(res.poolTotal.greaterThan(1_150_000)).toBe(true);
    expect(fmtPct(cat(res, '2').procentIndeplinire)).toBe('88,88%');
    expect(res.avertizari.some((a) => a.cod === 'A-01' && a.categorie === '2')).toBe(true);
  });

  it('AC-03: categoria 3 nu primește nimic din pool, oricât de mare ar fi', () => {
    // lămpi colectate sub obligație, pool uriaș
    const r: AllocationRun = {
      ...goldenRun,
      snapshot: {
        ...goldenRun.snapshot,
        colectari: goldenRun.snapshot.colectari.map((c) =>
          c.categorie === '3' ? { ...c, cantitateKg: '10' } : c.categorie === '4' ? { ...c, cantitateKg: '9000000' } : c,
        ),
      },
    };
    const res = run(r);
    expect(cat(res, '3').alocatPool.isZero()).toBe(true);
    close(cat(res, '3').totalAlocat, 20, 'cat. 3 = doar colectatul propriu');
  });

  it('AC-04: ordinea pool-ului schimbă rezultatul doar când pool-ul e insuficient', () => {
    const reorder = (r: AllocationRun): AllocationRun => ({
      ...r,
      reguli: r.reguli.map((x) => (x.cod === '4B' ? { ...x, ordineAlocare: 1 } : x)),
    });
    // insuficient (setul golden): 4B servit primul consumă pool-ul înaintea categoriilor 2 și 6
    const a = run();
    const b = run(reorder(goldenRun));
    expect(cat(a, '2').totalAlocat.equals(cat(b, '2').totalAlocat)).toBe(false);
    // suficient: pool mare -> rezultat identic
    const plenty: AllocationRun = {
      ...goldenRun,
      snapshot: {
        ...goldenRun.snapshot,
        colectari: goldenRun.snapshot.colectari.map((c) => (c.categorie === '4' ? { ...c, cantitateKg: '5000000' } : c)),
      },
    };
    const c = run(plenty);
    const d = run(reorder(plenty));
    for (const x of c.categorii) expect(x.totalAlocat.equals(cat(d, x.cod).totalAlocat)).toBe(true);
  });

  it('AC-05: toți invarianții I-1 … I-6 trec pe setul golden', () => {
    const res = run();
    expect(res.invarianti.map((i) => i.cod)).toEqual(['I-1', 'I-2', 'I-3', 'I-4', 'I-5', 'I-6']);
    for (const i of res.invarianti) expect(i.trecut, i.cod).toBe(true);
    expect(res.finalizabil).toBe(true);
  });

  it('AC-09: idempotență — aceleași intrări, rezultat bit-identic', () => {
    const ser = (x: unknown) => JSON.stringify(x);
    expect(ser(run())).toBe(ser(run()));
  });

  it('AC-10: clientul marcat este_test nu apare în rezultat (+ avertizarea A-05)', () => {
    const r: AllocationRun = {
      ...goldenRun,
      snapshot: {
        ...goldenRun.snapshot,
        clienti: goldenRun.snapshot.clienti.map((c) => (c.denumire === 'Exemplu' ? { ...c, esteTest: true } : c)),
      },
    };
    const res = run(r);
    expect(res.clienti.some((c) => c.clientId === 'cl_28736322')).toBe(false);
    close(cat(res, '4').declarat, 1620497.49, 'declarat cat. 4 fără Exemplu');
    expect(res.avertizari.find((a) => a.cod === 'A-05')?.mesaj).toBe('1 clienți de test au fost excluși din calcul.');
  });

  it('A-04: liniile cu bucăți > 0 și greutate 0 sunt semnalate', () => {
    const a04 = run().avertizari.find((a) => a.cod === 'A-04');
    expect(a04?.mesaj).toBe(
      '5 linii de raportare au greutate zero și nu contribuie la obligație. Verificați clienții: CATE-N LUNA SI-N STELE SRL.',
    );
  });

  it('rotunjire §7: suma alocărilor afișate pe clienți = totalul afișat al categoriei', () => {
    const res = run();
    for (const c of res.categorii) {
      const rows = res.clienti.filter((r) => r.categorie === c.cod);
      const s = rows.reduce((a, r) => a.plus(r.afisare.totalAlocat), new Decimal(0));
      expect(s.toFixed(2)).toBe(c.totalAlocat.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2));
    }
  });

  it('rotunjire: lunile afișate ale fiecărui client se închid pe totalul lui afișat', () => {
    const res = run();
    for (const c of res.clienti) {
      const s = Object.values(c.afisare.alocatLuna).reduce((a, v) => a.plus(v), new Decimal(0));
      expect(s.toFixed(2)).toBe(c.afisare.totalAlocat.toFixed(2));
    }
  });
});

describe('Foaia „Exemplu regulă" — client cu 100 kg declarate', () => {
  const categorii: EngineCategory[] = [
    { cod: '3', pragMinimPropriu: 1, plafonSubstitutie: 0, ordineAlocare: 20, activ: true },
    { cod: '2', pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 10, activ: true },
    { cod: '4', pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 30, activ: true },
    { cod: '5', pragMinimPropriu: '0.3', plafonSubstitutie: '0.7', ordineAlocare: 40, activ: true },
    { cod: '4B', pragMinimPropriu: 0, plafonSubstitutie: 1, ordineAlocare: 60, activ: true },
  ];
  const input: AllocationInput = {
    anObligatie: 2026,
    rataEfectiva: '0.2167',
    categorii,
    clienti: [{ id: 'x', denumire: 'Client exemplu', esteTest: false }],
    declaratii: [
      { clientId: 'x', categorie: '3', greutateKg: 20 },
      { clientId: 'x', categorie: '2', greutateKg: 20 },
      { clientId: 'x', categorie: '4', greutateKg: 40 },
      { clientId: 'x', categorie: '5', greutateKg: 10 },
      { clientId: 'x', categorie: '4B', greutateKg: 10 },
    ],
    colectari: [],
    luni: [{ an: 2026, luna: 7 }],
  };
  const res = allocate(input);
  // cod, obligație, minim propriu, „poate fi din orice categorie" (valorile exacte din foaia Excel)
  it.each([
    ['3', '4.334', '4.334', '0'],
    ['2', '4.334', '1.3002', '3.0338'],
    ['4', '8.668', '2.6004', '6.0676'],
    ['5', '2.167', '0.6501', '1.5169'],
    ['4B', '2.167', '0', '2.167'],
  ])('categoria %s', (cod, obl, min, orice) => {
    const c = cat(res, cod);
    expect(c.obligatie.toString()).toBe(obl);
    expect(c.minimPropriu.toString()).toBe(min);
    expect(c.plafon.toString()).toBe(orice);
  });
  it('TOTAL: 100 kg -> 21,67 kg obligație, 8,8847 kg minim propriu, 12,7853 kg din orice categorie', () => {
    expect(res.totaluri.declarat.toString()).toBe('100');
    expect(res.totaluri.obligatie.toString()).toBe('21.67');
    expect(res.totaluri.minimPropriu.toString()).toBe('8.8847');
    expect(res.categorii.reduce((a, c) => a.plus(c.plafon), new Decimal(0)).toString()).toBe('12.7853');
  });
});
