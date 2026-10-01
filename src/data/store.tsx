import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { DEFAULT_CATEGORY_RULES } from './categories';
import { finalizedSessions, nextDueMonth, sessionContext, buildSeedRuns } from './sessions';
export { finalizedSessions, nextDueMonth };
import { runResult } from './useRunResult';
import { seedClients, seedCollected, seedDeclarationLines } from './seed/excelData';
import type {
  AdminUser,
  AdjustmentRecord,
  AllocationRun,
  CalculationBase,
  CategoryRule,
  Client,
  CollectedEntry,
  DeclarationLine,
  Role,
} from './types';

/**
 * Starea locală a prototipului (în locul backend-ului). Toate mutațiile trec prin reducer, iar componentele
 * folosesc doar hook-urile de mai jos — la integrare, acestea se înlocuiesc cu apeluri către API.
 * Starea se păstrează în localStorage ca iterațiile să nu piardă datele; „Resetează datele demo" o readuce la seed.
 */

export interface AppState {
  version: number;
  role: Role;
  admins: AdminUser[];
  clients: Client[];
  declarations: DeclarationLine[];
  collected: CollectedEntry[];
  /** Regulile de alocare active (M1): se salvează explicit și se copiază în fiecare rulare nouă. */
  rules: RulesConfig;
  runs: AllocationRun[];
  /** Bannerul „Vizibilitate pentru clienți". */
  clientVisibility: boolean;
}

export interface RulesConfig {
  rataEfectiva: string;
  pragMinimImplicit: string;
  reguli: CategoryRule[];
  modificatLa: string;
  modificatDe: string; // AdminUser.id
}

export interface NewRunParams {
  anObligatie: number;
  /** luna alocată (1–12); colectarea e cumulată din ianuarie */
  luna: number;
  baza: CalculationBase;
  rataEfectiva: string;
  pragMinimImplicit: string;
  observatii: string;
  reguli: CategoryRule[];
}

type Action =
  | { type: 'setRole'; role: Role }
  | { type: 'createRun'; id: string; params: NewRunParams; now: string }
  | { type: 'submitRun'; id: string; now: string; motiv: string }
  | { type: 'addAdjustments'; runId: string; items: AdjustmentRecord[] }
  | { type: 'undoAdjustment'; runId: string }
  | { type: 'clearAdjustments'; runId: string }
  | { type: 'approveRun'; id: string; now: string }
  | { type: 'rejectRun'; id: string; now: string; motiv: string }
  | { type: 'deleteDraft'; id: string }
  | { type: 'setVisibility'; value: boolean }
  | { type: 'setCollected'; an: number; luna: number; categorie: string; cantitateKg: string }
  | { type: 'saveRules'; rules: Omit<RulesConfig, 'modificatLa' | 'modificatDe'>; now: string }
  | { type: 'reset' };

const STORAGE_KEY = 'alegreen-proto-state';
const VERSION = 4;

export const ADMINS: AdminUser[] = [
  { id: 'adm_andrei', nume: 'Andrei C', email: 'admin@alegreen.ro' },
  { id: 'adm_ion', nume: 'Ion Popescu', email: 'ion.popescu@alegreen.ro' },
];

/** ID în stilul cuid (platforma reală folosește cuid în URL-uri). */
export function newId(): string {
  const rnd = () => Math.random().toString(36).slice(2, 10);
  return `c${Date.now().toString(36)}${rnd()}${rnd()}`.slice(0, 25);
}

function seedState(): AppState {
  const runs = buildSeedRuns();
  return {
    version: VERSION,
    role: { tip: 'admin', adminId: 'adm_andrei' },
    admins: ADMINS,
    clients: seedClients,
    declarations: seedDeclarationLines,
    collected: seedCollected,
    rules: {
      rataEfectiva: '0.2167',
      pragMinimImplicit: '0.3',
      reguli: DEFAULT_CATEGORY_RULES,
      modificatLa: '2026-01-15T08:10:00',
      modificatDe: 'adm_andrei',
    },
    runs,
    clientVisibility: false,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setRole':
      return { ...state, role: action.role };
    case 'createRun': {
      if (state.role.tip !== 'admin') return state;
      const p = action.params;
      // strict în ordine: doar următoarea lună de alocat, și o singură sesiune deschisă pe an
      if (p.luna !== nextDueMonth(state.runs, p.anObligatie)) return state;
      if (state.runs.some((r) => r.anObligatie === p.anObligatie && (r.status === 'draft' || r.status === 'in_aprobare'))) return state;
      const run: AllocationRun = {
        id: action.id,
        ...p,
        deLa: { an: p.anObligatie, luna: 1 },
        panaLa: { an: p.anObligatie, luna: p.luna },
        context: sessionContext(state.runs, p.anObligatie, p.luna),
        status: 'draft',
        snapshot: { clienti: state.clients, declaratii: state.declarations, colectari: state.collected },
        creatDe: state.role.adminId,
        creatLa: action.now,
      };
      return { ...state, runs: [run, ...state.runs] };
    }
    case 'submitRun':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id === action.id && r.status === 'draft'
            ? {
                ...r,
                status: 'in_aprobare',
                trimisSpreAprobareLa: action.now,
                motivAjustari: action.motiv || undefined,
                revizuitDe: state.role.tip === 'admin' ? state.role.adminId : undefined,
              }
            : r,
        ),
      };
    case 'addAdjustments':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id === action.runId && r.status === 'draft' ? { ...r, ajustari: [...(r.ajustari ?? []), ...action.items] } : r,
        ),
      };
    case 'undoAdjustment':
      return {
        ...state,
        runs: state.runs.map((r) => {
          if (r.id !== action.runId || r.status !== 'draft' || !r.ajustari?.length) return r;
          // o editare poate produce două intrări cu același „la" — se anulează împreună
          const last = r.ajustari[r.ajustari.length - 1].la;
          return { ...r, ajustari: r.ajustari.filter((a) => a.la !== last) };
        }),
      };
    case 'clearAdjustments':
      return { ...state, runs: state.runs.map((r) => (r.id === action.runId && r.status === 'draft' ? { ...r, ajustari: [] } : r)) };
    case 'approveRun': {
      if (state.role.tip !== 'admin') return state;
      const approver = state.role.adminId;
      const run = state.runs.find((r) => r.id === action.id);
      // O rulare devine finală doar după aprobarea unui alt admin decât cel care a calculat-o.
      if (!run || run.status !== 'in_aprobare' || run.creatDe === approver) return state;
      const res = runResult(run);
      if (!res.poateFiTrimisa) return state;
      // la aprobare, valorile lunii se îngheață: devin rapoartele lunare ale clienților și baza lunii următoare
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id === run.id ? { ...r, status: 'finalizata', aprobatDe: approver, finalizatLa: action.now, raportLuna: res.raportLuna } : r,
        ),
      };
    }
    case 'rejectRun': {
      if (state.role.tip !== 'admin') return state;
      const by = state.role.adminId;
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id === action.id && r.status === 'in_aprobare' && r.creatDe !== by && action.motiv.trim()
            ? {
                ...r,
                status: 'draft',
                trimisSpreAprobareLa: undefined,
                respingeri: [...(r.respingeri ?? []), { deAdminId: by, la: action.now, motiv: action.motiv.trim() }],
              }
            : r,
        ),
      };
    }
    case 'deleteDraft':
      return { ...state, runs: state.runs.filter((r) => !(r.id === action.id && r.status === 'draft')) };
    case 'setVisibility':
      return { ...state, clientVisibility: action.value };
    case 'setCollected': {
      const { an, luna, categorie, cantitateKg } = action;
      const rest = state.collected.filter((c) => !(c.an === an && c.luna === luna && c.categorie === categorie));
      return { ...state, collected: [...rest, { an, luna, categorie, cantitateKg }] };
    }
    case 'saveRules':
      if (state.role.tip !== 'admin') return state;
      return { ...state, rules: { ...action.rules, modificatLa: action.now, modificatDe: state.role.adminId } };
    case 'reset':
      return { ...seedState(), role: state.role };
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === VERSION) return parsed;
    }
  } catch {
    /* stocare indisponibilă: pornim de la seed */
  }
  return seedState();
}

const StoreContext = createContext<{ state: AppState; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignorat */
    }
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore în afara StoreProvider');
  return ctx;
}

/** API-ul de acțiuni folosit de UI (de înlocuit cu apeluri de server). */
export function useActions() {
  const { dispatch } = useStore();
  return useMemo(
    () => ({
      setRole: (role: Role) => dispatch({ type: 'setRole', role }),
      createRun: (params: NewRunParams) => {
        const id = newId();
        dispatch({ type: 'createRun', id, params, now: new Date().toISOString() });
        return id;
      },
      submitRun: (id: string, motiv = '') => dispatch({ type: 'submitRun', id, motiv, now: new Date().toISOString() }),
      addAdjustments: (runId: string, items: Omit<AdjustmentRecord, 'id' | 'la' | 'autorId'>[], autorId: string) => {
        const la = new Date().toISOString();
        dispatch({ type: 'addAdjustments', runId, items: items.map((it) => ({ ...it, id: newId(), la, autorId })) });
      },
      undoAdjustment: (runId: string) => dispatch({ type: 'undoAdjustment', runId }),
      clearAdjustments: (runId: string) => dispatch({ type: 'clearAdjustments', runId }),
      approveRun: (id: string) => dispatch({ type: 'approveRun', id, now: new Date().toISOString() }),
      rejectRun: (id: string, motiv: string) => dispatch({ type: 'rejectRun', id, motiv, now: new Date().toISOString() }),
      deleteDraft: (id: string) => dispatch({ type: 'deleteDraft', id }),
      setVisibility: (value: boolean) => dispatch({ type: 'setVisibility', value }),
      setCollected: (an: number, luna: number, categorie: string, cantitateKg: string) =>
        dispatch({ type: 'setCollected', an, luna, categorie, cantitateKg }),
      saveRules: (rules: Omit<RulesConfig, 'modificatLa' | 'modificatDe'>) =>
        dispatch({ type: 'saveRules', rules, now: new Date().toISOString() }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [dispatch],
  );
}

export function useAdmin(id: string | undefined) {
  const { state } = useStore();
  return state.admins.find((a) => a.id === id);
}

export function useCurrentAdmin() {
  const { state } = useStore();
  return state.role.tip === 'admin' ? state.admins.find((a) => a.id === (state.role as { adminId: string }).adminId) : undefined;
}
