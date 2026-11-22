import { useState } from 'react';
import { Database, Search, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { EmptyState } from './EmptyState';

export interface StructuralColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
}

export interface ModulePageShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryTable: string;
  relatedTables: string[];
  allowedRolesLabel: string;
  columns: StructuralColumn[];
  statusFilters: Array<{ id: string; label: string }>;
  emptyTitle: string;
  emptyDescription: string;
  searchPlaceholder: string;
  primaryActionLabel: string;
}

export function ModulePageShell({
  title,
  description,
  icon: Icon,
  primaryTable,
  relatedTables,
  allowedRolesLabel,
  columns,
  statusFilters,
  emptyTitle,
  emptyDescription,
  searchPlaceholder,
  primaryActionLabel,
}: ModulePageShellProps) {
  const { isConfigured } = useAuth();
  const { navigateTo } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(statusFilters[0]?.id ?? 'all');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handlePrimaryAction = () => {
    if (!isConfigured) {
      setNoticeMessage(
        `A criação de registros em "${primaryTable}" requer a conexão ativa com o Supabase e autenticação do tenant.`
      );
      return;
    }
    setNoticeMessage(
      `Estrutura pronta: este formulário operacional será habilitado na próxima etapa sobre a tabela "${primaryTable}" com isolamento RLS por tenant_id.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Module Intro & Primary Action */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#DDE6E1] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E9F4EE] text-[#102D27]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-[#102D27]">
              {title}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-[#5C6B66]">
              {description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5C6B66]">
              <span>
                Tabela principal:{' '}
                <code className="font-mono text-[#102D27]">{primaryTable}</code>
              </span>
              <span aria-hidden="true">·</span>
              <span>Perfis autorizados: {allowedRolesLabel}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrimaryAction}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#102D27] px-4 text-xs font-medium text-white transition-colors hover:bg-[#20483B] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {primaryActionLabel}
        </button>
      </div>

      {noticeMessage && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-xl border border-[#B8F0D1] bg-[#EEF9F3] px-4 py-3 text-xs text-[#102D27] sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{noticeMessage}</span>
          <div className="flex items-center gap-3 shrink-0">
            {!isConfigured && (
              <button
                type="button"
                onClick={() => navigateTo('configuracoes')}
                className="font-semibold text-[#20483B] underline underline-offset-2 cursor-pointer whitespace-nowrap"
              >
                Ver instruções Supabase
              </button>
            )}
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              className="text-[#5C6B66] hover:text-[#102D27] cursor-pointer whitespace-nowrap"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar + Table Blueprint */}
      <div className="rounded-xl border border-[#DDE6E1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#EDF2EF] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-[#DDE6E1] bg-[#F9FBFA] pl-9 pr-3 text-xs text-[#102D27] placeholder:text-[#64748B] focus:border-[#20483B] focus:bg-white focus:outline-none"
            />
          </div>

          <div
            className="flex items-center gap-1 overflow-x-auto rounded-lg bg-[#F4F7F5] p-1"
            role="tablist"
            aria-label={`Filtros de ${title}`}
          >
            {statusFilters.map((filter) => {
              const isSelected = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#102D27] shadow-xs'
                      : 'text-[#5C6B66] hover:text-[#102D27]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Header Structure */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#EDF2EF] bg-[#F9FBFA]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-2.5 text-[11px] font-semibold text-[#5C6B66] whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        <div className="p-5">
          <EmptyState
            icon={Icon}
            title={
              isConfigured
                ? emptyTitle
                : `${title} aguardando conexão com o Supabase`
            }
            description={
              searchQuery.trim()
                ? `Nenhum registro encontrado para "${searchQuery.trim()}" no filtro selecionado.`
                : isConfigured
                ? emptyDescription
                : `A estrutura da tabela "${primaryTable}" e suas políticas RLS por tenant_id já estão preparadas nas migrations SQL. Configure as credenciais para iniciar os cadastros reais.`
            }
            actionLabel={isConfigured ? primaryActionLabel : 'Configurar Supabase'}
            onAction={
              isConfigured
                ? handlePrimaryAction
                : () => navigateTo('configuracoes')
            }
          />
        </div>

        {/* Architectural Readiness Footer */}
        <div className="flex flex-col gap-2 border-t border-[#EDF2EF] bg-[#F9FBFA] px-5 py-3 text-xs text-[#5C6B66] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#20483B] shrink-0" />
            <span>
              Relacionamentos preparados:{' '}
              <span className="font-mono text-[#102D27]">
                {relatedTables.join(', ')}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#20483B] shrink-0" />
            <span>Isolamento multiempresa via RLS (tenant_id)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
