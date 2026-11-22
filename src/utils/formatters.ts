export function formatCurrencyFromCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatShortDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toCompanySlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}
