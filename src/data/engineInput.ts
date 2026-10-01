import Decimal from 'decimal.js';
import type { AllocationInput } from '../engine/types';
import { monthRange } from '../engine/months';
import type { AllocationRun, CategoryRule } from './types';

/** Regulile efective: categoriile cu prag implicit preiau pragul rulării, cu plafon = 100% − prag. */
export function effectiveRules(reguli: CategoryRule[], pragMinimImplicit: string): CategoryRule[] {
  return reguli.map((r) =>
    r.folosestePragImplicit
      ? { ...r, pragMinimPropriu: pragMinimImplicit, plafonSubstitutie: new Decimal(1).minus(pragMinimImplicit).toString() }
      : r,
  );
}

/**
 * Construiește intrarea motorului dintr-o rulare (care conține snapshot-ul datelor).
 * Baza „declaratii_an_curent" = declarațiile aprobate din anul de obligație (tranziția 2026, ca în Excel).
 * Baza „medie_3_ani_anteriori" NU e implementată: depinde de decizia D-01 (brief §15).
 */
export function buildEngineInput(run: AllocationRun): AllocationInput {
  if (run.baza !== 'declaratii_an_curent') {
    throw new Error('Baza de calcul „medie pe 3 ani anteriori" depinde de decizia D-01 și nu este implementată.');
  }
  const reguli = effectiveRules(run.reguli, run.pragMinimImplicit);
  return {
    anObligatie: run.anObligatie,
    rataEfectiva: run.rataEfectiva,
    categorii: reguli.map((r) => ({
      cod: r.cod,
      pragMinimPropriu: r.pragMinimPropriu,
      plafonSubstitutie: r.plafonSubstitutie,
      ordineAlocare: r.ordineAlocare,
      activ: r.activ,
    })),
    clienti: run.snapshot.clienti,
    declaratii: run.snapshot.declaratii
      .filter((l) => l.an === run.anObligatie && l.status === 'Aprobată')
      .map((l) => ({ clientId: l.clientId, categorie: l.categorie, greutateKg: l.greutateKg, bucati: l.bucati })),
    colectari: run.snapshot.colectari,
    luni: monthRange(run.deLa, run.panaLa),
  };
}
