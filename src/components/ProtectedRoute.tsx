import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import { usePermissions } from '../hooks/usePermissions';
import type { ModuleRouteId } from '../types/navigation';

interface ProtectedRouteProps {
  moduleId: ModuleRouteId;
  children: ReactNode;
}

export function ProtectedRoute({ moduleId, children }: ProtectedRouteProps) {
  const { canAccess, roleLabel, defaultRoute } = usePermissions();
  const { navigateTo } = useNavigation();

  if (!canAccess(moduleId)) {
    return (
      <div className="rounded-xl border border-[#DDE6E1] bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#B91C1C]">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-base font-semibold text-[#102D27]">
          Acesso restrito para o perfil {roleLabel}
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#5C6B66]">
          Este módulo exige permissões administrativas ou operacionais específicas. A proteção de rotas espelha as políticas RLS aplicadas no PostgreSQL.
        </p>
        <button
          type="button"
          onClick={() => navigateTo(defaultRoute)}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#102D27] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#20483B] cursor-pointer"
        >
          Ir para página inicial permitida
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
