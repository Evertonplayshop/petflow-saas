import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  KeyRound,
  LayoutGrid,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { toCompanySlug } from '../../utils/formatters';
import {
  validateLoginCredentials,
  validateTenantRegistration,
} from '../../utils/validators';

export function AuthGatewayPage() {
  const {
    isConfigured,
    isLoading,
    error,
    signIn,
    registerTenantAndOwner,
    sendPasswordReset,
    updatePassword,
    enterStructuralPreview,
    clearError,
  } = useAuth();
  const { authScreen, setAuthScreen } = useNavigation();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Tenant + Owner registration state
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local validation / feedback state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const switchScreen = (next: 'login' | 'register' | 'forgot-password' | 'reset-password') => {
    setAuthScreen(next);
    setFieldErrors({});
    setFeedback(null);
    clearError();
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const validation = validateLoginCredentials(loginEmail, loginPassword);
    setFieldErrors(validation.errors);
    if (!validation.valid) return;

    if (!isConfigured) {
      setFeedback({
        type: 'error',
        message:
          'Conexão Supabase ainda não configurada. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para autenticar usuários reais.',
      });
      return;
    }

    try {
      await signIn(loginEmail, loginPassword);
    } catch {
      // Erro já registrado no AuthContext
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      companyName,
      companySlug: companySlug || toCompanySlug(companyName),
      documentNumber,
      companyPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
    };

    const validation = validateTenantRegistration(payload);
    setFieldErrors(validation.errors);
    if (!validation.valid) return;

    if (!isConfigured) {
      setFeedback({
        type: 'error',
        message:
          'Cadastro transacional indisponível enquanto o Supabase não estiver configurado no ambiente (.env).',
      });
      return;
    }

    try {
      const result = await registerTenantAndOwner(payload);
      setFeedback({
        type: 'success',
        message: `Empresa registrada com sucesso (slug: ${result.slug}). Você já pode entrar com o e-mail do proprietário.`,
      });
      setLoginEmail(ownerEmail);
      setAuthScreen('login');
    } catch {
      // Erro tratado no AuthContext
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setFieldErrors({ resetEmail: 'Informe um e-mail válido para recuperação.' });
      return;
    }
    setFieldErrors({});

    if (!isConfigured) {
      setFeedback({
        type: 'error',
        message:
          'Recuperação de senha requer VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY configurados.',
      });
      return;
    }

    try {
      await sendPasswordReset(resetEmail);
      setFeedback({
        type: 'success',
        message:
          'Instruções de redefinição de senha enviadas caso o e-mail esteja cadastrado.',
      });
    } catch {
      // Erro tratado no AuthContext
    }
  };

  const handleUpdatePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: 'A nova senha deve conter pelo menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As duas senhas não coincidem.' });
      return;
    }
    setFieldErrors({});

    try {
      await updatePassword(newPassword);
      setFeedback({
        type: 'success',
        message: 'Senha redefinida com sucesso. Entre novamente com a nova senha.',
      });
      setNewPassword('');
      setConfirmPassword('');
      window.history.replaceState({}, '', window.location.pathname);
      setAuthScreen('login');
    } catch {
      // Erro tratado no AuthContext
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        {/* Honest Supabase Configuration Card when env vars are missing */}
        {!isConfigured && (
          <div className="rounded-xl border border-[#D4DFD8] bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-[#102D27]">
                  Configuração pendente do Supabase
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#5C6B66]">
                  As variáveis <code className="font-mono text-[#102D27]">VITE_SUPABASE_URL</code> e{' '}
                  <code className="font-mono text-[#102D27]">VITE_SUPABASE_ANON_KEY</code> ainda não foram definidas. Nenhuma sessão falsa será simulada.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => enterStructuralPreview('owner')}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#102D27] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#20483B] cursor-pointer whitespace-nowrap"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Explorar Estrutura do Sistema
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] text-[#5C6B66]">
                    Visualização sem dados fictícios
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="rounded-xl border border-[#DDE6E1] bg-white p-6 sm:p-8">
          {/* Segmented Auth Mode Tabs */}
          {authScreen !== 'reset-password' && (
            <div
              className="grid grid-cols-3 gap-1 rounded-lg bg-[#F4F7F5] p-1"
              role="tablist"
              aria-label="Opções de acesso"
            >
            <button
              type="button"
              role="tab"
              aria-selected={authScreen === 'login'}
              onClick={() => switchScreen('login')}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                authScreen === 'login'
                  ? 'bg-white text-[#102D27] shadow-xs'
                  : 'text-[#5C6B66] hover:text-[#102D27]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authScreen === 'register'}
              onClick={() => switchScreen('register')}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                authScreen === 'register'
                  ? 'bg-white text-[#102D27] shadow-xs'
                  : 'text-[#5C6B66] hover:text-[#102D27]'
              }`}
            >
              Criar Empresa
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authScreen === 'forgot-password'}
              onClick={() => switchScreen('forgot-password')}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                authScreen === 'forgot-password'
                  ? 'bg-white text-[#102D27] shadow-xs'
                  : 'text-[#5C6B66] hover:text-[#102D27]'
              }`}
            >
              Recuperar Senha
            </button>
            </div>
          )}

          {/* Global Auth Error / Feedback */}
          {(error || feedback) && (
            <div
              role="alert"
              className={`mt-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs ${
                feedback?.type === 'success'
                  ? 'border-[#B8F0D1] bg-[#EEF9F3] text-[#102D27]'
                  : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
              }`}
            >
              {feedback?.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#20483B]" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
              )}
              <span>{feedback?.message ?? error}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {authScreen === 'login' && (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#102D27]">
                  Acesse sua conta PETFLOW
                </h2>
                <p className="mt-1 text-xs text-[#5C6B66]">
                  Sessão autenticada via Supabase Auth com vínculo automático ao seu Pet Shop.
                </p>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="voce@seupetshop.com.br"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] bg-white px-3 text-sm text-[#102D27] placeholder:text-[#94A3B8] focus:border-[#20483B] focus:outline-none"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] bg-white px-3 text-sm text-[#102D27] placeholder:text-[#94A3B8] focus:border-[#20483B] focus:outline-none"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D27] px-4 text-sm font-medium text-white transition-colors hover:bg-[#20483B] disabled:opacity-60 cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
            </form>
          )}

          {/* 2. REGISTER TENANT + OWNER FORM */}
          {authScreen === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#102D27]">
                  Cadastrar Empresa e Proprietário
                </h2>
                <p className="mt-1 text-xs text-[#5C6B66]">
                  Cria o tenant, o usuário proprietário e os modelos padrão de atendimento em operação transacional no servidor.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reg-company"
                    className="block text-xs font-medium text-[#102D27]"
                  >
                    Nome do Pet Shop
                  </label>
                  <input
                    id="reg-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanyName(val);
                      setCompanySlug(toCompanySlug(val));
                    }}
                    placeholder="Ex: Mundo Pet Central"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                  />
                  {fieldErrors.companyName && (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {fieldErrors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-slug"
                    className="block text-xs font-medium text-[#102D27]"
                  >
                    Identificador (Slug)
                  </label>
                  <input
                    id="reg-slug"
                    type="text"
                    value={companySlug}
                    onChange={(e) => setCompanySlug(toCompanySlug(e.target.value))}
                    placeholder="mundo-pet-central"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] bg-[#F9FBFA] px-3 font-mono text-xs text-[#102D27] focus:border-[#20483B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reg-cnpj"
                    className="block text-xs font-medium text-[#102D27]"
                  >
                    CNPJ / CPF (opcional)
                  </label>
                  <input
                    id="reg-cnpj"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-medium text-[#102D27]"
                  >
                    WhatsApp Comercial
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-[#EDF2EF] pt-4">
                <p className="text-xs font-semibold text-[#20483B]">
                  Dados do Primeiro Proprietário
                </p>
              </div>

              <div>
                <label
                  htmlFor="reg-owner-name"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Nome completo do proprietário
                </label>
                <input
                  id="reg-owner-name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nome e sobrenome"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
                {fieldErrors.ownerName && (
                  <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.ownerName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reg-owner-email"
                    className="block text-xs font-medium text-[#102D27]"
                  >
                    E-mail de acesso
                  </label>
                  <input
                    id="reg-owner-email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="proprietario@empresa.com.br"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                  />
                  {fieldErrors.ownerEmail && (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {fieldErrors.ownerEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-owner-password"
                    className="block text-xs font-medium text-[#102D27]"
                  >
                    Senha (mínimo 8 caracteres)
                  </label>
                  <input
                    id="reg-owner-password"
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                  />
                  {fieldErrors.ownerPassword && (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {fieldErrors.ownerPassword}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D27] px-4 text-sm font-medium text-white transition-colors hover:bg-[#20483B] disabled:opacity-60 cursor-pointer"
              >
                <Building2 className="h-4 w-4" />
                {isLoading ? 'Registrando empresa...' : 'Criar Empresa e Conta'}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {authScreen === 'forgot-password' && (
            <form onSubmit={handleResetSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#102D27]">
                  Recuperar acesso
                </h2>
                <p className="mt-1 text-xs text-[#5C6B66]">
                  Enviaremos um link seguro de redefinição de senha para o seu e-mail cadastrado no Supabase Auth.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  E-mail cadastrado
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="voce@seupetshop.com.br"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
                {fieldErrors.resetEmail && (
                  <p className="mt-1 text-xs text-[#DC2626]">
                    {fieldErrors.resetEmail}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D27] px-4 text-sm font-medium text-white transition-colors hover:bg-[#20483B] disabled:opacity-60 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          )}

          {/* 4. RESET PASSWORD FORM */}
          {authScreen === 'reset-password' && (
            <form onSubmit={handleUpdatePasswordSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#102D27]">
                  Definir nova senha
                </h2>
                <p className="mt-1 text-xs text-[#5C6B66]">
                  Informe a nova senha para concluir a recuperação da conta.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Nova senha
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reset-confirm-password"
                  className="block text-xs font-medium text-[#102D27]"
                >
                  Confirmar nova senha
                </label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 h-10 w-full rounded-lg border border-[#DDE6E1] px-3 text-sm text-[#102D27] focus:border-[#20483B] focus:outline-none"
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#102D27] px-4 text-sm font-medium text-white transition-colors hover:bg-[#20483B] disabled:opacity-60 cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
