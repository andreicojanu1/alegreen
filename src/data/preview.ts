import type { AllocationResult } from '../engine/types';
import { allocate } from '../engine/allocate';
import { buildEngineInput } from './engineInput';
import type { AppState } from './store';
import type { AllocationRun, CalculationBase } from './types';

/** Parametrii unei sesiuni lunare: anul de obligație și luna alocată (colectarea e cumulată din ianuarie). */
export interface RunParams {
  anObligatie: number;
  luna: number;
  baza: CalculationBase;
}

/** Rulare „virtuală" pe datele curente și regulile salvate — folosită doar pentru afișarea disponibilității (M2). */
export function previewRun(state: AppState, p: RunParams): AllocationRun {
  return {
    id: 'preview',
    codSesiune: 'preview',
    anObligatie: p.anObligatie,
    luna: p.luna,
    deLa: { an: p.anObligatie, luna: 1 },
    panaLa: { an: p.anObligatie, luna: p.luna },
    baza: p.baza,
    rataEfectiva: state.rules.rataEfectiva,
    pragMinimImplicit: state.rules.pragMinimImplicit,
    observatii: '',
    status: 'draft',
    reguli: state.rules.reguli,
    snapshot: { clienti: state.clients, declaratii: state.declarations, colectari: state.collected },
    context: { raportatAnterior: [], ajustariAnterioare: [] },
    creatDe: '',
    creatLa: '',
  };
}

export const previewResult = (state: AppState, p: RunParams): AllocationResult => allocate(buildEngineInput(previewRun(state, p)));
