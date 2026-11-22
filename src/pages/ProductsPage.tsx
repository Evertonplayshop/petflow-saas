import { Package } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function ProductsPage() {
  return (
    <ModulePageShell
      title="Produtos"
      description="Catálogo comercial de rações, medicamentos, acessórios e higiene com SKU, preço de custo, preço de venda e estoque mínimo."
      icon={Package}
      primaryTable="products"
      relatedTables={['categories', 'suppliers', 'stock_movements', 'order_items']}
      allowedRolesLabel="Proprietário, Gerente, Estoquista, Atendente (leitura)"
      columns={[
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Produto' },
        { key: 'category', label: 'Categoria' },
        { key: 'stock', label: 'Saldo', align: 'right' },
        { key: 'price', label: 'Preço de venda', align: 'right' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'active', label: 'Ativos' },
        { id: 'low_stock', label: 'Estoque baixo' },
        { id: 'inactive', label: 'Inativos' },
      ]}
      emptyTitle="Nenhum produto cadastrado"
      emptyDescription="Cadastre produtos vinculados a categorias e fornecedores para controlar vendas e reposição."
      searchPlaceholder="Buscar por nome, SKU ou código de barras..."
      primaryActionLabel="Novo Produto"
    />
  );
}
