import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../integrations/supabase/client';
import { extractErrorMessage } from '../lib/errors';
import { authService } from '../services/authService';
import type { AuthState, RegisterTenantPayload, RegisterTenantResponse } from '../types/auth';
import type { AppRole, Membership, Tenant } from '../types/database';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerTenantAndOwner: (payload: RegisterTenantPayload) => Promise<RegisterTenantResponse>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  switchTenant: (tenantId: string) => void;
  enterStructuralPreview: (role?: AppRole) => void;
  exitStructuralPreview: () => void;
  setPreviewRole: (role: AppRole) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function resolveInitialPreviewParam(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1' || params.get('preview') === 'shell';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();

  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    memberships: [],
    activeTenant: null,
    activeRole: null,
    isLoading: configured,
    isConfigured: configured,
    isStructuralPreview: !configured && resolveInitialPreviewParam(),
    error: null,
  });

  const hydrateUserSession = useCallback(async (userId: string, accessToken?: string) => {
    try {
      const { profile, memberships } = await authService.fetchUserContext(userId, accessToken);
      const defaultTenantId = profile?.default_tenant_id;
      const primaryMembership: Membership | undefined =
        memberships.find((m) => m.tenant_id === defaultTenantId) ?? memberships[0];

      const resolvedRole: AppRole | null = profile?.is_super_admin
        ? 'super_admin'
        : primaryMembership?.role ?? null;

      const resolvedTenant: Tenant | null = primaryMembership?.tenant ?? null;

      setState((prev) => ({
        ...prev,
        profile,
        memberships,
        activeTenant: resolvedTenant,
        activeRole: resolvedRole,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err, 'Erro ao carregar dados da empresa vinculada.'),
      }));
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setState((prev) => ({
        ...prev,
        isConfigured: false,
        isLoading: false,
      }));
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
          return;
        }
        const session = data.session;
        if (session?.user) {
          setState((prev) => ({
            ...prev,
            session,
            user: session.user,
          }));
          void hydrateUserSession(session.user.id, session.access_token);
        } else {
          setState((prev) => ({
            ...prev,
            session: null,
            user: null,
            isLoading: false,
          }));
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: extractErrorMessage(err),
        }));
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          session,
          user: session.user,
          isStructuralPreview: false,
        }));
        void hydrateUserSession(session.user.id, session.access_token);
      } else {
        setState((prev) => ({
          ...prev,
          session: null,
          user: null,
          profile: null,
          memberships: [],
          activeTenant: null,
          activeRole: null,
          isLoading: false,
        }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUserSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.signIn(email, password);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err, 'Não foi possível entrar.'),
      }));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.signOut();
      setState((prev) => ({
        ...prev,
        session: null,
        user: null,
        profile: null,
        memberships: [],
        activeTenant: null,
        activeRole: null,
        isStructuralPreview: false,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err),
      }));
    }
  }, []);

  const registerTenantAndOwner = useCallback(async (payload: RegisterTenantPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authService.registerTenantAndOwner(payload);
      setState((prev) => ({ ...prev, isLoading: false }));
      return result;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err),
      }));
      throw err;
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.sendPasswordReset(email);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err),
      }));
      throw err;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.updatePassword(password);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: extractErrorMessage(err),
      }));
      throw err;
    }
  }, []);

  const switchTenant = useCallback((tenantId: string) => {
    setState((prev) => {
      const membership = prev.memberships.find((m) => m.tenant_id === tenantId);
      if (!membership) return prev;
      return {
        ...prev,
        activeTenant: membership.tenant ?? null,
        activeRole: prev.profile?.is_super_admin ? 'super_admin' : membership.role,
      };
    });
  }, []);

  const enterStructuralPreview = useCallback((role: AppRole = 'owner') => {
    setState((prev) => ({
      ...prev,
      isStructuralPreview: true,
      activeRole: role,
      error: null,
    }));
  }, []);

  const exitStructuralPreview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isStructuralPreview: false,
      activeRole: null,
      error: null,
    }));
  }, []);

  const setPreviewRole = useCallback((role: AppRole) => {
    setState((prev) => {
      if (!prev.isStructuralPreview) return prev;
      return {
        ...prev,
        activeRole: role,
      };
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      registerTenantAndOwner,
      sendPasswordReset,
      updatePassword,
      switchTenant,
      enterStructuralPreview,
      exitStructuralPreview,
      setPreviewRole,
      clearError,
    }),
    [
      state,
      signIn,
      signOut,
      registerTenantAndOwner,
      sendPasswordReset,
      updatePassword,
      switchTenant,
      enterStructuralPreview,
      exitStructuralPreview,
      setPreviewRole,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
