import { getSupabaseClient } from '../integrations/supabase/client';
import { AppServiceError } from '../lib/errors';

export interface BillingStatus {
  planName: string;
  priceCents: number;
  currency: 'BRL';
  billingInterval: 'month';
  checkoutUrl: string;
  tenant: {
    id?: string;
    plan_tier?: 'starter' | 'professional' | 'enterprise';
    subscription_status?: 'trialing' | 'active' | 'past_due' | 'cancelled';
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  } | null;
}

export const billingService = {
  async fetchStatus(): Promise<BillingStatus> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new AppServiceError(
        'Supabase não configurado.',
        'SUPABASE_NOT_CONFIGURED'
      );
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new AppServiceError('Sessão inválida.', 'UNAUTHORIZED');
    }

    const response = await fetch('/api/billing/status', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AppServiceError(
        json.message || 'Não foi possível consultar a assinatura.',
        json.error || 'BILLING_STATUS_ERROR',
        response.status
      );
    }
    return json as BillingStatus;
  },
};
