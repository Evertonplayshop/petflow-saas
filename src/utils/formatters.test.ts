import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrencyFromCents, formatInteger, toCompanySlug, normalizeDigits } from './formatters';

test('formatCurrencyFromCents formats BRL currency accurately', () => {
  const formatted = formatCurrencyFromCents(12590);
  assert.match(formatted, /R\$\s*125,90/);
  assert.equal(formatCurrencyFromCents(null), '—');
  assert.equal(formatCurrencyFromCents(undefined), '—');
});

test('formatInteger formats Brazilian thousands and handles null', () => {
  assert.equal(formatInteger(1420), '1.420');
  assert.equal(formatInteger(0), '0');
  assert.equal(formatInteger(null), '—');
});

test('toCompanySlug removes accents and special characters cleanly', () => {
  assert.equal(toCompanySlug('Pet Shop Cão & Gato Ltda!'), 'pet-shop-cao-gato-ltda');
  assert.equal(toCompanySlug('  Água Viva Pet  '), 'agua-viva-pet');
});

test('normalizeDigits strips non-numeric characters', () => {
  assert.equal(normalizeDigits('(11) 98765-4321'), '11987654321');
});
