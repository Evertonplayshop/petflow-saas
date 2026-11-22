import { Menu, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { NAV_ITEMS } from '../lib/constants';
import type { AppRole } from '../types/database';
import { ROLE_LABELS } from '../utils/rbac';

interface TopHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const PREVIEW_ROLES: AppRole[] = [
  'owner',
  'manager',
  'attendant',
  'stock_clerk',
  'employee',
  'super_admin',
];

export function TopHeader({ onRefresh, isRefreshing = false }: TopHeaderProps) {
  const { activeModule, navigateTo, toggleMobileMenu } = useNavigation();
  const {
    memberships,
    activeTenant,
    activeRole,
    switchTenant,
    isStructuralPreview,
    setPreviewRole,
  } = useAuth();

  const currentItem = NAV_ITEMS.find((i) => i.id === activeModule) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#DDE6E1] bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Abrir navegação"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DDE6E1] bg-white text-[#102D27] transition-colors hover:bg-[#F4F7F5] lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#5C6B66]">
            <span className="truncate">PETFLOW</span>
            <span aria-hidden="true">/</span>
            <span className="truncate font-medium text-[#20483B]">
              {currentItem.label}
            </span>
          </div>
          <h1 className="truncate font-display text-base font-semibold text-[#102D27] sm:text-lg">
            {currentItem.label}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Multi-tenant switcher when user belongs to multiple companies */}
        {memberships.length > 1 && (
          <label className="hidden sm:flex items-center gap-2 text-xs text-[#5C6B66]">
            <span className="sr-only">Selecionar empresa</span>
            <select
              value={activeTenant?.id ?? ''}
              onChange={(e) => switchTenant(e.target.value)}
              className="h-9 rounded-lg border border-[#DDE6E1] bg-white px-3 text-xs font-medium text-[#102D27] focus:border-[#20483B] focus:outline-none"
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.tenant_id}>
                  {m.tenant?.name ?? m.tenant_id}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Role preview switcher only when exploring structural preview without Supabase */}
        {isStructuralPreview && (
          <label className="hidden md:flex items-center gap-2 text-xs text-[#5C6B66]">
            <span className="whitespace-nowrap">Simular perfil:</span>
            <select
              aria-label="Simular perfil de acesso"
              value={activeRole ?? 'owner'}
              onChange={(e) => setPreviewRole(e.target.value as AppRole)}
              className="h-9 rounded-lg border border-[#DDE6E1] bg-[#F4F7F5] px-2.5 text-xs font-medium text-[#102D27] focus:border-[#20483B] focus:outline-none"
            >
              {PREVIEW_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar dados"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE6E1] bg-white px-3 text-xs font-medium text-[#102D27] transition-colors hover:bg-[#F4F7F5] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        )}

        {isStructuralPreview && (
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            aria-label="Visão Geral do Dashboard"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#102D27] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#20483B] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Visão Geral</span>
          </button>
        )}
      </div>
    </header>
  );
}
