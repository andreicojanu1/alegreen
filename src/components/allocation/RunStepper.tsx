import { Check } from 'lucide-react';
import type { RunStatus } from '../../data/types';

export type SessionStep = 'calcul' | 'revizuire' | 'aprobare' | 'publicat';

const STEPS: { id: SessionStep; label: string }[] = [
  { id: 'calcul', label: 'Calcul automat' },
  { id: 'revizuire', label: 'Revizuire și confirmare' },
  { id: 'aprobare', label: 'Aprobare (alt admin)' },
  { id: 'publicat', label: 'Publicat la clienți' },
];

/** Pasul curent al sesiunii de alocare, din statusul rulării (și ecranul pe care se află operatorul). */
export function stepOf(status: RunStatus, onReview = false): SessionStep {
  if (status === 'draft') return onReview ? 'revizuire' : 'calcul';
  if (status === 'in_aprobare') return 'aprobare';
  return 'publicat';
}

/** O rulare = o sesiune unică: calcul automat → revizuire și confirmare → aprobare → publicare. */
export function RunStepper({ current, inlocuita = false }: { current: SessionStep; inlocuita?: boolean }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Etapele sesiunii de alocare">
      {STEPS.map((s, i) => {
        const done = i < idx || (current === 'publicat' && !inlocuita);
        const active = i === idx && !(current === 'publicat' && !inlocuita);
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 font-medium ${
                done ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : active ? 'bg-ink text-white' : 'bg-gray-100 text-gray-500'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check size={13} /> : <span className="text-xs tabular">{i + 1}</span>}
              {s.id === 'publicat' && inlocuita ? 'Publicat, apoi înlocuit' : s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-gray-300" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
