import { Eye, EyeOff } from 'lucide-react';
import { useActions, useStore } from '../../data/store';

export function VisibilityBanner() {
  const { state } = useStore();
  const { setVisibility } = useActions();
  const on = state.clientVisibility;
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4">
      <div className="flex items-start gap-4">
        {on ? <Eye size={20} className="mt-0.5 text-green-600" /> : <EyeOff size={20} className="mt-0.5 text-gray-500" />}
        <div>
          <div className="text-sm font-semibold text-gray-900">Vizibilitate pentru clienți: {on ? 'activă' : 'oprită'}</div>
          <div className="text-xs text-gray-600">
            {on
              ? 'Clienții văd ultima rulare finalizată în ecranul „Alocări EEE".'
              : 'Clienții nu văd nimic din acest modul; ecranul lor „Alocări EEE" rămâne cel de până acum.'}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setVisibility(!on)}
        className={`h-10 rounded-md px-4 text-sm font-semibold ${
          on ? 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50' : 'bg-ink text-white hover:bg-gray-800'
        }`}
      >
        {on ? 'Oprește vizibilitatea' : 'Publică pentru clienți'}
      </button>
    </div>
  );
}
