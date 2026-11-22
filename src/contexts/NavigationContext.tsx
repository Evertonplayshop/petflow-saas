import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NAV_ITEMS } from '../lib/constants';
import type { AuthScreen } from '../types/auth';
import type { ModuleRouteId } from '../types/navigation';

interface NavigationContextValue {
  activeModule: ModuleRouteId;
  navigateTo: (moduleId: ModuleRouteId) => void;
  authScreen: AuthScreen;
  setAuthScreen: (screen: AuthScreen) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

function getInitialAuthScreen(): AuthScreen {
  if (typeof window === 'undefined') return 'login';
  const params = new URLSearchParams(window.location.search);
  return params.get('auth') === 'reset' ? 'reset-password' : 'login';
}

function getInitialModule(): ModuleRouteId {
  if (typeof window === 'undefined') return 'dashboard';
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get('module') as ModuleRouteId | null;
  if (candidate && NAV_ITEMS.some((item) => item.id === candidate)) {
    return candidate;
  }
  return 'dashboard';
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<ModuleRouteId>(getInitialModule);
  const [authScreen, setAuthScreen] = useState<AuthScreen>(getInitialAuthScreen);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = useCallback((moduleId: ModuleRouteId) => {
    setActiveModule(moduleId);
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      activeModule,
      navigateTo,
      authScreen,
      setAuthScreen,
      isMobileMenuOpen,
      setMobileMenuOpen,
      toggleMobileMenu,
    }),
    [activeModule, navigateTo, authScreen, isMobileMenuOpen, toggleMobileMenu]
  );

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation deve ser utilizado dentro de NavigationProvider.');
  }
  return ctx;
}
