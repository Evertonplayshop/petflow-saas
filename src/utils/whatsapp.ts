import { normalizeDigits } from './formatters';

export interface WhatsAppTemplateVariables {
  cliente?: string;
  pet?: string;
  servico?: string;
  data?: string;
  horario?: string;
  pedido?: string;
  status?: string;
  empresa?: string;
}

export function formatWhatsAppE164Digits(rawPhone: string, defaultCountryCode = '55'): string {
  const digits = normalizeDigits(rawPhone);
  if (!digits) return '';

  // Remove leading zeros
  const stripped = digits.replace(/^0+/, '');
  if (!stripped) return '';

  // Brazilian numbers have 10 or 11 digits without country code
  if (stripped.length <= 11 && !stripped.startsWith(defaultCountryCode)) {
    return `${defaultCountryCode}${stripped}`;
  }
  return stripped;
}

export function interpolateWhatsAppTemplate(
  template: string,
  variables: WhatsAppTemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key as keyof WhatsAppTemplateVariables];
    return value && value.trim().length > 0 ? value.trim() : match;
  });
}

export function buildWhatsAppLink(rawPhone: string, message?: string): string {
  const phoneDigits = formatWhatsAppE164Digits(rawPhone);
  if (!phoneDigits) {
    return '';
  }
  const baseUrl = `https://wa.me/${phoneDigits}`;
  if (!message || message.trim().length === 0) {
    return baseUrl;
  }
  return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
}
