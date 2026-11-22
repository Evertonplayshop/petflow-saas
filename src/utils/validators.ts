import type { RegisterTenantPayload } from '../types/auth';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateTenantRegistration(payload: RegisterTenantPayload): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.companyName || payload.companyName.trim().length < 2) {
    errors.companyName = 'Informe o nome do Pet Shop (mínimo 2 caracteres).';
  }

  if (!payload.ownerName || payload.ownerName.trim().length < 2) {
    errors.ownerName = 'Informe o nome completo do proprietário.';
  }

  if (!payload.ownerEmail || !isValidEmail(payload.ownerEmail)) {
    errors.ownerEmail = 'Informe um e-mail corporativo ou pessoal válido.';
  }

  if (!payload.ownerPassword || payload.ownerPassword.length < 8) {
    errors.ownerPassword = 'A senha deve conter no mínimo 8 caracteres.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginCredentials(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  if (!email || !isValidEmail(email)) {
    errors.email = 'Digite um e-mail válido.';
  }
  if (!password || password.length < 6) {
    errors.password = 'Digite sua senha (mínimo 6 caracteres).';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
