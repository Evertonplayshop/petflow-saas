import { Wallet } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function FinancePage() {
  return (
    <ModulePageShell
      title="Financeiro"
      description="Consolidação de recebimentos (PIX, cartão, dinheiro), contas a pagar e fluxo de caixa isolado para gestão."
      icon={Wallet}
      primaryTable="payments"
      relatedTables={['expenses', 'orders', 'appointments', 'suppliers']}
      allowedRolesLabel="Proprietário, Gerente"
      columns={[
        { key: 'date', label: 'Vencimento / Pagamento' },
        { key: 'description', label: 'Descrição / Origem' },
        { key: 'method', label: 'Meio / Categoria' },
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Valor', align: 'right' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'paid', label: 'Recebidos' },
        { id: 'pending', label: 'Em aberto' },
        { id: 'expenses', label: 'Despesas' },
      ]}
      emptyTitle="Nenhum lançamento financeiro"
      emptyDescription="Recebimentos (payments) e despesas (expenses) possuem acesso restrito por RLS apenas a perfis autorizados."
      searchPlaceholder="Buscar lançamento por descrição ou referência..."
      primaryActionLabel="Novo Lançamento"
    />
  );
}
