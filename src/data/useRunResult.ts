import type { AllocationResult } from '../engine/types';
import { allocate } from '../engine/allocate';
import { buildEngineInput } from './engineInput';
import type { AllocationRun } from './types';

// Rezultatul unei rulări e o funcție pură de snapshot-ul ei, deci îl recalculăm la cerere și îl păstrăm în cache.
const cache = new WeakMap<AllocationRun, AllocationResult>();

export function runResult(run: AllocationRun): AllocationResult {
  let r = cache.get(run);
  if (!r) {
    r = allocate(buildEngineInput(run));
    cache.set(run, r);
  }
  return r;
}
