import {
  BarChart3,
  Boxes,
  Calendar,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  PawPrint,
  Scissors,
  Settings,
  ShoppingBag,
  Truck,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { usePermissions } from '../hooks/usePermissions';
import { NAV_GROUPS, NAV_ITEMS } from '../lib/constants';
import type { NavGroupId, NavItem } from '../types/navigation';
import { BrandLogo } from './BrandLogo';

const ICON_MAP: Record<NavItem['iconName'], LucideIcon> = {
  LayoutDashboard,
  Calendar,
  Users,
  PawPrint,
  Scissors,
  ShoppingBag,
  Package,
  Boxes,
  Truck,
  Wallet,
  BarChart3,
  MessageCircle,
  UserCog,
  Settings,
};

const GROUP_ORDER: NavGroupId[] = ['operacao', 'catalogo', 'gestao', 'sistema'];

export function Sidebar() {
  const { activeModule, navigateTo, isMobileMenuOpen, setMobileMenuOpen } =
    useNavigation();
  const {
    profile,
    activeTenant,
    isStructuralPreview,
    signOut,
    exitStructuralPreview,
  } = useAuth();
  const { canAccess, roleLabel } = usePermissions();

  const renderSidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-[#102D27] text-white">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <BrandLogo variant="light" />
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar menu de navegação"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B8F0D1] transition-colors hover:bg-[#20483B] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tenant Summary */}
      <div className="border-b border-white/10 px-5 py-3.5">
        <p className="text-[11px] font-medium tracking-wide text-[#B8F0D1]/80">
          {isStructuralPreview ? 'Modo Estrutural' : 'Empresa Ativa'}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-white">
          {activeTenant?.name ??
            (isStructuralPreview ? 'Workspace Sem Conexão' : 'Nenhuma empresa vinculada')}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/65">
          Perfil: {roleLabel}
        </p>
      </div>

      {/* Navigation Groups */}
      <nav
        aria-label="Navegação principal do sistema"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      >
        {GROUP_ORDER.map((groupId) => {
          const items = NAV_ITEMS.filter(
            (item) => item.group === groupId && canAccess(item.id)
          );
          if (items.length === 0) return null;

          return (
            <div key={groupId}>
              <p className="px-3 text-[11px] font-medium text-[#B8F0D1]/65">
                {NAV_GROUPS[groupId]}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {items.map((item) => {
                  const Icon = ICON_MAP[item.iconName];
                  const isActive = activeModule === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-[#20483B] text-[#B8F0D1]'
                            : 'text-white/80 hover:bg-[#20483B]/60 hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-[#B8F0D1]' : 'text-white/65'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Account Footer */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">
              {profile?.full_name ??
                (isStructuralPreview ? 'Visitante Estrutural' : 'Usuário')}
            </p>
            <p className="truncate text-[11px] text-white/60">
              {profile?.email ?? 'Configuração pendente'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              isStructuralPreview ? exitStructuralPreview() : void signOut()
            }
            aria-label={isStructuralPreview ? 'Voltar para tela de login' : 'Sair da conta'}
            title={isStructuralPreview ? 'Voltar ao login' : 'Sair'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-[#20483B] hover:text-[#B8F0D1] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-[260px]">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile / Tablet Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navegação">
          <div
            className="fixed inset-0 bg-[#102D27]/50 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-[272px] max-w-[85vw] shadow-xl">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
