import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './data/store';
import { AppLayout } from './components/layout/AppLayout';
import { AllocationsPage } from './pages/admin/AllocationsPage';
import { AllocationRunPage } from './pages/admin/AllocationRunPage';
import { CollectedPage } from './pages/admin/CollectedPage';
import { ClientAllocationsPage } from './pages/client/ClientAllocationsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import type { ReactNode } from 'react';

const ADMIN_PLACEHOLDERS: [string, string][] = [
  ['dashboard', 'Dashboard'],
  ['raportari', 'Raportări clienți'],
  ['clienti', 'Clienți'],
  ['categorii', 'Categorii EEE'],
  ['administratori', 'Administratori'],
  ['rapoarte', 'Rapoarte'],
];
const CLIENT_PLACEHOLDERS: [string, string][] = [
  ['panou', 'Panou principal'],
  ['raportari', 'Raportări EEE'],
  ['rapoarte', 'Rapoarte'],
  ['notificari', 'Notificări'],
  ['documente', 'Documente'],
];

/** Rutele de admin nu sunt accesibile din perspectiva client (și invers) — în producție, verificarea e pe server. */
function RequireRole({ tip, children }: { tip: 'admin' | 'client'; children: ReactNode }) {
  const { state } = useStore();
  if (state.role.tip !== tip) return <Navigate to={state.role.tip === 'admin' ? '/admin/alocari' : '/client/alocari'} replace />;
  return <>{children}</>;
}

function Home() {
  const { state } = useStore();
  return <Navigate to={state.role.tip === 'admin' ? '/admin/alocari' : '/client/alocari'} replace />;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="admin" element={<RequireRole tip="admin"><OutletShim /></RequireRole>}>
              <Route path="alocari" element={<AllocationsPage />} />
              <Route path="alocari/:runId" element={<AllocationRunPage />} />
              <Route path="cantitati-colectate" element={<CollectedPage />} />
              {ADMIN_PLACEHOLDERS.map(([p, t]) => (
                <Route key={p} path={p} element={<PlaceholderPage title={t} />} />
              ))}
            </Route>
            <Route path="client" element={<RequireRole tip="client"><OutletShim /></RequireRole>}>
              <Route path="alocari" element={<ClientAllocationsPage />} />
              {CLIENT_PLACEHOLDERS.map(([p, t]) => (
                <Route key={p} path={p} element={<PlaceholderPage title={t} />} />
              ))}
            </Route>
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

function OutletShim() {
  return <Outlet />;
}
