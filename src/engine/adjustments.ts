import Decimal from 'decimal.js';
import { reconcileRounded } from './rounding';
import type { AllocationResult, ClientResult, InvariantCheck, MonthMap } from './types';

/**
 * Ajustările manuale din ecranul „Revizuire și confirmare" — funcție pură aplicată PESTE rezultatul motorului
 * (motorul golden rămâne neschimbat). Reguli confirmate de Alegreen (1 oct. 2026):
 *  - mutările se fac doar între clienții aceleiași categorii; totalul categoriei nu se schimbă;
 *  - „retragere" mută kg de la un client în „disponibil de realocat" al categoriei; „atribuire" le dă altui client;
 *  - lunile urmează proporțional sursa: retragerea preia proporția lunară a clientului, atribuirea pe cea a disponibilului;
 *  - un client nu poate depăși obligația lui în categorie;
 *  - rularea poate fi trimisă spre aprobare doar când disponibilul de realocat e 0 în toate categoriile.
 * Ajustările se aplică în ordine (jurnal), deci rezultatul e determinist (RB-14).
 */

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
const ZERO = new D(0);
const TOL = new D('0.01');
const EPS = new D('0.0000001');

export interface ManualAdjustment {
  id: string;
  tip: 'retragere' | 'atribuire';
  clientId: string;
  categorie: string;
  kg: Decimal.Value;
}

export interface ReviewCheck {
  cod: 'R-1' | 'R-2' | 'R-3' | 'R-4';
  descriere: string;
  valoare: Decimal;
  trecut: boolean;
}

export interface AdjustedResult extends AllocationResult {
  /** kg retrase și încă neatribuite, pe categorie (cu defalcarea lunară) */
  disponibilRealocat: Record<string, { total: Decimal; luni: MonthMap }>;
  ajustariAplicate: number;
  /** ajustări respinse (ex. peste obligație) — nu ar trebui să apară dacă UI-ul validează */
  erori: { id: string; mesaj: string }[];
  verificariRevizuire: ReviewCheck[];
  /** true dacă invarianții trec ȘI verificările de revizuire trec (condiție de trimitere spre aprobare) */
  poateFiTrimisa: boolean;
}

const sumMonths = (m: MonthMap) => Object.values(m).reduce((a, b) => a.plus(b), ZERO);

export function applyAdjustments(res: AllocationResult, ajustari: ManualAdjustment[]): AdjustedResult {
  const keys = Object.keys(res.categorii[0]?.alocatLuna ?? {});
  const state = new Map<string, { total: Decimal; luni: MonthMap; obligatie: Decimal }>();
  for (const c of res.clienti) state.set(`${c.clientId}|${c.categorie}`, { total: c.totalAlocat, luni: { ...c.alocatLuna }, obligatie: c.obligatie });
  const buffer: Record<string, { total: Decimal; luni: MonthMap }> = {};
  for (const c of res.categorii) buffer[c.cod] = { total: ZERO, luni: Object.fromEntries(keys.map((k) => [k, ZERO])) };

  const erori: { id: string; mesaj: string }[] = [];
  let aplicate = 0;
  for (const a of ajustari) {
    const s = state.get(`${a.clientId}|${a.categorie}`);
    const buf = buffer[a.categorie];
    const kg = new D(a.kg);
    if (!s || !buf || kg.lessThanOrEqualTo(0)) {
      erori.push({ id: a.id, mesaj: 'Ajustare invalidă (client sau categorie inexistentă, ori cantitate ≤ 0).' });
      continue;
    }
    if (a.tip === 'retragere') {
      if (kg.greaterThan(s.total.plus(EPS))) {
        erori.push({ id: a.id, mesaj: 'Se retrage mai mult decât are clientul alocat.' });
        continue;
      }
      const take = D.min(kg, s.total);
      const ratio = s.total.isZero() ? ZERO : take.div(s.total);
      for (const k of keys) {
        const m = s.luni[k].times(ratio);
        s.luni[k] = s.luni[k].minus(m);
        buf.luni[k] = buf.luni[k].plus(m);
      }
      s.total = s.total.minus(take);
      buf.total = buf.total.plus(take);
    } else {
      if (kg.greaterThan(buf.total.plus(EPS))) {
        erori.push({ id: a.id, mesaj: 'Se atribuie mai mult decât e disponibil de realocat în categorie.' });
        continue;
      }
      if (s.total.plus(kg).greaterThan(s.obligatie.plus(EPS))) {
        erori.push({ id: a.id, mesaj: 'Clientul ar depăși obligația lui în categorie.' });
        continue;
      }
      const give = D.min(kg, buf.total);
      const ratio = buf.total.isZero() ? ZERO : give.div(buf.total);
      for (const k of keys) {
        const m = buf.luni[k].times(ratio);
        buf.luni[k] = buf.luni[k].minus(m);
        s.luni[k] = s.luni[k].plus(m);
      }
      buf.total = buf.total.minus(give);
      s.total = s.total.plus(give);
    }
    aplicate++;
  }

  // Rezultatul pe clienți, ajustat
  const clienti: ClientResult[] = res.clienti.map((c) => {
    const s = state.get(`${c.clientId}|${c.categorie}`)!;
    const changed = !s.total.equals(c.totalAlocat);
    return {
      ...c,
      totalAlocat: s.total,
      alocatLuna: s.luni,
      procentIndeplinire: c.obligatie.isZero() ? ZERO : s.total.div(c.obligatie),
      totalInitial: changed ? c.totalAlocat : undefined,
      afisare: { totalAlocat: ZERO, alocatLuna: {} },
    };
  });
  // Rotunjire pentru afișare (§7), ca în motor: ținta = totalul alocat clienților din categorie
  for (const cat of res.categorii) {
    const rows = clienti.filter((c) => c.categorie === cat.cod);
    const target = cat.totalAlocat.minus(buffer[cat.cod].total);
    const tot = reconcileRounded(target, rows.map((c) => ({ value: c.totalAlocat, cota: c.cotaCategorie })));
    rows.forEach((c, i) => {
      c.afisare.totalAlocat = tot[i];
      const vals = reconcileRounded(tot[i], keys.map((k) => ({ value: c.alocatLuna[k], cota: c.alocatLuna[k] })), false);
      keys.forEach((k, j) => (c.afisare.alocatLuna[k] = vals[j]));
    });
  }

  // Invarianții afectați de ajustări se recalculează (I-2 și I-5); ceilalți rămân cei ai motorului.
  const i2 = clienti.map((c) => sumMonths(c.alocatLuna).minus(c.totalAlocat).abs());
  const i5 = res.categorii.map((cat) =>
    clienti
      .filter((c) => c.categorie === cat.cod)
      .reduce((a, c) => a.plus(c.totalAlocat), ZERO)
      .plus(buffer[cat.cod].total)
      .minus(cat.totalAlocat)
      .abs(),
  );
  const maxOf = (xs: Decimal[]) => xs.reduce((a, b) => (b.greaterThan(a) ? b : a), ZERO);
  const invarianti: InvariantCheck[] = res.invarianti.map((inv) => {
    if (inv.cod === 'I-2' && ajustari.length) {
      const v = Decimal.max(inv.valoare, maxOf(i2));
      return { ...inv, valoare: v, trecut: inv.trecut && maxOf(i2).lessThanOrEqualTo(TOL) };
    }
    if (inv.cod === 'I-5' && ajustari.length) {
      const v = maxOf(i5);
      return { ...inv, descriere: 'Suma alocărilor pe clienți (+ disponibilul de realocat) = totalul alocat al categoriei', valoare: v, trecut: v.lessThanOrEqualTo(TOL) };
    }
    return inv;
  });

  const bufTotal = Object.values(buffer).reduce((a, b) => a.plus(b.total), ZERO);
  const peste = clienti.map((c) => c.totalAlocat.minus(c.obligatie)).reduce((a, b) => (b.greaterThan(a) ? b : a), ZERO);
  const verificariRevizuire: ReviewCheck[] = [
    { cod: 'R-1', descriere: 'Tot ce s-a retras a fost reatribuit (disponibil de realocat = 0)', valoare: bufTotal, trecut: bufTotal.lessThan(TOL) },
    { cod: 'R-2', descriere: 'Niciun client nu depășește obligația lui în categorie', valoare: peste, trecut: peste.lessThanOrEqualTo(TOL) },
    { cod: 'R-3', descriere: 'Toate ajustările din jurnal sunt valide', valoare: new D(erori.length), trecut: erori.length === 0 },
  ];

  // Totalurile generale reflectă cantitatea efectiv atribuită clienților
  const totalAlocat = res.totaluri.totalAlocat.minus(bufTotal);
  const finalizabil = invarianti.every((i) => i.trecut);
  return {
    ...res,
    clienti,
    invarianti,
    finalizabil,
    totaluri: {
      ...res.totaluri,
      totalAlocat,
      procentIndeplinire: res.totaluri.obligatie.isZero() ? ZERO : totalAlocat.div(res.totaluri.obligatie),
    },
    disponibilRealocat: buffer,
    ajustariAplicate: aplicate,
    erori,
    verificariRevizuire,
    poateFiTrimisa: finalizabil && verificariRevizuire.every((v) => v.trecut),
  };
}
