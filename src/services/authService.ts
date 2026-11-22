import { getSupabaseClient } from '../integrations/supabase/client';
import { AppServiceError } from '../lib/errors';
import type { RegisterTenantPayload, RegisterTenantResponse } from '../types/auth';
import type { Membership, Profile } from '../types/database';

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new AppServiceError(
        'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para autenticar.',
        'SUPABASE_NOT_CONFIGURED'
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new AppServiceError(error.message, 'AUTH_SIGNIN_ERROR');
    }
    return data;
  },

  async signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AppServiceError(error.message, 'AUTH_SIGNOUT_ERROR');
    }
  },

  async sendPasswordReset(email: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new AppServiceError(
        'Supabase não configurado. Configure as credenciais antes de solicitar recuperação de senha.',
        'SUPABASE_NOT_CONFIGURED'
      );
    }

    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/?auth=reset` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      throw new AppServiceError(error.message, 'AUTH_RESET_ERROR');
    }
  },

  async updatePassword(password: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new AppServiceError(
        'Supabase não configurado. Configure as credenciais antes de redefinir a senha.',
        'SUPABASE_NOT_CONFIGURED'
      );
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new AppServiceError(error.message, 'AUTH_PASSWORD_UPDATE_ERROR');
    }
  },

  async registerTenantAndOwner(
    payload: RegisterTenantPayload
  ): Promise<RegisterTenantResponse> {
    const response = await fetch('/api/tenants/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AppServiceError(
        json.message || 'Falha ao cadastrar empresa e proprietário.',
        json.error || 'TENANT_REGISTER_FAILED',
        response.status
      );
    }

    return json as RegisterTenantResponse;
  },

  async fetchUserContext(userId: string, accessToken?: string): Promise<{
    profile: Profile | null;
    memberships: Membership[];
  }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { profile: null, memberships: [] };
    }

    // Verifica permissões também no backend quando token está disponível
    if (accessToken) {
      try {
        const res = await fetch('/api/auth/permissions', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          return {
            profile: (data.profile as Profile | null) ?? null,
            memberships: (data.memberships as Membership[]) ?? [],
          };
        }
      } catch {
        // Continua com consulta direta autenticada via RLS
      }
    }

    const [{ data: profile, error: profileError }, { data: memberships, error: memError }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('memberships')
          .select(
            'id, tenant_id, user_id, role, is_active, accepted_at, created_at, tenant:tenants(*)'
          )
          .eq('user_id', userId)
          .eq('is_active', true),
      ]);

    if (profileError) {
      throw new AppServiceError(profileError.message, 'PROFILE_FETCH_ERROR');
    }
    if (memError) {
      throw new AppServiceError(memError.message, 'MEMBERSHIPS_FETCH_ERROR');
    }

    return {
      profile: (profile as Profile | null) ?? null,
      memberships: (memberships as unknown as Membership[]) ?? [],
    };
  },
};
