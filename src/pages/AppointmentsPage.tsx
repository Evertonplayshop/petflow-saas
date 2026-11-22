import { Calendar } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function AppointmentsPage() {
  return (
    <ModulePageShell
      title="Agendamentos"
      description="Grade diária e semanal de atendimentos de banho, tosa e clínica vinculados a cliente, pet, serviço e profissional."
      icon={Calendar}
      primaryTable="appointments"
      relatedTables={['customers', 'pets', 'services', 'employees']}
      allowedRolesLabel="Proprietário, Gerente, Atendente, Funcionário"
      columns={[
        { key: 'time', label: 'Data / Horário' },
        { key: 'pet', label: 'Pet' },
        { key: 'customer', label: 'Tutor' },
        { key: 'service', label: 'Serviço' },
        { key: 'employee', label: 'Profissional' },
        { key: 'status', label: 'Status' },
        { key: 'price', label: 'Valor', align: 'right' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'scheduled', label: 'Agendados' },
        { id: 'in_progress', label: 'Em atendimento' },
        { id: 'ready_for_pickup', label: 'Pronto p/ retirada' },
        { id: 'completed', label: 'Concluídos' },
      ]}
      emptyTitle="Nenhum agendamento registrado"
      emptyDescription="A agenda multiempresa conecta tutor, animal, duração do serviço e notificação manual por WhatsApp."
      searchPlaceholder="Buscar por tutor, pet ou serviço..."
      primaryActionLabel="Novo Agendamento"
    />
  );
}
