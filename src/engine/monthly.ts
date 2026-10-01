import Decimal from 'decimal.js';
import type { AdjustedResult } from './adjustments';
import { fmtKg } from '../lib/format';
import type { AllocationWarning, MonthMap } from './types';

/**
 * Sesiuni lunare de alocare (decizie Alegreen, 1 oct. 2026). Clienții primesc rapoarte lunare obligatorii pentru AFM,
 * deci lunile deja raportate NU se mai modifică:
 *  - sesiunea lunii M rulează algoritmul anual pe colectatul cumulat ian–M (rezultatul `cum`, inclusiv ajustările);
 *  - alocarea lunii M, pe client × categorie = cumulatul afișat (rotunjit, §7) − suma lunilor deja raportate;
 *  - dacă diferența iese negativă, luna M primește 0, se emite avertizarea A-06, iar sesiunea nu poate fi trimisă
 *    spre aprobare până la corectare (verificarea R-4);
 *  - la aprobare, valorile lunii M se îngheață (ReportedEntry) și devin baza sesiunii următoare.
 * Toate valorile lunare sunt la 2 zecimale, astfel încât rapoartele lunare se adună exact la cumulat.
 */

export interface ReportedEntry {
  clientId: string;
  categorie: string;
  /** luna raportată, YYYY-MM */
  luna: string;
  /** cantitatea alocată în acea lună, 2 zecimale */
  kg: string;
}

export interface MonthlyClientInfo {
  raportatAnterior: Decimal;
  cumulatCalculat: Decimal;
  lunaCurenta: Decimal;
  negativ: boolean;
}

export interface MonthlyResult extends AdjustedResult {
  /** luna alocată în această sesiune (YYYY-MM) */
  lunaCurenta: string;
  /** detalii lunare pe rând `${clientId}|${categorie}` */
  lunar: Record<string, MonthlyClientInfo>;
  /** valorile care se îngheață la aprobare */
  raportLuna: ReportedEntry[];
  /** total alocat în luna curentă */
  totalLuna: Decimal;
}

const ZERO = new Decimal(0);

export function monthlySession(
  cum: AdjustedResult,
  lunaCurenta: string,
  anterior: ReportedEntry[],
  numeClient: (id: string) => string = (id) => id,
): MonthlyResult {
  const keys = Object.keys(cum.categorii[0]?.alocatLuna ?? {});
  const prevBy = new Map<string, MonthMap>();
  for (const e of anterior) {
    if (e.luna >= lunaCurenta) continue;
    const k = `${e.clientId}|${e.categorie}`;
    const m = prevBy.get(k) ?? {};
    m[e.luna] = (m[e.luna] ?? ZERO).plus(e.kg);
    prevBy.set(k, m);
  }

  const lunar: Record<string, MonthlyClientInfo> = {};
  const raportLuna: ReportedEntry[] = [];
  const avertizari: AllocationWarning[] = [];
  const clienti = cum.clienti.map((c) => {
    const k = `${c.clientId}|${c.categorie}`;
    const prev = prevBy.get(k) ?? {};
    const raportatAnterior = Object.values(prev).reduce((a, b) => a.plus(b), ZERO);
    const cumulatCalculat = c.afisare.totalAlocat;
    const diff = cumulatCalculat.minus(raportatAnterior);
    const negativ = diff.isNegative();
    const lunaKg = negativ ? ZERO : diff;
    lunar[k] = { raportatAnterior, cumulatCalculat, lunaCurenta: lunaKg, negativ };
    raportLuna.push({ clientId: c.clientId, categorie: c.categorie, luna: lunaCurenta, kg: lunaKg.toFixed(2) });
    const luni: MonthMap = Object.fromEntries(keys.map((key) => [key, key === lunaCurenta ? lunaKg : (prev[key] ?? ZERO)]));
    const total = raportatAnterior.plus(lunaKg);
    if (negativ) {
      avertizari.push({
        cod: 'A-06',
        categorie: c.categorie,
        mesaj: `${numeClient(c.clientId)} (categoria ${c.categorie}): cumulatul calculat (${fmtKg(cumulatCalculat)} kg) este mai mic decât ce s-a raportat deja (${fmtKg(raportatAnterior)} kg). Luna curentă primește 0; corectați la Revizuire.`,
      });
    }
    return { ...c, alocatLuna: luni, afisare: { totalAlocat: total, alocatLuna: luni } };
  });

  // Pe categorie, „Alocat {lună}" = suma lunilor raportate ale clienților
  const categorii = cum.categorii.map((cat) => {
    const rows = clienti.filter((c) => c.categorie === cat.cod);
    const alocatLuna: MonthMap = Object.fromEntries(keys.map((key) => [key, rows.reduce((a, r) => a.plus(r.alocatLuna[key]), ZERO)]));
    return { ...cat, alocatLuna };
  });
  const totaluriLuna: MonthMap = Object.fromEntries(keys.map((key) => [key, categorii.reduce((a, c) => a.plus(c.alocatLuna[key]), ZERO)]));
  const totalLuna = totaluriLuna[lunaCurenta] ?? ZERO;
  const negative = Object.values(lunar).filter((l) => l.negativ).length;

  const verificariRevizuire = [
    ...cum.verificariRevizuire,
    {
      cod: 'R-4' as const,
      descriere: 'Niciun client nu are cumulatul sub ce i s-a raportat deja în lunile anterioare',
      valoare: new Decimal(negative),
      trecut: negative === 0,
    },
  ];

  return {
    ...cum,
    clienti,
    categorii,
    totaluri: { ...cum.totaluri, alocatLuna: totaluriLuna },
    avertizari: [...cum.avertizari, ...avertizari],
    verificariRevizuire,
    poateFiTrimisa: cum.poateFiTrimisa && negative === 0,
    lunaCurenta,
    lunar,
    raportLuna,
    totalLuna,
  };
}
