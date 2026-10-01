import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ChartPie,
  ChevronLeft,
  FileText,
  FolderOpen,
  LayoutGrid,
  ListTree,
  LogOut,
  Plus,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from './Logo';
import { useStore } from '../../data/store';

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
}

const ADMIN_MENU: Item[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/admin/raportari', label: 'Raportări clienți', icon: FileText },
  { to: '/admin/cantitati-colectate', label: 'Cantități colectate', icon: Scale },
  { to: '/admin/alocari', label: 'Alocări DEEE', icon: ChartPie },
  { to: '/admin/clienti', label: 'Clienți', icon: Users },
  { to: '/admin/categorii', label: 'Categorii EEE', icon: ListTree },
  { to: '/admin/administratori', label: 'Administratori', icon: Users },
  { to: '/admin/rapoarte', label: 'Rapoarte', icon: BarChart3 },
];

// Meniul unic de client (MOD-10)
const CLIENT_MENU: Item[] = [
  { to: '/client/panou', label: 'Panou principal', icon: LayoutGrid },
  { to: '/client/raportari', label: 'Raportări EEE', icon: FileText },
  { to: '/client/alocari', label: 'Alocări EEE', icon: ChartPie },
  { to: '/client/rapoarte', label: 'Rapoarte', icon: BarChart3 },
  { to: '/client/notificari', label: 'Notificări', icon: Bell },
  { to: '/client/documente', label: 'Documente', icon: FolderOpen },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { state } = useStore();
  const role = state.role;
  const menu = role.tip === 'admin' ? ADMIN_MENU : CLIENT_MENU;
  const user =
    role.tip === 'admin'
      ? (() => {
          const a = state.admins.find((x) => x.id === role.adminId)!;
          return { name: a.nume, sub: a.email };
        })()
      : (() => {
          const c = state.clients.find((x) => x.id === role.clientId)!;
          return { name: c.denumire, sub: `CUI ${c.cui}` };
        })();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar text-gray-200 transition-[width] duration-200 ${
        collapsed ? 'w-[72px]' : 'w-[256px]'
      }`}
    >
      <div className="relative flex h-[78px] items-center justify-center border-b border-sidebar-line">
        <Logo compact={collapsed} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
          className="absolute top-1/2 -right-[18px] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-line bg-sidebar text-gray-200 hover:text-white"
        >
          <ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-lg px-3 text-[14.5px] transition-colors ${
                isActive ? 'bg-sidebar-active font-semibold text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={19} strokeWidth={1.6} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-line p-4">
        {role.tip === 'admin' && (
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-medium text-gray-900 hover:bg-gray-100"
          >
            <Plus size={17} />
            {!collapsed && 'Client nou'}
          </button>
        )}
      </div>
      <div className="border-t border-sidebar-line px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-card px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="truncate text-xs text-gray-400">{user.sub}</div>
            </div>
          )}
        </div>
        <button type="button" className="mt-3 flex items-center gap-2 px-3 py-1 text-sm text-gray-300 hover:text-white">
          <LogOut size={16} />
          {!collapsed && 'Deconectare'}
        </button>
      </div>
    </aside>
  );
}
