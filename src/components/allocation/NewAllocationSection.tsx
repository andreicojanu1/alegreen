import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { PeriodPicker } from './PeriodPicker';
import { NewAllocationPanel } from './NewAllocationPanel';
import { nextDueMonth, sessionCode, useStore } from '../../data/store';
import type { RunParams } from '../../data/preview';
import { LUNI } from '../../lib/format';

/**
 * Secțiunea „Alocare nouă", sub graficul cantităților disponibile. Restrânsă: perioada graficului + butonul.
 * La „Alocare nouă", aceeași casetă se extinde lin (înălțime, umbră, fundal) până devine panoul complet cu parametrii
 * sesiunii și regulile active; „Anulează" sau × o restrâng la loc. Fără animație dacă e setat prefers-reduced-motion.
 */
export function NewAllocationSection({
  params,
  onParamsChange,
  open,
  onOpen,
  panel,
}: {
  params: RunParams;
  onParamsChange: (p: RunParams) => void;
  open: boolean;
  onOpen: () => void;
  panel: Omit<ComponentProps<typeof NewAllocationPanel>, 'initial'>;
}) {
  const { state } = useStore();
  const ref = useRef<HTMLElement>(null);
  const [openCount, setOpenCount] = useState(0);
  const due = nextDueMonth(state.runs, params.anObligatie);
  const nextCode =
    due <= 12
      ? sessionCode(params.anObligatie, due, (state.contorSesiuni[`${params.anObligatie}-${String(due).padStart(2, '0')}`] ?? 0) + 1)
      : null;

  useEffect(() => {
    if (open) {
      setOpenCount((c) => c + 1);
      const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
      return () => clearTimeout(t);
    }
  }, [open]);

  const ease = 'ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none';
  return (
    <section
      ref={ref}
      aria-label="Alocare nouă"
      className={`scroll-mt-4 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-500 ${ease} ${
        open ? 'border-gray-300 bg-white shadow-[0_12px_32px_-12px_rgba(16,24,40,0.25)]' : 'border-dashed border-gray-300 bg-gray-50/80'
      }`}
    >
      <div className={`flex flex-wrap justify-between gap-4 px-5 py-4 ${open ? 'items-center' : 'items-end'}`}>
        <div className="flex min-w-[260px] flex-1 items-start gap-3">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-500 ${ease} ${
              open ? 'bg-ink text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200'
            }`}
          >
            <Sparkles size={17} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Alocare nouă</h3>
            <p className="text-sm text-gray-600">
              {due <= 12 ? (
                <>
                  Următoarea lună de alocat: <strong className="font-semibold text-gray-800">{LUNI[due - 1]} {params.anObligatie}</strong>
                  {nextCode && (
                    <>
                      {' '}
                      · ID sesiune: <span className="font-mono text-xs text-gray-800">{nextCode}</span>
                    </>
                  )}
                </>
              ) : (
                `Toate lunile din ${params.anObligatie} au fost alocate.`
              )}
            </p>
          </div>
        </div>
        <div className="relative flex flex-wrap items-end gap-3">
          <div
            className={`overflow-hidden transition-all duration-300 ${ease} ${open ? 'pointer-events-none max-h-0 max-w-0 opacity-0' : 'max-h-40 max-w-[640px] opacity-100'}`}
            aria-hidden={open}
          >
            <PeriodPicker value={params} onChange={onParamsChange} compact />
          </div>
          {open ? (
            <button
              type="button"
              onClick={panel.onCancel}
              aria-label="Închide panoul de alocare nouă"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={18} />
            </button>
          ) : (
            <Button icon={<Plus size={16} />} onClick={onOpen} aria-expanded={open}>
              Alocare nouă
            </Button>
          )}
        </div>
      </div>
      <div className={`grid transition-[grid-template-rows] duration-500 ${ease}`} style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="min-h-0 overflow-hidden">
          <div
            className={`transition-[opacity,transform] duration-500 ${ease} ${open ? 'translate-y-0 opacity-100 delay-150' : '-translate-y-3 opacity-0'}`}
            inert={!open}
          >
            {openCount > 0 && <NewAllocationPanel key={openCount} initial={params} {...panel} />}
          </div>
        </div>
      </div>
    </section>
  );
}
