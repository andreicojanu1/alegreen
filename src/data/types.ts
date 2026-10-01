/**
 * Modelul de date al prototipului (oglindește brief §4). Cantitățile și procentele se păstrează ca string-uri
 * zecimale („0.2167", „1537289.19") — nu ca float — ca să poată fi trecute direct în motor și serializate exact.
 * Stratul `data/` e gândit să fie înlocuit ulterior cu API-ul real (Next.js + Prisma).
 */

export type CategoryCode = '1' | '2' | '3' | '4' | '4B' | '5' | '6';

/** DAT-01 · categorii_deee + reguli de substituție. */
export interface CategoryRule {
  cod: CategoryCode;
  denumire: string;
  /** Dacă true, pragul și plafonul urmează pragul minim implicit al rulării (plafon = 100% − prag). */
  folosestePragImplicit: boolean;
  /** Procentul minim din categoria proprie, ca raport („0.3"). */
  pragMinimPropriu: string;
  /** Procentul maxim din alte categorii, ca raport („0.7"). */
  plafonSubstitutie: string;
  ordineAlocare: number;
  activ: boolean;
}

export interface Client {
  id: string;
  denumire: string;
  cui: string;
  /** RB-16: clienții de test sunt excluși din toate calculele. */
  esteTest: boolean;
}

export type DeclarationStatus = 'Draft' | 'Trimisă' | 'În verificare' | 'Aprobată' | 'Respinsă';

/** O linie de raportare EEE (foaia „Raport EEE"). */
export interface DeclarationLine {
  id: string;
  clientId: string;
  an: number;
  luna: number;
  categorie: CategoryCode | string;
  subcategorieCod: string;
  subcategorie: string;
  bucati: number;
  greutateKg: string;
  valoareRon: string;
  status: DeclarationStatus;
}

/** DAT-02 · colectari */
export interface CollectedEntry {
  an: number;
  luna: number;
  categorie: CategoryCode | string;
  cantitateKg: string;
}

export interface AdminUser {
  id: string;
  nume: string;
  email: string;
}

/** Baza de calcul a obligației. D-01 e deschisă: doar varianta de tranziție (ca în Excel) e activă. */
export type CalculationBase = 'declaratii_an_curent' | 'medie_3_ani_anteriori';

export type RunStatus = 'draft' | 'in_aprobare' | 'finalizata' | 'inlocuita';

/** DAT-03 · rulari_alocare. Rularea păstrează o copie (snapshot) a tuturor intrărilor, deci rezultatul e reproductibil. */
export interface AllocationRun {
  id: string;
  anObligatie: number;
  deLa: { an: number; luna: number };
  panaLa: { an: number; luna: number };
  baza: CalculationBase;
  rataEfectiva: string;
  pragMinimImplicit: string;
  observatii: string;
  status: RunStatus;
  reguli: CategoryRule[];
  snapshot: {
    clienti: Client[];
    declaratii: DeclarationLine[];
    colectari: CollectedEntry[];
  };
  creatDe: string; // AdminUser.id
  creatLa: string; // ISO
  trimisSpreAprobareLa?: string;
  aprobatDe?: string;
  finalizatLa?: string;
  inlocuiesteRulareaId?: string;
  inlocuitaDeRulareaId?: string;
  /** Ajustările manuale făcute la revizuire (doar în draft); devin imutabile la trimiterea spre aprobare. */
  ajustari?: AdjustmentRecord[];
  /** Motivul ajustărilor, obligatoriu dacă există ajustări (DAT-08). */
  motivAjustari?: string;
  revizuitDe?: string;
}

/** O ajustare manuală din ecranul de Revizuire (jurnal ordonat; vezi engine/adjustments.ts). */
export interface AdjustmentRecord {
  id: string;
  tip: 'retragere' | 'atribuire';
  clientId: string;
  categorie: string;
  kg: string;
  autorId: string;
  la: string; // ISO
}

export type Role = { tip: 'admin'; adminId: string } | { tip: 'client'; clientId: string };
