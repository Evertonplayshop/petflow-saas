import type { AppRole } from '../types/database';
import type { ModuleRouteId } from '../types/navigation';

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Superadministrador',
  owner: 'Proprietário',
  manager: 'Gerente',
  attendant: 'Atendente',
  stock_clerk: 'Estoquista',
  employee: 'Funcionário',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Governança global da plataforma SaaS e suporte multiempresa.',
  owner: 'Controle irrestrito da empresa, financeiro, equipe e assinatura.',
  manager: 'Gestão operacional completa, equipe, estoque e relatórios.',
  attendant: 'Recepção, agendamentos, clientes, pets, pedidos e WhatsApp.',
  stock_clerk: 'Produtos, controle de estoque, movimentações e fornecedores.',
  employee: 'Agenda de atendimentos atribuídos, pets e execução de serviços.',
};

const MODULE_ACCESS_MATRIX: Record<ModuleRouteId, AppRole[]> = {
  dashboard: ['super_admin', 'owner', 'manager', 'attendant', 'stock_clerk', 'employee'],
  agendamentos: ['super_admin', 'owner', 'manager', 'attendant', 'employee'],
  clientes: ['super_admin', 'owner', 'manager', 'attendant', 'employee'],
  pets: ['super_admin', 'owner', 'manager', 'attendant', 'employee'],
  servicos: ['super_admin', 'owner', 'manager', 'attendant', 'employee'],
  pedidos: ['super_admin', 'owner', 'manager', 'attendant'],
  produtos: ['super_admin', 'owner', 'manager', 'attendant', 'stock_clerk'],
  estoque: ['super_admin', 'owner', 'manager', 'stock_clerk'],
  fornecedores: ['super_admin', 'owner', 'manager', 'stock_clerk'],
  financeiro: ['super_admin', 'owner', 'manager'],
  relatorios: ['super_admin', 'owner', 'manager'],
  whatsapp: ['super_admin', 'owner', 'manager', 'attendant'],
  funcionarios: ['super_admin', 'owner', 'manager'],
  configuracoes: ['super_admin', 'owner', 'manager'],
};

export function canAccessModule(role: AppRole | null, moduleId: ModuleRouteId): boolean {
  if (!role) return false;
  return MODULE_ACCESS_MATRIX[moduleId].includes(role);
}

export function getAccessibleModules(role: AppRole | null): ModuleRouteId[] {
  if (!role) return [];
  return (Object.keys(MODULE_ACCESS_MATRIX) as ModuleRouteId[]).filter((moduleId) =>
    MODULE_ACCESS_MATRIX[moduleId].includes(role)
  );
}

export function getDefaultRouteForRole(role: AppRole | null): ModuleRouteId {
  if (!role) return 'dashboard';
  if (role === 'stock_clerk') return 'estoque';
  if (role === 'employee') return 'agendamentos';
  return 'dashboard';
}

export function getRoleModuleMatrix(): Record<ModuleRouteId, AppRole[]> {
  return MODULE_ACCESS_MATRIX;
}
