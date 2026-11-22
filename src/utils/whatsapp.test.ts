import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppLink,
  formatWhatsAppE164Digits,
  interpolateWhatsAppTemplate,
} from './whatsapp';

test('formatWhatsAppE164Digits prepends Brazil country code 55 when missing', () => {
  assert.equal(formatWhatsAppE164Digits('(11) 99988-7766'), '5511999887766');
  assert.equal(formatWhatsAppE164Digits('5511999887766'), '5511999887766');
  assert.equal(formatWhatsAppE164Digits(''), '');
});

test('interpolateWhatsAppTemplate replaces template placeholders safely', () => {
  const result = interpolateWhatsAppTemplate(
    'Olá {{cliente}}, {{pet}} está pronto para retirada na {{empresa}}.',
    { cliente: 'Mariana', pet: 'Thor', empresa: 'PetFlow Central' }
  );
  assert.equal(result, 'Olá Mariana, Thor está pronto para retirada na PetFlow Central.');
});

test('buildWhatsAppLink produces valid wa.me URL with encoded text', () => {
  const url = buildWhatsAppLink('(21) 98877-6655', 'Olá! Agendamento confirmado.');
  assert.equal(
    url,
    'https://wa.me/5521988776655?text=Ol%C3%A1!%20Agendamento%20confirmado.'
  );
  assert.equal(buildWhatsAppLink('', 'Oi'), '');
});
