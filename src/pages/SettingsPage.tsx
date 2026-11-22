import { useEffect, useState } from 'react';
import { CheckCircle2, CloudUpload, CreditCard, Database, ExternalLink, FileCode2, Settings, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseEnvConfig } from '../integrations/supabase/config';
import { tenantService } from '../services/tenantService';
import { billingService, type BillingStatus } from '../services/billingService';
import { storageService } from '../services/storageService';

const MIGRATION_FILES = [
  {
    file: 'migrations/001_initial_schema.sql',
    purpose: '18 tabelas multiempresa com tenant_id, FKs, índices e triggers updated_at',
  },
  {
    file: 'migrations/002_rls_policies.sql',
    purpose: 'RLS habilitado em todas as tabelas e funções SECURITY DEFINER de isolamento',
  },
  {
    file: 'migrations/003_auth_and_tenant_rpc.sql',
    purpose: 'Sync auth.users -> profiles e RPC transacional create_tenant_with_owner',
  },
  {
    file: 'migrations/004_storage_and_seed_templates.sql',
    purpose: 'Buckets tenant-logos, pet-photos e product-images isolados por tenant_id',
  },
  {
    file: 'migrations/005_cakto_monthly_billing.sql',
    purpose: 'Assinatura mensal Cakto, histórico de eventos e campos de renovação',
  },
];

export function SettingsPage() {
  const { activeTenant, isConfigured } = useAuth();
  const envConfig = getSupabaseEnvConfig();
  const [serverSupabaseOk, setServerSupabaseOk] = useState<boolean | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(activeTenant?.logo_url ?? null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    setLogoUrl(activeTenant?.logo_url ?? null);
  }, [activeTenant?.logo_url]);

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file || !activeTenant) return;
    setStorageError(null);
    setIsUploadingLogo(true);
    try {
      const url = await storageService.uploadTenantLogo(activeTenant.id, file);
      setLogoUrl(url);
    } catch (err) {
      setStorageError(err instanceof Error ? err.message : 'Erro ao enviar logotipo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    tenantService
      .checkDatabaseConnectivity()
      .then((res) => setServerSupabaseOk(res.serverConfigured))
      .catch(() => setServerSupabaseOk(false));

    if (isConfigured) {
      billingService
        .fetchStatus()
        .then(setBilling)
        .catch((err) => setBillingError(err instanceof Error ? err.message : 'Erro ao consultar plano.'));
    }
  }, [isConfigured]);

  return (
    <div className="space-y-6">
      {/* Supabase Configuration & Diagnostics */}
      <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
        <div className="flex items-start gap-3.5 border-b border-[#EDF2EF] pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E9F4EE] text-[#102D27]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-[#102D27]">
              Configuração do Supabase e Variáveis de Ambiente
            </h2>
            <p className="mt-0.5 text-xs text-[#5C6B66]">
              Estado real das credenciais de cliente e servidor. A chave <code className="font-mono text-[#102D27]">service_role</code> nunca é exposta no frontend.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-[#102D27]">
                VITE_SUPABASE_URL
              </span>
              {envConfig.url ? (
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              ) : (
                <XCircle className="h-4 w-4 text-[#DC2626]" />
              )}
            </div>
            <p className="mt-1.5 text-xs text-[#5C6B66]">
              {envConfig.url ? 'Configurada no cliente' : 'Não configurada'}
            </p>
          </div>

          <div className="rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-[#102D27]">
                VITE_SUPABASE_ANON_KEY
              </span>
              {envConfig.anonKey ? (
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              ) : (
                <XCircle className="h-4 w-4 text-[#DC2626]" />
              )}
            </div>
            <p className="mt-1.5 text-xs text-[#5C6B66]">
              {envConfig.anonKey ? 'Configurada no cliente' : 'Não configurada'}
            </p>
          </div>

          <div className="rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-[#102D27]">
                SUPABASE_SERVICE_ROLE_KEY
              </span>
              {serverSupabaseOk ? (
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              ) : (
                <XCircle className="h-4 w-4 text-[#DC2626]" />
              )}
            </div>
            <p className="mt-1.5 text-xs text-[#5C6B66]">
              {serverSupabaseOk === null
                ? 'Verificando servidor...'
                : serverSupabaseOk
                ? 'Ativa apenas no backend'
                : 'Não configurada no servidor'}
            </p>
          </div>
        </div>
      </section>

      {/* Tenant Commercial Settings Blueprint */}
      <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
        <div className="flex items-start gap-3.5 border-b border-[#EDF2EF] pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F7F5] text-[#20483B]">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-[#102D27]">
              Dados da Empresa (Tenant)
            </h2>
            <p className="mt-0.5 text-xs text-[#5C6B66]">
              Identidade comercial, logotipo no bucket <code className="font-mono text-[#102D27]">tenant-logos</code> e fuso horário.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div>
            <span className="text-[#5C6B66]">Nome Fantasia</span>
            <p className="mt-1 font-medium text-[#102D27]">
              {activeTenant?.name ?? (isConfigured ? '—' : 'Aguardando conexão')}
            </p>
          </div>
          <div>
            <span className="text-[#5C6B66]">Identificador (Slug)</span>
            <p className="mt-1 font-mono text-[#102D27]">
              {activeTenant?.slug ?? '—'}
            </p>
          </div>
          <div>
            <span className="text-[#5C6B66]">Plano SaaS</span>
            <p className="mt-1 font-medium text-[#102D27]">
              {activeTenant?.plan_tier ?? '—'}
            </p>
          </div>
          <div>
            <span className="text-[#5C6B66]">E-mail Comercial</span>
            <p className="mt-1 text-[#102D27]">{activeTenant?.email ?? '—'}</p>
          </div>
          <div>
            <span className="text-[#5C6B66]">WhatsApp</span>
            <p className="mt-1 font-mono text-[#102D27]">
              {activeTenant?.whatsapp_phone ?? '—'}
            </p>
          </div>
          <div>
            <span className="text-[#5C6B66]">Fuso Horário / Moeda</span>
            <p className="mt-1 font-mono text-[#102D27]">
              {activeTenant
                ? `${activeTenant.timezone} · ${activeTenant.currency}`
                : 'America/Sao_Paulo · BRL'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] p-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DDE6E1] bg-white">
            {logoUrl ? (
              <img src={logoUrl} alt="Logotipo da empresa" className="h-full w-full object-contain" />
            ) : (
              <CloudUpload className="h-6 w-6 text-[#94A3B8]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#102D27]">Logotipo da empresa</p>
            <p className="mt-1 text-xs text-[#5C6B66]">
              PNG, JPG ou WebP até 2 MB. Arquivo armazenado no bucket <code className="font-mono">tenant-logos</code>.
            </p>
            {storageError && (
              <p role="alert" className="mt-1.5 text-xs text-[#DC2626]">{storageError}</p>
            )}
          </div>
          <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#DDE6E1] bg-white px-3 text-xs font-medium text-[#102D27] hover:bg-[#F4F7F5]">
            {isUploadingLogo ? 'Enviando...' : 'Enviar logotipo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={!activeTenant || isUploadingLogo}
              onChange={(event) => void handleLogoUpload(event.target.files?.[0])}
            />
          </label>
        </div>
      </section>

      {/* Cakto Monthly Subscription */}
      <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
        <div className="flex items-start gap-3.5 border-b border-[#EDF2EF] pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF9F3] text-[#20483B]">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-[#102D27]">
              Plano mensal PETFLOW
            </h2>
            <p className="mt-0.5 text-xs text-[#5C6B66]">
              Assinatura mensal processada pela Cakto.
            </p>
          </div>
        </div>

        {billingError && (
          <p role="alert" className="mt-4 text-xs text-[#DC2626]">{billingError}</p>
        )}

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
            <div>
              <span className="text-[#5C6B66]">Plano</span>
              <p className="mt-1 font-medium text-[#102D27]">
                {billing?.planName ?? 'PETFLOW Mensal'}
              </p>
            </div>
            <div>
              <span className="text-[#5C6B66]">Valor mensal</span>
              <p className="mt-1 font-medium text-[#102D27]">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format((billing?.priceCents ?? 5000) / 100)}
              </p>
            </div>
            <div>
              <span className="text-[#5C6B66]">Status</span>
              <p className="mt-1 font-medium text-[#102D27]">
                {billing?.tenant?.subscription_status === 'active'
                  ? 'Ativa'
                  : billing?.tenant?.subscription_status === 'past_due'
                    ? 'Pagamento pendente'
                    : billing?.tenant?.subscription_status === 'cancelled'
                      ? 'Cancelada'
                      : 'Em teste / pagamento não confirmado'}
              </p>
            </div>
          </div>

          {billing?.checkoutUrl && (
            <a
              href={billing.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#102D27] px-4 text-xs font-medium text-white hover:bg-[#20483B]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Assinar mensalmente
            </a>
          )}
        </div>
      </section>

      {/* Migrations Checklist */}
      <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
        <div className="flex items-center gap-2.5 border-b border-[#EDF2EF] pb-3.5">
          <FileCode2 className="h-4.5 w-4.5 text-[#20483B]" />
          <div>
            <h3 className="text-sm font-semibold text-[#102D27]">
              Migrations SQL e Políticas RLS Preparadas
            </h3>
            <p className="text-xs text-[#5C6B66]">
              Execute os scripts abaixo em ordem no SQL Editor ou CLI do Supabase.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#EDF2EF]">
          {MIGRATION_FILES.map((item) => (
            <div
              key={item.file}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <code className="font-mono text-xs font-medium text-[#102D27]">
                {item.file}
              </code>
              <span className="text-xs text-[#5C6B66]">{item.purpose}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F4F7F5] px-3.5 py-2.5 text-xs text-[#20483B]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>
            RLS habilitado nas 18 tabelas: nenhum usuário acessa dados de outro tenant mesmo com chamadas diretas à API REST do Supabase.
          </span>
        </div>
      </section>
    </div>
  );
}
