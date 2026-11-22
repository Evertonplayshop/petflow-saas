import { buildWhatsAppLink, interpolateWhatsAppTemplate, type WhatsAppTemplateVariables } from '../../utils/whatsapp';
import type { WhatsAppTemplateCategory } from '../../types/database';

export interface DefaultWhatsAppPreset {
  id: string;
  name: string;
  category: WhatsAppTemplateCategory;
  body: string;
}

export const WHATSAPP_TEMPLATE_PRESETS: DefaultWhatsAppPreset[] = [
  {
    id: 'preset-confirmacao',
    name: 'Confirmar agendamento',
    category: 'appointment_confirmation',
    body: 'Olá {{cliente}}, confirmamos o atendimento de {{servico}} para {{pet}} no dia {{data}} às {{horario}}. Equipe {{empresa}}.',
  },
  {
    id: 'preset-lembrete',
    name: 'Enviar lembrete manual',
    category: 'appointment_reminder',
    body: 'Olá {{cliente}}, lembrando que {{pet}} tem horário agendado para {{servico}} em {{data}} às {{horario}}. Caso precise reagendar, avise por aqui.',
  },
  {
    id: 'preset-pet-pronto',
    name: 'Informar pet pronto',
    category: 'pet_ready',
    body: 'Olá {{cliente}}! {{pet}} finalizou o {{servico}} e já está pronto para retirada na {{empresa}}.',
  },
  {
    id: 'preset-pedido',
    name: 'Avisar sobre pedido',
    category: 'order_update',
    body: 'Olá {{cliente}}, atualizamos seu pedido #{{pedido}} na {{empresa}}. Status atual: {{status}}.',
  },
];

export function createWhatsAppActionUrl(
  phone: string,
  templateBody: string,
  variables: WhatsAppTemplateVariables
): string {
  const message = interpolateWhatsAppTemplate(templateBody, variables);
  return buildWhatsAppLink(phone, message);
}
