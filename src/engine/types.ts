import type Decimal from 'decimal.js';
import type { YearMonth } from './months';

/**
 * Tipurile motorului de alocare (brief §6.1). Toate cantitățile sunt în kg.
 * Intrările acceptă string/number/Decimal; ieșirile sunt Decimal, nerotunjite (rotunjirea se face la afișare, §7).
 */

export type CategoryCode = string; // '1', '2', '3', '4', '4B', '5', '6'

export interface EngineCategory {
  cod: CategoryCode;
  /** Procentul minim din obligație acoperit din categoria proprie, ca raport (0,3 = 30%). */
  pragMinimPropriu: Decimal.Value;
  /** Procentul maxim din obligație care poate veni din pool, ca raport (0,7 = 70%). */
  plafonSubstitutie: Decimal.Value;
  /** Ordinea în care categoria primește din pool (crescător). */
  ordineAlocare: number;
  activ: boolean;
}

export interface EngineClient {
  id: string;
  denumire: string;
  esteTest: boolean;
}

/** O linie de declarație din fereastra de referință (agregarea se face în PAS 0). */
export interface EngineDeclaration {
  clientId: string;
  categorie: CategoryCode;
  greutateKg: Decimal.Value;
  bucati?: number;
}

export interface EngineCollected {
  categorie: CategoryCode;
  an: number;
  luna: number;
  cantitateKg: Decimal.Value;
}

export interface AllocationInput {
  anObligatie: number;
  rataEfectiva: Decimal.Value;
  categorii: EngineCategory[];
  clienti: EngineClient[];
  declaratii: EngineDeclaration[];
  colectari: EngineCollected[];
  /** Lunile perioadei de colectare incluse în rulare, în ordine cronologică. */
  luni: YearMonth[];
}

export type MonthMap = Record<string, Decimal>; // cheie: monthKey (YYYY-MM)

/** Rezultat pe categorie (DAT-04, foaia „Alocare colectat"). */
export interface CategoryResult {
  cod: CategoryCode;
  ordineAlocare: number;
  pragMinimPropriu: Decimal;
  plafonSubstitutie: Decimal;
  declarat: Decimal;
  obligatie: Decimal;
  minimPropriu: Decimal;
  colectatLuna: MonthMap;
  colectat: Decimal;
  utilizatPropriu: Decimal;
  surplus: Decimal;
  necesarRamas: Decimal;
  /** obligatie × plafon_substitutie (PAS 4). */
  plafon: Decimal;
  alocatPool: Decimal;
  /** Pool-ul disponibil după ce categoria a fost servită (coloana „Pool rămas" din Excel). */
  poolRamasDupa: Decimal;
  totalAlocat: Decimal;
  procentIndeplinire: Decimal;
  propriuLuna: MonthMap;
  poolLuna: MonthMap;
  alocatLuna: MonthMap;
  regulaAplicata: string;
}

/** Rezultat pe client × categorie (DAT-05 + DAT-06). */
export interface ClientResult {
  clientId: string;
  categorie: CategoryCode;
  declarat: Decimal;
  obligatie: Decimal;
  cotaCategorie: Decimal;
  totalAlocat: Decimal;
  procentIndeplinire: Decimal;
  alocatLuna: MonthMap;
  /** Setat doar după ajustări manuale: totalul calculat inițial de motor. */
  totalInitial?: Decimal;
  /** Valori pentru afișare, rotunjite la 2 zecimale, cu reziduul atribuit clientului cu cota cea mai mare (§7). */
  afisare: { totalAlocat: Decimal; alocatLuna: MonthMap };
}

export interface MonthPoolShare {
  key: string;
  surplusLuna: Decimal;
  cotaPool: Decimal;
}

export type InvariantCode = 'I-1' | 'I-2' | 'I-3' | 'I-4' | 'I-5' | 'I-6';

export interface InvariantCheck {
  cod: InvariantCode;
  descriere: string;
  /** Abaterea maximă constatată (kg sau, la I-6, unități de cotă). */
  valoare: Decimal;
  toleranta: string;
  trecut: boolean;
}

/** A-01…A-05 din brief; A-06 = diferență negativă față de lunile deja raportate (sesiuni lunare). */
export type WarningCode = 'A-01' | 'A-02' | 'A-03' | 'A-04' | 'A-05' | 'A-06';

export interface AllocationWarning {
  cod: WarningCode;
  categorie?: CategoryCode;
  mesaj: string;
}

export interface AllocationResult {
  anObligatie: number;
  rataEfectiva: Decimal;
  luni: YearMonth[];
  categorii: CategoryResult[]; // în ordinea ordine_alocare
  clienti: ClientResult[];
  poolTotal: Decimal;
  poolRamas: Decimal;
  luniPool: MonthPoolShare[];
  totaluri: {
    declarat: Decimal;
    obligatie: Decimal;
    minimPropriu: Decimal;
    colectat: Decimal;
    colectatLuna: MonthMap;
    utilizatPropriu: Decimal;
    surplus: Decimal;
    necesarRamas: Decimal;
    alocatPool: Decimal;
    totalAlocat: Decimal;
    alocatLuna: MonthMap;
    procentIndeplinire: Decimal;
  };
  reconciliere: {
    /** total alocat − colectat disponibil (0 = tot colectatul e alocat; coloana C18 din Excel) */
    alocatMinusColectat: Decimal;
    poolNeutilizat: Decimal;
    /** suma lunilor − total alocat */
    luniMinusTotal: Decimal;
  };
  invarianti: InvariantCheck[];
  avertizari: AllocationWarning[];
  /** true dacă toți invarianții trec (condiție de finalizare, RB-12). */
  finalizabil: boolean;
}
