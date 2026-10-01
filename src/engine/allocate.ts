import Decimal from 'decimal.js';
import { fmtKg, fmtPct, fmtNum } from '../lib/format';
import { monthKey } from './months';
import { reconcileRounded } from './rounding';
import type {
  AllocationInput,
  AllocationResult,
  AllocationWarning,
  CategoryResult,
  ClientResult,
  InvariantCheck,
  MonthMap,
  MonthPoolShare,
} from './types';

/**
 * Motorul de alocare DEEE — implementarea pseudocodului normativ din brief §6.2.
 * Funcție pură: aceleași intrări produc exact același rezultat (RB-14 / AC-09).
 * Aritmetică zecimală (decimal.js, 40 cifre semnificative), fără float și fără rotunjiri în lanțul de calcul (§7).
 */

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
type Dec = Decimal;
const ZERO = new D(0);
const ONE = new D(1);

const TOL_KG = new D('0.01');
const TOL_COTA = new D('0.000001');

const sum = (xs: Dec[]) => xs.reduce((a, b) => a.plus(b), ZERO);
const min = (...xs: Dec[]) => xs.reduce((a, b) => (b.lessThan(a) ? b : a));
const absMax = (xs: Dec[]) => xs.reduce((a, b) => (b.abs().greaterThan(a) ? b.abs() : a), ZERO);

function regulaAplicata(prag: Dec, plafon: Dec): string {
  if (prag.equals(ONE) && plafon.isZero()) return 'Doar categoria proprie (100%)';
  if (prag.isZero() && plafon.equals(ONE)) return 'Integral din orice categorie colectată';
  return `Min. ${fmtNum(prag.times(100), 0)}% din obligație cu propriu; max ${fmtNum(plafon.times(100), 0)}% din alte categorii`;
}

export function allocate(input: AllocationInput): AllocationResult {
  const rata = new D(input.rataEfectiva);
  const keys = input.luni.map(monthKey);
  const keySet = new Set(keys);
  const zeroMonths = (): MonthMap => Object.fromEntries(keys.map((k) => [k, ZERO]));

  const categorii = input.categorii
    .filter((c) => c.activ)
    .slice()
    .sort((a, b) => a.ordineAlocare - b.ordineAlocare);
  const catCodes = new Set(categorii.map((c) => c.cod));

  const clientById = new Map(input.clienti.map((c) => [c.id, c]));
  const isEligibleClient = (id: string) => clientById.get(id)?.esteTest !== true;

  // ---------- PAS 0 — AGREGARE ----------
  // declarat[client][cat]
  const declaratClient = new Map<string, Map<string, Dec>>(); // cat -> client -> kg
  for (const c of categorii) declaratClient.set(c.cod, new Map());
  for (const l of input.declaratii) {
    if (!catCodes.has(l.categorie) || !isEligibleClient(l.clientId)) continue;
    const m = declaratClient.get(l.categorie)!;
    m.set(l.clientId, (m.get(l.clientId) ?? ZERO).plus(new D(l.greutateKg)));
  }
  const colectatLuna = new Map<string, MonthMap>();
  for (const c of categorii) colectatLuna.set(c.cod, zeroMonths());
  for (const col of input.colectari) {
    const k = monthKey(col);
    if (!catCodes.has(col.categorie) || !keySet.has(k)) continue;
    const m = colectatLuna.get(col.categorie)!;
    m[k] = m[k].plus(new D(col.cantitateKg));
  }

  // ---------- PAS 1–4 ----------
  const rows: CategoryResult[] = categorii.map((c) => {
    const prag = new D(c.pragMinimPropriu);
    const plafonSub = new D(c.plafonSubstitutie);
    // RB-13: intră doar clienții cu declarat strict pozitiv
    const declarat = sum([...declaratClient.get(c.cod)!.values()].filter((v) => v.greaterThan(0)));
    const obligatie = declarat.times(rata);
    const minimPropriu = obligatie.times(prag);
    const cl = colectatLuna.get(c.cod)!;
    const colectat = sum(keys.map((k) => cl[k]));
    const utilizatPropriu = min(colectat, obligatie);
    const surplus = colectat.minus(utilizatPropriu);
    const necesarRamas = obligatie.minus(utilizatPropriu);
    const plafon = obligatie.times(plafonSub);
    return {
      cod: c.cod,
      ordineAlocare: c.ordineAlocare,
      pragMinimPropriu: prag,
      plafonSubstitutie: plafonSub,
      declarat,
      obligatie,
      minimPropriu,
      colectatLuna: cl,
      colectat,
      utilizatPropriu,
      surplus,
      necesarRamas,
      plafon,
      alocatPool: ZERO,
      poolRamasDupa: ZERO,
      totalAlocat: ZERO,
      procentIndeplinire: ZERO,
      propriuLuna: zeroMonths(),
      poolLuna: zeroMonths(),
      alocatLuna: zeroMonths(),
      regulaAplicata: regulaAplicata(prag, plafonSub),
    };
  });

  const avertizari: AllocationWarning[] = [];
  for (const r of rows) {
    if (r.colectat.lessThan(r.minimPropriu)) {
      avertizari.push({
        cod: 'A-01',
        categorie: r.cod,
        mesaj: `Categoria ${r.cod}: s-au colectat ${fmtKg(r.colectat)} kg din categoria proprie, față de minimul obligatoriu de ${fmtKg(r.minimPropriu)} kg. Diferența de ${fmtKg(r.minimPropriu.minus(r.colectat))} kg nu poate fi substituită din alte categorii.`,
      });
    }
  }

  // ---------- PAS 3 — POOL (constituit integral înainte de distribuire, RB-07) ----------
  const poolTotal = sum(rows.map((r) => r.surplus));
  let poolDisponibil = poolTotal;

  // ---------- PAS 5 — DISTRIBUIREA POOL-ULUI, în ordinea ordine_alocare ----------
  for (const r of rows) {
    r.alocatPool = min(r.necesarRamas, r.plafon, poolDisponibil);
    poolDisponibil = poolDisponibil.minus(r.alocatPool);
    r.poolRamasDupa = poolDisponibil;
    r.totalAlocat = r.utilizatPropriu.plus(r.alocatPool);
    r.procentIndeplinire = r.obligatie.isZero() ? ZERO : r.totalAlocat.div(r.obligatie);
  }
  for (const r of rows) {
    // Notă: A-02 se emite doar pentru categoriile cu obligație > 0 (o categorie fără declarații nu are ce acoperi).
    if (r.obligatie.greaterThan(0) && r.procentIndeplinire.lessThan(ONE)) {
      avertizari.push({
        cod: 'A-02',
        categorie: r.cod,
        mesaj: `Categoria ${r.cod} este acoperită în proporție de ${fmtPct(r.procentIndeplinire)}. Lipsesc ${fmtKg(r.obligatie.minus(r.totalAlocat))} kg.`,
      });
    }
  }
  if (poolDisponibil.greaterThan(0)) {
    avertizari.push({
      cod: 'A-03',
      mesaj: `Au rămas ${fmtKg(poolDisponibil)} kg colectate nealocate. Toate categoriile și-au atins plafoanele.`,
    });
  }

  // ---------- PAS 6 — DEFALCARE LUNARĂ PE CATEGORIE ----------
  const surplusLunaTotal: MonthMap = zeroMonths();
  for (const r of rows) {
    for (const k of keys) {
      const cota = r.colectat.isZero() ? ZERO : r.colectatLuna[k].div(r.colectat);
      r.propriuLuna[k] = r.utilizatPropriu.times(cota);
      surplusLunaTotal[k] = surplusLunaTotal[k].plus(r.surplus.times(cota));
    }
  }
  const luniPool: MonthPoolShare[] = keys.map((k) => ({
    key: k,
    surplusLuna: surplusLunaTotal[k],
    cotaPool: poolTotal.isZero() ? ZERO : surplusLunaTotal[k].div(poolTotal),
  }));
  for (const r of rows) {
    for (const lp of luniPool) {
      r.poolLuna[lp.key] = r.alocatPool.times(lp.cotaPool);
      r.alocatLuna[lp.key] = r.propriuLuna[lp.key].plus(r.poolLuna[lp.key]);
    }
  }

  // ---------- PAS 7 — REPARTIZAREA PE CLIENȚI ----------
  const clienti: ClientResult[] = [];
  for (const r of rows) {
    const entries = [...declaratClient.get(r.cod)!.entries()]
      .filter(([, v]) => v.greaterThan(0))
      .sort((a, b) => b[1].comparedTo(a[1]) || a[0].localeCompare(b[0]));
    const catClients: ClientResult[] = entries.map(([clientId, declarat]) => {
      const cota = declarat.div(r.declarat);
      const alocatLuna: MonthMap = {};
      for (const k of keys) alocatLuna[k] = r.alocatLuna[k].times(cota);
      return {
        clientId,
        categorie: r.cod,
        declarat,
        obligatie: declarat.times(rata),
        cotaCategorie: cota,
        totalAlocat: r.totalAlocat.times(cota),
        procentIndeplinire: r.procentIndeplinire,
        alocatLuna,
        afisare: { totalAlocat: ZERO, alocatLuna: {} },
      };
    });
    // PAS 8 — rotunjire pentru afișare (§7): totalurile clienților se reconciliază cu totalul categoriei
    // (reziduul la clientul cu cota cea mai mare); lunile fiecărui client se reconciliază cu totalul lui afișat
    // (reziduul la luna cu alocarea cea mai mare), ca rândul clientului să se închidă exact.
    const tot = reconcileRounded(
      r.totalAlocat,
      catClients.map((c) => ({ value: c.totalAlocat, cota: c.cotaCategorie })),
    );
    catClients.forEach((c, i) => {
      c.afisare.totalAlocat = tot[i];
      const vals = reconcileRounded(
        tot[i],
        keys.map((k) => ({ value: c.alocatLuna[k], cota: c.alocatLuna[k] })),
        false,
      );
      keys.forEach((k, j) => (c.afisare.alocatLuna[k] = vals[j]));
    });
    clienti.push(...catClients);
  }

  // A-04 / A-05 — calitatea datelor de intrare
  const zeroLines = input.declaratii.filter(
    (l) => catCodes.has(l.categorie) && isEligibleClient(l.clientId) && new D(l.greutateKg).isZero() && (l.bucati ?? 0) > 0,
  );
  if (zeroLines.length > 0) {
    const names = [...new Set(zeroLines.map((l) => clientById.get(l.clientId)?.denumire ?? l.clientId))];
    avertizari.push({
      cod: 'A-04',
      mesaj: `${zeroLines.length} linii de raportare au greutate zero și nu contribuie la obligație. Verificați clienții: ${names.join(', ')}.`,
    });
  }
  const testClients = new Set(
    input.declaratii.filter((l) => clientById.get(l.clientId)?.esteTest === true).map((l) => l.clientId),
  );
  if (testClients.size > 0) {
    avertizari.push({ cod: 'A-05', mesaj: `${testClients.size} clienți de test au fost excluși din calcul.` });
  }

  // ---------- TOTALURI ----------
  const monthSum = (pick: (r: CategoryResult) => MonthMap): MonthMap =>
    Object.fromEntries(keys.map((k) => [k, sum(rows.map((r) => pick(r)[k]))]));
  const totaluri = {
    declarat: sum(rows.map((r) => r.declarat)),
    obligatie: sum(rows.map((r) => r.obligatie)),
    minimPropriu: sum(rows.map((r) => r.minimPropriu)),
    colectat: sum(rows.map((r) => r.colectat)),
    colectatLuna: monthSum((r) => r.colectatLuna),
    utilizatPropriu: sum(rows.map((r) => r.utilizatPropriu)),
    surplus: poolTotal,
    necesarRamas: sum(rows.map((r) => r.necesarRamas)),
    alocatPool: sum(rows.map((r) => r.alocatPool)),
    totalAlocat: sum(rows.map((r) => r.totalAlocat)),
    alocatLuna: monthSum((r) => r.alocatLuna),
    procentIndeplinire: ZERO,
  };
  totaluri.procentIndeplinire = totaluri.obligatie.isZero() ? ZERO : totaluri.totalAlocat.div(totaluri.obligatie);

  // ---------- PAS 8 — INVARIANȚI (RB-12) ----------
  const i1 = totaluri.totalAlocat.minus(totaluri.colectat); // trebuie ≤ 0,01
  const i2Devs: Dec[] = [];
  for (const r of rows) i2Devs.push(sum(keys.map((k) => r.alocatLuna[k])).minus(r.totalAlocat));
  for (const c of clienti) i2Devs.push(sum(keys.map((k) => c.alocatLuna[k])).minus(c.totalAlocat));
  const i3Devs = rows.map((r) => r.totalAlocat.minus(r.obligatie)); // trebuie ≤ 0,01
  const i5Devs = rows.map((r) => sum(clienti.filter((c) => c.categorie === r.cod).map((c) => c.totalAlocat)).minus(r.totalAlocat));
  const i6Devs = rows
    .filter((r) => r.declarat.greaterThan(0))
    .map((r) => sum(clienti.filter((c) => c.categorie === r.cod).map((c) => c.cotaCategorie)).minus(ONE));

  const i3Max = i3Devs.reduce((a, b) => (b.greaterThan(a) ? b : a), new D(-Infinity));
  const invarianti: InvariantCheck[] = [
    {
      cod: 'I-1',
      descriere: 'Suma alocărilor pe categorii ≤ suma cantităților colectate',
      valoare: Decimal.max(i1, ZERO),
      toleranta: '0,01 kg',
      trecut: i1.lessThanOrEqualTo(TOL_KG),
    },
    {
      cod: 'I-2',
      descriere: 'Suma alocărilor lunare = totalul alocat (pe categorie și pe client)',
      valoare: absMax(i2Devs),
      toleranta: '0,01 kg',
      trecut: absMax(i2Devs).lessThanOrEqualTo(TOL_KG),
    },
    {
      cod: 'I-3',
      descriere: 'Totalul alocat ≤ obligația, pe fiecare categorie',
      valoare: rows.length ? Decimal.max(i3Max, ZERO) : ZERO,
      toleranta: '0,01 kg',
      trecut: !rows.length || i3Max.lessThanOrEqualTo(TOL_KG),
    },
    {
      cod: 'I-4',
      descriere: 'Pool-ul disponibil final ≥ 0',
      valoare: poolDisponibil.lessThan(0) ? poolDisponibil.abs() : ZERO,
      toleranta: 'strict',
      trecut: poolDisponibil.greaterThanOrEqualTo(0),
    },
    {
      cod: 'I-5',
      descriere: 'Suma alocărilor pe clienți = totalul alocat al categoriei',
      valoare: absMax(i5Devs),
      toleranta: '0,01 kg',
      trecut: absMax(i5Devs).lessThanOrEqualTo(TOL_KG),
    },
    {
      cod: 'I-6',
      descriere: 'Suma cotelor clienților dintr-o categorie = 1',
      valoare: absMax(i6Devs),
      toleranta: '0,000001',
      trecut: absMax(i6Devs).lessThanOrEqualTo(TOL_COTA),
    },
  ];

  return {
    anObligatie: input.anObligatie,
    rataEfectiva: rata,
    luni: input.luni,
    categorii: rows,
    clienti,
    poolTotal,
    poolRamas: poolDisponibil,
    luniPool,
    totaluri,
    reconciliere: {
      alocatMinusColectat: totaluri.totalAlocat.minus(totaluri.colectat),
      poolNeutilizat: poolDisponibil,
      luniMinusTotal: sum(keys.map((k) => totaluri.alocatLuna[k])).minus(totaluri.totalAlocat),
    },
    invarianti,
    avertizari,
    finalizabil: invarianti.every((i) => i.trecut),
  };
}
