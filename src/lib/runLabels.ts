import type { AllocationRun, RunStatus } from '../data/types';
import { LUNI, fmtNum } from './format';
import Decimal from 'decimal.js';

export const periodLabel = (r: Pick<AllocationRun, 'deLa' | 'panaLa'>) =>
  `${LUNI[r.deLa.luna - 1]} ${r.deLa.an} – ${LUNI[r.panaLa.luna - 1]} ${r.panaLa.an}`;

/** „Septembrie 2026" — luna alocată de sesiune. */
export const sessionLabel = (r: Pick<AllocationRun, 'luna' | 'anObligatie'>) => `${LUNI[r.luna - 1]} ${r.anObligatie}`;

/** „ianuarie–septembrie 2026" — colectarea cumulată folosită de sesiune. */
export const cumulLabel = (r: Pick<AllocationRun, 'luna' | 'anObligatie'>) =>
  r.luna === 1 ? `ianuarie ${r.anObligatie}` : `ianuarie–${LUNI[r.luna - 1].toLowerCase()} ${r.anObligatie}`;

export const baseLabel = (r: Pick<AllocationRun, 'baza' | 'anObligatie'>) =>
  r.baza === 'declaratii_an_curent'
    ? `declarațiile aprobate din ${r.anObligatie}`
    : `media declarațiilor ${r.anObligatie - 3}–${r.anObligatie - 1}`;

/** Raport ca procent pentru afișare în câmpuri: 0.2167 -> "21,67", 0.3 -> "30". */
export const ratioToPctText = (ratio: string) => {
  const s = new Decimal(ratio).times(100).toDecimalPlaces(4).toString();
  return s.replace('.', ',');
};

export const rateLabel = (ratio: string) => `${fmtNum(new Decimal(ratio).times(100), 2)}%`;

export const STATUS_META: Record<RunStatus, { label: string; tone: 'gray' | 'blue' | 'green' | 'slate' }> = {
  draft: { label: 'Draft', tone: 'gray' },
  in_aprobare: { label: 'În aprobare', tone: 'blue' },
  finalizata: { label: 'Finalizată', tone: 'green' },
  inlocuita: { label: 'Înlocuită', tone: 'slate' },
};
