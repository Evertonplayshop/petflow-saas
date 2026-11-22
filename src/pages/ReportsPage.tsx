import { BarChart3 } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function ReportsPage() {
  return (
    <ModulePageShell
      title="Relatórios Gerenciais"
      description="Análise consolidada de receita por serviço, margem de produtos, comissionamento da equipe e retenção de tutores."
      icon={BarChart3}
      primaryTable="audit_logs"
      relatedTables={['payments', 'orders', 'appointments', 'employees']}
      allowedRolesLabel="Proprietário, Gerente"
      columns={[
        { key: 'metric', label: 'Indicador' },
        { key: 'dimension', label: 'Dimensão' },
        { key: 'period', label: 'Período' },
        { key: 'result', label: 'Resultado', align: 'right' },
      ]}
      statusFilters={[
        { id: 'revenue', label: 'Faturamento' },
        { id: 'services', label: 'Serviços' },
        { id: 'inventory', label: 'Giro de Estoque' },
        { id: 'commissions', label: 'Comissões' },
      ]}
      emptyTitle="Relatórios aguardando movimentações reais"
      emptyDescription="Os relatórios consolidam exclusivamente registros confirmados do tenant no PostgreSQL sem projeções fictícias."
      searchPlaceholder="Filtrar relatórios disponíveis..."
      primaryActionLabel="Exportar Resumo"
    />
  );
}
