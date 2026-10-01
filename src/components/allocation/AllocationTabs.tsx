export type AllocationTab = 'alocari' | 'reguli' | 'istoric';

/** Tab-urile cardului principal al paginii Alocări DEEE (M1). */
export function AllocationTabs({ value, onChange, rulesDirty }: { value: AllocationTab; onChange: (t: AllocationTab) => void; rulesDirty: boolean }) {
  const tabs: { id: AllocationTab; label: string }[] = [
    { id: 'alocari', label: 'Alocări' },
    { id: 'reguli', label: 'Reguli de alocare' },
    { id: 'istoric', label: 'Istoric rulări' },
  ];
  return (
    <div role="tablist" className="flex gap-1 border-b border-gray-100 px-6">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 pt-5 pb-3 text-[15px] transition-colors ${
              active ? 'border-gray-900 font-semibold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            {t.id === 'reguli' && rulesDirty && <span className="h-2 w-2 rounded-full bg-amber-500" title="Modificări nesalvate" />}
          </button>
        );
      })}
    </div>
  );
}
