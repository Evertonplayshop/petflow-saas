import { AlertTriangle, Settings } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

interface SupabaseStatusBannerProps {
  onOpenSetup?: () => void;
}

export function SupabaseStatusBanner({ onOpenSetup }: SupabaseStatusBannerProps) {
  const { navigateTo } = useNavigation();

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-[#D4DFD8] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#102D27]">
            Supabase não configurado — Modo de Visualização Estrutural
          </p>
          <p className="mt-0.5 text-xs text-[#5C6B66]">
            Defina <code className="font-mono text-[#102D27]">VITE_SUPABASE_URL</code> e{' '}
            <code className="font-mono text-[#102D27]">VITE_SUPABASE_ANON_KEY</code> para conectar autenticação, RLS multiempresa e dados reais. Nenhum dado fictício está sendo simulado.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onOpenSetup && (
          <button
            type="button"
            onClick={onOpenSetup}
            className="rounded-lg border border-[#D4DFD8] bg-white px-3 py-1.5 text-xs font-medium text-[#102D27] transition-colors hover:bg-[#F4F7F5] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tela de Acesso
          </button>
        )}
        <button
          type="button"
          onClick={() => navigateTo('configuracoes')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#102D27] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#20483B] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          Configurar Integração
        </button>
      </div>
    </div>
  );
}
