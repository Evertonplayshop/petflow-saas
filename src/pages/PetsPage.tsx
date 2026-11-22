import { PawPrint } from 'lucide-react';
import { ModulePageShell } from '../components/ModulePageShell';

export function PetsPage() {
  return (
    <ModulePageShell
      title="Pets"
      description="Prontuário de animais vinculados aos tutores, incluindo espécie, raça, porte, peso, alergias e fotos no bucket privado pet-photos."
      icon={PawPrint}
      primaryTable="pets"
      relatedTables={['customers', 'appointments']}
      allowedRolesLabel="Proprietário, Gerente, Atendente, Funcionário"
      columns={[
        { key: 'pet', label: 'Nome do Pet' },
        { key: 'species', label: 'Espécie / Raça' },
        { key: 'size', label: 'Porte' },
        { key: 'weight', label: 'Peso (kg)', align: 'right' },
        { key: 'customer', label: 'Tutor responsável' },
      ]}
      statusFilters={[
        { id: 'all', label: 'Todos' },
        { id: 'dog', label: 'Cães' },
        { id: 'cat', label: 'Gatos' },
        { id: 'other', label: 'Outras espécies' },
      ]}
      emptyTitle="Nenhum pet cadastrado"
      emptyDescription="Vincule animais aos seus tutores com histórico de alergias e observações para banho, tosa e atendimento."
      searchPlaceholder="Buscar pet por nome, raça ou tutor..."
      primaryActionLabel="Cadastrar Pet"
    />
  );
}
