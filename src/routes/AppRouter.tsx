import { Building2, LogOut } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { AuthGatewayPage } from '../pages/auth/AuthGatewayPage';
import { CustomersPage } from '../pages/CustomersPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { FinancePage } from '../pages/FinancePage';
import { InventoryPage } from '../pages/InventoryPage';
import { OrdersPage } from '../pages/OrdersPage';
import { PetsPage } from '../pages/PetsPage';
import { ProductsPage } from '../pages/ProductsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ServicesPage } from '../pages/ServicesPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SuppliersPage } from '../pages/SuppliersPage';
import { WhatsAppPage } from '../pages/WhatsAppPage';

export function AppRouter() {
  const {
    session,
    profile,
    memberships,
    isLoading,
    isStructuralPreview,
    signOut,
  } = useAuth();
  const { activeModule, setAuthScreen } = useNavigation();
  const dashboard = useDashboardData();

  if (isLoading && !isStructuralPreview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7F5] px-4">
        <BrandLogo variant="dark" />
        <p className="mt-4 text-xs font-medium text-[#5C6B66]">
          Verificando sessão e permissões multiempresa...
        </p>
      </div>
    );
  }

  const isAuthenticated = Boolean(session);

  if (!isAuthenticated && !isStructuralPreview) {
    return <AuthGatewayPage />;
  }

  if (
    isAuthenticated &&
    memberships.length === 0 &&
    !profile?.is_super_admin
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F5] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#DDE6E1] bg-white p-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[#E9F4EE] text-[#102D27]">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-lg font-semibold text-[#102D27]">
            Nenhuma empresa vinculada
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5C6B66]">
            Sua conta foi autenticada, mas ainda não possui vínculo ativo em nenhuma empresa (<code className="font-mono text-[#102D27]">memberships</code>). Solicite um convite ao proprietário ou cadastre uma nova empresa.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAuthScreen('register');
                void signOut();
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#102D27] px-4 text-xs font-medium text-white hover:bg-[#20483B] cursor-pointer"
            >
              Cadastrar Nova Empresa
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DDE6E1] bg-white px-4 text-xs font-medium text-[#102D27] hover:bg-[#F4F7F5] cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderModulePage = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardPage dashboard={dashboard} />;
      case 'agendamentos':
        return <AppointmentsPage />;
      case 'clientes':
        return <CustomersPage />;
      case 'pets':
        return <PetsPage />;
      case 'servicos':
        return <ServicesPage />;
      case 'pedidos':
        return <OrdersPage />;
      case 'produtos':
        return <ProductsPage />;
      case 'estoque':
        return <InventoryPage />;
      case 'fornecedores':
        return <SuppliersPage />;
      case 'financeiro':
        return <FinancePage />;
      case 'relatorios':
        return <ReportsPage />;
      case 'whatsapp':
        return <WhatsAppPage />;
      case 'funcionarios':
        return <EmployeesPage />;
      case 'configuracoes':
        return <SettingsPage />;
    }
  };

  return (
    <DashboardLayout
      onRefresh={
        activeModule === 'dashboard' ? () => void dashboard.refresh() : undefined
      }
      isRefreshing={dashboard.isLoading}
    >
      <ProtectedRoute moduleId={activeModule}>
        {renderModulePage()}
      </ProtectedRoute>
    </DashboardLayout>
  );
}
