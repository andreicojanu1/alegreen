import { allocate } from '../engine/allocate';
import { applyAdjustments, type AdjustedResult } from '../engine/adjustments';
import { buildEngineInput } from './engineInput';
import type { AllocationRun } from './types';

// Rezultatul unei rulări e o funcție pură de snapshot-ul ei + jurnalul de ajustări manuale,
// deci îl recalculăm la cerere și îl păstrăm în cache.
const cache = new WeakMap<AllocationRun, AdjustedResult>();

export function runResult(run: AllocationRun): AdjustedResult {
  let r = cache.get(run);
  if (!r) {
    r = applyAdjustments(allocate(buildEngineInput(run)), run.ajustari ?? []);
    cache.set(run, r);
  }
  return r;
}
