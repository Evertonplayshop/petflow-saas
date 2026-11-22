import { Users } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function CustomersPage() {
  return (
    <ModulePageShell
      title="Clientes (Tutores)"
      description="Cadastro completo de tutores isolado por empresa, com telefone, WhatsApp, endereço e histórico de atendimentos e pedidos."
      icon={Users}
      primaryTable="customers"
      relatedTables={['pets', 'appointments', 'orders', 'payments']}
      allowedRolesLabel="Proprietário, Gerente, Atendente, Funcionário"
      columns={[
        { key: 'name', label: 'Nome do tutor' },
        { key: 'phone', label: 'Telefone / WhatsApp' },
        { key: 'email', label: 'E-mail' },
        { key: 'city', label: 'Cidade / UF' },
        { key: 'status', label: 'Status' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'active', label: 'Ativos' },
        { id: 'inactive', label: 'Inativos' },
      ]}
      emptyTitle="Nenhum cliente cadastrado"
      emptyDescription="Os tutores cadastrados pertencem exclusivamente ao tenant ativo via políticas RLS."
      searchPlaceholder="Buscar cliente por nome, telefone ou CPF..."
      primaryActionLabel="Novo Cliente"
    />
  );
}
