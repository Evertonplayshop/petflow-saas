import type { ReactNode } from 'react';
import { ShieldCheck, Layers, Lock } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F7F5] lg:grid lg:grid-cols-12">
      {/* Left Brand & Architecture Column */}
      <div className="flex flex-col justify-between bg-[#102D27] px-6 py-8 text-white sm:px-10 lg:col-span-5 lg:px-12 lg:py-12">
        <div>
          <BrandLogo variant="light" />
          <div className="mt-10 max-w-md">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gestão multiempresa profissional para Pet Shops
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Operação unificada de agendamentos, tutores, prontuário de pets, estoque, PDV, financeiro e atendimento via WhatsApp com isolamento real por empresa.
            </p>
          </div>
        </div>

        <dl className="mt-10 space-y-5 border-t border-white/10 pt-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#20483B] text-[#B8F0D1]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-xs font-semibold text-white">
                Isolamento por Row Level Security (RLS)
              </dt>
              <dd className="mt-0.5 text-xs text-white/70">
                Todas as 18 tabelas operacionais exigem <code className="font-mono text-[#B8F0D1]">tenant_id</code> e validação de vínculo no PostgreSQL.
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#20483B] text-[#B8F0D1]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-xs font-semibold text-white">
                Onboarding transacional no backend
              </dt>
              <dd className="mt-0.5 text-xs text-white/70">
                Cadastro atômico de empresa, usuário proprietário e modelos iniciais de atendimento.
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#20483B] text-[#B8F0D1]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <dt className="text-xs font-semibold text-white">
                Controle granular de perfis (RBAC)
              </dt>
              <dd className="mt-0.5 text-xs text-white/70">
                Superadministrador, Proprietário, Gerente, Atendente, Estoquista e Funcionário.
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Right Interactive Auth / Setup Column */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:col-span-7 lg:px-12">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
