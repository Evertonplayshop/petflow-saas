import { UserCog, Shield } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';
import type { AppRole } from '../types/database';
import {
  getAccessibleModules,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from '../utils/rbac';

const ALL_ROLES: AppRole[] = [
  'super_admin',
  'owner',
  'manager',
  'attendant',
  'stock_clerk',
  'employee',
];

export function EmployeesPage() {
  return (
    <div className="space-y-6">
      <ModulePageShell
        title="Funcionários e Equipe"
        description="Gestão de colaboradores do Pet Shop, comissões por serviço e vinculação de usuários com papéis multiempresa."
        icon={UserCog}
        primaryTable="employees"
        relatedTables={['memberships', 'profiles', 'appointments']}
        allowedRolesLabel="Proprietário, Gerente"
        columns={[
          { key: 'name', label: 'Colaborador' },
          { key: 'role_title', label: 'Função operacional' },
          { key: 'rbac', label: 'Papel no sistema' },
          { key: 'commission', label: 'Comissão (%)', align: 'right' },
          { key: 'status', label: 'Situação' },
        ]}
        statusFilters={[
          { id: 'all', label: 'Todos' },
          { id: 'active', label: 'Ativos' },
          { id: 'inactive', label: 'Inativos' },
        ]}
        emptyTitle="Nenhum funcionário cadastrado"
        emptyDescription="Cadastre tosadores, banhistas, veterinários, atendentes e estoquistas vinculados exclusivamente ao tenant."
        searchPlaceholder="Buscar funcionário por nome ou função..."
        primaryActionLabel="Novo Funcionário"
      />

      {/* RBAC Matrix Documentation Card */}
      <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
        <div className="flex items-center gap-2.5 border-b border-[#EDF2EF] pb-3.5">
          <Shield className="h-4.5 w-4.5 text-[#20483B]" />
          <div>
            <h3 className="text-sm font-semibold text-[#102D27]">
              Matriz de Perfis e Permissões (RBAC + RLS)
            </h3>
            <p className="text-xs text-[#5C6B66]">
              Os mesmos papéis controlam a visibilidade de rotas no frontend, endpoints Express e políticas RLS no PostgreSQL.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_ROLES.map((role) => {
            const count = getAccessibleModules(role).length;
            return (
              <div
                key={role}
                className="rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#102D27]">
                    {ROLE_LABELS[role]}
                  </p>
                  <span className="font-mono text-[11px] text-[#20483B] tabular-nums">
                    {count}/14 módulos
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5C6B66]">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
