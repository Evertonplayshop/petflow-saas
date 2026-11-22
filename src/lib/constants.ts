import type { NavGroupId, NavItem } from '../types/navigation';

export const NAV_GROUPS: Record<NavGroupId, string> = {
  operacao: 'Operação Diária',
  catalogo: 'Vendas e Estoque',
  gestao: 'Gestão e Canais',
  sistema: 'Administração',
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'operacao',
    description: 'Visão executiva de faturamento, agendamentos e alertas operacionais.',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'agendamentos',
    label: 'Agendamentos',
    group: 'operacao',
    description: 'Agenda de banho, tosa, consultas e controle de status em tempo real.',
    iconName: 'Calendar',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    group: 'operacao',
    description: 'Base de tutores com histórico de atendimentos, compras e contato.',
    iconName: 'Users',
  },
  {
    id: 'pets',
    label: 'Pets',
    group: 'operacao',
    description: 'Prontuário de animais, porte, raça, alergias e observações clínicas.',
    iconName: 'PawPrint',
  },
  {
    id: 'servicos',
    label: 'Serviços',
    group: 'operacao',
    description: 'Catálogo de serviços, duração média e tabela de preços por porte.',
    iconName: 'Scissors',
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    group: 'catalogo',
    description: 'PDV, pedidos de balcão e faturamento de produtos e serviços.',
    iconName: 'ShoppingBag',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    group: 'catalogo',
    description: 'Catálogo de mercadorias, SKU, código de barras e precificação.',
    iconName: 'Package',
  },
  {
    id: 'estoque',
    label: 'Estoque',
    group: 'catalogo',
    description: 'Posição atual, estoque mínimo e histórico auditável de movimentações.',
    iconName: 'Boxes',
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    group: 'catalogo',
    description: 'Cadastro de distribuidores, prazos e histórico de reposição.',
    iconName: 'Truck',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    group: 'gestao',
    description: 'Recebimentos, contas a pagar, fluxo de caixa e conciliação.',
    iconName: 'Wallet',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    group: 'gestao',
    description: 'Indicadores gerenciais de receita, retenção, comissão e giro.',
    iconName: 'BarChart3',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    group: 'gestao',
    description: 'Atendimento via links wa.me com modelos prontos por contexto.',
    iconName: 'MessageCircle',
  },
  {
    id: 'funcionarios',
    label: 'Funcionários',
    group: 'sistema',
    description: 'Equipe operacional, comissões e permissões multiempresa (RBAC).',
    iconName: 'UserCog',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    group: 'sistema',
    description: 'Dados da empresa, logotipo, integração Supabase e segurança.',
    iconName: 'Settings',
  },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  paid: 'Pago',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  ready_for_pickup: 'Pronto p/ retirada',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};
