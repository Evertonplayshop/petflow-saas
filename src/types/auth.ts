import type { Session, User } from '@supabase/supabase-js';
import type { AppRole, Membership, Profile, Tenant } from '../types/database';

export type AuthScreen =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password';

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  memberships: Membership[];
  activeTenant: Tenant | null;
  activeRole: AppRole | null;
  isLoading: boolean;
  isConfigured: boolean;
  isStructuralPreview: boolean;
  error: string | null;
}

export interface RegisterTenantPayload {
  companyName: string;
  companySlug?: string;
  legalName?: string;
  documentNumber?: string;
  companyPhone?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
}

export interface RegisterTenantResponse {
  tenantId: string | null;
  membershipId: string | null;
  slug: string;
  ownerUserId: string;
}
