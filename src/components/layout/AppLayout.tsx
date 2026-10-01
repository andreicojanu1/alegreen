import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RoleSwitcher } from './RoleSwitcher';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  return (
    <div className="min-h-full">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className={`min-h-full transition-[margin] duration-200 ${collapsed ? 'ml-[72px]' : 'ml-[256px]'}`}>
        <div className="px-6 pt-6 pb-20">
          <Outlet />
        </div>
      </main>
      <RoleSwitcher />
    </div>
  );
}
