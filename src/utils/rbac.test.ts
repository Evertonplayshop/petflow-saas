import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessModule, getAccessibleModules, getDefaultRouteForRole } from './rbac';

test('owner and super_admin can access all 14 modules', () => {
  assert.equal(getAccessibleModules('super_admin').length, 14);
  assert.equal(getAccessibleModules('owner').length, 14);
  assert.equal(canAccessModule('owner', 'financeiro'), true);
  assert.equal(canAccessModule('owner', 'configuracoes'), true);
});

test('attendant cannot access restricted financial, reports, or team settings modules', () => {
  assert.equal(canAccessModule('attendant', 'agendamentos'), true);
  assert.equal(canAccessModule('attendant', 'whatsapp'), true);
  assert.equal(canAccessModule('attendant', 'financeiro'), false);
  assert.equal(canAccessModule('attendant', 'funcionarios'), false);
  assert.equal(canAccessModule('attendant', 'configuracoes'), false);
});

test('stock_clerk defaults to estoque and is restricted from financial/appointments', () => {
  assert.equal(getDefaultRouteForRole('stock_clerk'), 'estoque');
  assert.equal(canAccessModule('stock_clerk', 'produtos'), true);
  assert.equal(canAccessModule('stock_clerk', 'fornecedores'), true);
  assert.equal(canAccessModule('stock_clerk', 'financeiro'), false);
  assert.equal(canAccessModule('stock_clerk', 'agendamentos'), false);
});

test('null role has zero module access', () => {
  assert.equal(getAccessibleModules(null).length, 0);
  assert.equal(canAccessModule(null, 'dashboard'), false);
});
