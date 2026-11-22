import { getSupabaseClient, isSupabaseConfigured } from '../integrations/supabase/client';
import { AppServiceError } from '../lib/errors';
import type { MessageTemplate, Tenant } from '../types/database';

export const tenantService = {
  async fetchTenantById(tenantId: string): Promise<Tenant | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (error) {
      throw new AppServiceError(error.message, 'TENANT_FETCH_ERROR');
    }
    return (data as Tenant | null) ?? null;
  },

  async fetchMessageTemplates(tenantId: string): Promise<MessageTemplate[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppServiceError(error.message, 'TEMPLATES_FETCH_ERROR');
    }
    return (data as MessageTemplate[]) ?? [];
  },

  async checkDatabaseConnectivity(): Promise<{
    clientConfigured: boolean;
    serverConfigured: boolean;
  }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        return {
          clientConfigured: isSupabaseConfigured(),
          serverConfigured: false,
        };
      }
      const data = await res.json();
      return {
        clientConfigured: Boolean(data?.supabase?.clientConfigured) || isSupabaseConfigured(),
        serverConfigured: Boolean(data?.supabase?.serverConfigured),
      };
    } catch {
      return {
        clientConfigured: isSupabaseConfigured(),
        serverConfigured: false,
      };
    }
  },
};
