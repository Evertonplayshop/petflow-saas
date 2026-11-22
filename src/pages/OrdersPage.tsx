import { ShoppingBag } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function OrdersPage() {
  return (
    <ModulePageShell
      title="Pedidos"
      description="Controle de pedidos de balcão e vendas combinadas de produtos e serviços com cálculo de subtotal, desconto e pagamento."
      icon={ShoppingBag}
      primaryTable="orders"
      relatedTables={['order_items', 'customers', 'payments', 'products']}
      allowedRolesLabel="Proprietário, Gerente, Atendente"
      columns={[
        { key: 'number', label: 'Pedido #' },
        { key: 'customer', label: 'Cliente' },
        { key: 'created_at', label: 'Data' },
        { key: 'status', label: 'Status' },
        { key: 'total', label: 'Total', align: 'right' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'pending', label: 'Pendentes' },
        { id: 'paid', label: 'Pagos' },
        { id: 'ready', label: 'Prontos' },
        { id: 'delivered', label: 'Entregues' },
      ]}
      emptyTitle="Nenhum pedido registrado"
      emptyDescription="Os pedidos vinculam itens de produto ou serviço e geram registros financeiros na tabela payments."
      searchPlaceholder="Buscar por número do pedido ou cliente..."
      primaryActionLabel="Novo Pedido"
    />
  );
}
