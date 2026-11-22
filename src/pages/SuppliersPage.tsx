import { Truck } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function SuppliersPage() {
  return (
    <ModulePageShell
      title="Fornecedores"
      description="Cadastro de distribuidores e fabricantes para reposição de estoque e controle de contas a pagar."
      icon={Truck}
      primaryTable="suppliers"
      relatedTables={['products', 'expenses']}
      allowedRolesLabel="Proprietário, Gerente, Estoquista"
      columns={[
        { key: 'company_name', label: 'Razão social / Fantasia' },
        { key: 'document', label: 'CNPJ' },
        { key: 'contact', label: 'Contato' },
        { key: 'phone', label: 'Telefone' },
        { key: 'status', label: 'Situação' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'active', label: 'Ativos' },
        { id: 'inactive', label: 'Inativos' },
      ]}
      emptyTitle="Nenhum fornecedor cadastrado"
      emptyDescription="Registre seus fornecedores para vincular compras de mercadorias e despesas financeiras."
      searchPlaceholder="Buscar fornecedor por nome ou CNPJ..."
      primaryActionLabel="Novo Fornecedor"
    />
  );
}
