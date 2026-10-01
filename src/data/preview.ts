import type { AllocationResult } from '../engine/types';
import { allocate } from '../engine/allocate';
import { buildEngineInput } from './engineInput';
import type { AppState } from './store';
import type { AllocationRun, CalculationBase } from './types';

export interface RunParams {
  anObligatie: number;
  deLa: { an: number; luna: number };
  panaLa: { an: number; luna: number };
  baza: CalculationBase;
}

/** Rulare „virtuală" pe datele curente și regulile salvate — folosită doar pentru afișarea disponibilității (M2). */
export function previewRun(state: AppState, p: RunParams): AllocationRun {
  return {
    id: 'preview',
    ...p,
    rataEfectiva: state.rules.rataEfectiva,
    pragMinimImplicit: state.rules.pragMinimImplicit,
    observatii: '',
    status: 'draft',
    reguli: state.rules.reguli,
    snapshot: { clienti: state.clients, declaratii: state.declarations, colectari: state.collected },
    creatDe: '',
    creatLa: '',
  };
}

export const previewResult = (state: AppState, p: RunParams): AllocationResult => allocate(buildEngineInput(previewRun(state, p)));
