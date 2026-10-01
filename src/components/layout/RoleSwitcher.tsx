import { useNavigate } from 'react-router-dom';
import { RotateCcw, UserCog } from 'lucide-react';
import { useActions, useStore } from '../../data/store';

/** Comutator de perspectivă, doar pentru prototip: admin (două conturi, pentru fluxul de aprobare) sau client. */
export function RoleSwitcher() {
  const { state } = useStore();
  const { setRole, reset } = useActions();
  const navigate = useNavigate();
  const value = state.role.tip === 'admin' ? `admin:${state.role.adminId}` : `client:${state.role.clientId}`;
  const clients = [...state.clients].sort((a, b) => a.denumire.localeCompare(b.denumire, 'ro'));

  return (
    <div className="no-print fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-gray-900/95 py-1.5 pr-1.5 pl-4 text-xs text-gray-100 shadow-lg ring-1 ring-black/10">
      <UserCog size={15} className="text-leaf" />
      <span className="font-medium text-gray-300">Prototip · perspectivă:</span>
      <select
        aria-label="Perspectivă"
        value={value}
        onChange={(e) => {
          const [tip, id] = e.target.value.split(':');
          if (tip === 'admin') {
            setRole({ tip: 'admin', adminId: id });
            if (state.role.tip !== 'admin') navigate('/admin/alocari');
          } else {
            setRole({ tip: 'client', clientId: id });
            navigate('/client/alocari');
          }
        }}
        className="max-w-[260px] rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-white focus:outline-none"
      >
        <optgroup label="Administratori">
          {state.admins.map((a) => (
            <option key={a.id} value={`admin:${a.id}`}>
              Admin · {a.nume}
            </option>
          ))}
        </optgroup>
        <optgroup label="Clienți">
          {clients.map((c) => (
            <option key={c.id} value={`client:${c.id}`}>
              Client · {c.denumire}
            </option>
          ))}
        </optgroup>
      </select>
      <button
        type="button"
        title="Resetează datele demo"
        onClick={() => {
          if (confirm('Resetezi datele demo? Rulările create în prototip se pierd.')) reset();
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
