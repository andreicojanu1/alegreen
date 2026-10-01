import { allocate } from '../engine/allocate';
import { applyAdjustments } from '../engine/adjustments';
import { monthlySession, type MonthlyResult } from '../engine/monthly';
import { monthKey } from '../engine/months';
import { buildEngineInput } from './engineInput';
import type { AllocationRun } from './types';

// Rezultatul unei sesiuni e o funcție pură de snapshot-ul ei (date, reguli, luni raportate, ajustări),
// deci îl recalculăm la cerere și îl păstrăm în cache.
const cache = new WeakMap<AllocationRun, MonthlyResult>();

export function runResult(run: AllocationRun): MonthlyResult {
  let r = cache.get(run);
  if (!r) {
    const ctx = run.context ?? { raportatAnterior: [], ajustariAnterioare: [] };
    // 1) ajustările aprobate în lunile anterioare se reaplică, altfel o mutare manuală s-ar anula luna următoare
    const base = applyAdjustments(allocate(buildEngineInput(run)), ctx.ajustariAnterioare);
    const baseClean = { ...base, clienti: base.clienti.map((c) => ({ ...c, totalInitial: undefined })) };
    // 2) ajustările sesiunii curente (față de această bază)
    const cur = applyAdjustments(baseClean, run.ajustari ?? []);
    const withCarried = { ...cur, erori: [...base.erori, ...cur.erori] };
    const nume = new Map(run.snapshot.clienti.map((c) => [c.id, c.denumire]));
    r = monthlySession(withCarried, monthKey({ an: run.anObligatie, luna: run.luna }), ctx.raportatAnterior, (id) => nume.get(id) ?? id);
    cache.set(run, r);
  }
  return r;
}
