import { Boxes } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function InventoryPage() {
  return (
    <ModulePageShell
      title="Estoque e Movimentações"
      description="Rastreabilidade de entradas por compra, saídas por venda, ajustes manuais, devoluções e perdas por tenant."
      icon={Boxes}
      primaryTable="stock_movements"
      relatedTables={['products', 'suppliers', 'profiles']}
      allowedRolesLabel="Proprietário, Gerente, Estoquista"
      columns={[
        { key: 'created_at', label: 'Data / Hora' },
        { key: 'product', label: 'Produto' },
        { key: 'type', label: 'Tipo de movimentação' },
        { key: 'quantity', label: 'Quantidade', align: 'right' },
        { key: 'reference', label: 'Referência' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todas' },
        { id: 'purchase_in', label: 'Entradas' },
        { id: 'sale_out', label: 'Saídas' },
        { id: 'adjustment', label: 'Ajustes' },
      ]}
      emptyTitle="Nenhuma movimentação registrada"
      emptyDescription="Cada alteração de saldo gera um registro imutável na tabela stock_movements com identificação do responsável."
      searchPlaceholder="Buscar movimentação por produto ou observação..."
      primaryActionLabel="Registrar Movimentação"
    />
  );
}
