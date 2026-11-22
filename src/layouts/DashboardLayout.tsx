import type { ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { SupabaseStatusBanner } from '../components/SupabaseStatusBanner';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardLayout({
  children,
  onRefresh,
  isRefreshing = false,
}: DashboardLayoutProps) {
  const { isConfigured, exitStructuralPreview } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#102D27]">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <TopHeader onRefresh={onRefresh} isRefreshing={isRefreshing} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px] space-y-6">
            {!isConfigured && (
              <SupabaseStatusBanner onOpenSetup={exitStructuralPreview} />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
