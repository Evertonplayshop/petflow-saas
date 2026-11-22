import { Scissors } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function ServicesPage() {
  return (
    <ModulePageShell
      title="Serviços"
      description="Catálogo de serviços de estética animal, consultas, vacinas e hospedagem com duração padrão e preço base."
      icon={Scissors}
      primaryTable="services"
      relatedTables={['appointments', 'order_items']}
      allowedRolesLabel="Proprietário, Gerente (edição) · Equipe (leitura)"
      columns={[
        { key: 'name', label: 'Nome do serviço' },
        { key: 'category', label: 'Categoria' },
        { key: 'duration', label: 'Duração (min)', align: 'right' },
        { key: 'price', label: 'Preço base', align: 'right' },
        { key: 'status', label: 'Situação' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'active', label: 'Ativos' },
        { id: 'inactive', label: 'Inativos' },
      ]}
      emptyTitle="Nenhum serviço cadastrado"
      emptyDescription="Defina os serviços oferecidos pelo Pet Shop para utilizá-los nos agendamentos e pedidos."
      searchPlaceholder="Buscar serviço por nome ou categoria..."
      primaryActionLabel="Novo Serviço"
    />
  );
}
