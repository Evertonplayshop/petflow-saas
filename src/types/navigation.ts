export type ModuleRouteId =
  | 'dashboard'
  | 'agendamentos'
  | 'clientes'
  | 'pets'
  | 'servicos'
  | 'pedidos'
  | 'produtos'
  | 'estoque'
  | 'fornecedores'
  | 'financeiro'
  | 'relatorios'
  | 'whatsapp'
  | 'funcionarios'
  | 'configuracoes';

export type NavGroupId = 'operacao' | 'catalogo' | 'gestao' | 'sistema';

export interface NavItem {
  id: ModuleRouteId;
  label: string;
  group: NavGroupId;
  description: string;
  iconName:
    | 'LayoutDashboard'
    | 'Calendar'
    | 'Users'
    | 'PawPrint'
    | 'Scissors'
    | 'ShoppingBag'
    | 'Package'
    | 'Boxes'
    | 'Truck'
    | 'Wallet'
    | 'BarChart3'
    | 'MessageCircle'
    | 'UserCog'
    | 'Settings';
}
