import {
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  MessageCircle,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { ChartPanel } from '../components/ChartPanel';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import {
  APPOINTMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from '../lib/constants';
import type { DashboardDataState } from '../types/dashboard';
import {
  formatCurrencyFromCents,
  formatInteger,
  formatShortDateTime,
} from '../utils/formatters';
import { buildWhatsAppLink } from '../utils/whatsapp';

interface DashboardPageProps {
  dashboard: DashboardDataState;
}

export function DashboardPage({ dashboard }: DashboardPageProps) {
  const { activeTenant } = useAuth();
  const { navigateTo } = useNavigation();

  const {
    metrics,
    revenueSeries,
    appointmentsSeries,
    recentOrders,
    upcomingAppointments,
    lowStockProducts,
    recentActivities,
    isLoading,
    isConfigured,
    error,
  } = dashboard;

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]"
        >
          Erro ao consultar indicadores do Supabase: {error}
        </div>
      )}

      {/* 5 KPI Cards (Section 8) */}
      <section aria-label="Indicadores principais">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Faturamento do período"
            value={
              isConfigured
                ? formatCurrencyFromCents(metrics.periodRevenueCents)
                : '—'
            }
            helperText={
              isConfigured ? 'Pagamentos confirmados (30 dias)' : 'Aguardando Supabase'
            }
            icon={DollarSign}
            isLoading={isLoading}
          />
          <StatCard
            label="Total de pedidos"
            value={isConfigured ? formatInteger(metrics.totalOrdersCount) : '—'}
            helperText={
              isConfigured ? 'Pedidos registrados no tenant' : 'Aguardando Supabase'
            }
            icon={ShoppingBag}
            isLoading={isLoading}
          />
          <StatCard
            label="Agendamentos do dia"
            value={
              isConfigured ? formatInteger(metrics.todayAppointmentsCount) : '—'
            }
            helperText={
              isConfigured ? 'Previstos para hoje' : 'Aguardando Supabase'
            }
            icon={Calendar}
            isLoading={isLoading}
          />
          <StatCard
            label="Clientes cadastrados"
            value={isConfigured ? formatInteger(metrics.customersCount) : '—'}
            helperText={
              isConfigured ? 'Tutores ativos na base' : 'Aguardando Supabase'
            }
            icon={Users}
            isLoading={isLoading}
          />
          <StatCard
            label="Produtos com estoque baixo"
            value={
              isConfigured ? formatInteger(metrics.lowStockProductsCount) : '—'
            }
            helperText={
              isConfigured
                ? 'Abaixo ou igual ao mínimo'
                : 'Aguardando Supabase'
            }
            icon={AlertTriangle}
            isLoading={isLoading}
            tone={
              (metrics.lowStockProductsCount ?? 0) > 0 ? 'alert' : 'default'
            }
          />
        </div>
      </section>

      {/* 2 Analytical Charts (Section 8) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartPanel
          title="Faturamento do período"
          subtitle="Evolução diária de recebimentos pagos (R$)"
          series={revenueSeries}
          valuePrefix="R$ "
          variant="area"
          isConfigured={isConfigured}
          isLoading={isLoading}
          emptyMessage="Conecte o Supabase e registre pagamentos na tabela payments para exibir o faturamento real por dia."
        />
        <ChartPanel
          title="Agendamentos da semana"
          subtitle="Volume diário de atendimentos agendados"
          series={appointmentsSeries}
          variant="bar"
          isConfigured={isConfigured}
          isLoading={isLoading}
          emptyMessage="Conecte o Supabase e crie atendimentos na tabela appointments para visualizar a curva semanal."
        />
      </div>

      {/* Operational Lists: Últimos Pedidos & Próximos Atendimentos */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Últimos Pedidos */}
        <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#EDF2EF] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-[#102D27]">
                Últimos pedidos
              </h2>
              <p className="mt-0.5 text-xs text-[#5C6B66]">
                Vendas recentes vinculadas ao tenant
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('pedidos')}
              className="text-xs font-medium text-[#20483B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Abrir Pedidos
            </button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : recentOrders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={
                  isConfigured
                    ? 'Nenhum pedido registrado'
                    : 'Pedidos aguardando conexão'
                }
                description={
                  isConfigured
                    ? 'Quando vendas forem lançadas na tabela orders, os últimos pedidos aparecerão aqui.'
                    : 'Configure as credenciais do Supabase para consultar os pedidos reais desta empresa.'
                }
                actionLabel={isConfigured ? 'Ir para Pedidos' : 'Configurar Supabase'}
                onAction={() =>
                  navigateTo(isConfigured ? 'pedidos' : 'configuracoes')
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#EDF2EF] text-[11px] font-semibold text-[#5C6B66]">
                      <th className="py-2 pr-3">Pedido</th>
                      <th className="py-2 px-3">Cliente</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 pl-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2EF] text-xs">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#F9FBFA]">
                        <td className="py-2.5 pr-3 font-mono font-medium text-[#102D27] tabular-nums">
                          #{order.order_number}
                        </td>
                        <td className="py-2.5 px-3 text-[#102D27]">
                          {order.customer?.full_name ?? 'Balcão'}
                        </td>
                        <td className="py-2.5 px-3 text-[#5C6B66]">
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono font-medium text-[#102D27] tabular-nums">
                          {formatCurrencyFromCents(order.total_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Próximos Atendimentos */}
        <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#EDF2EF] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-[#102D27]">
                Próximos atendimentos
              </h2>
              <p className="mt-0.5 text-xs text-[#5C6B66]">
                Agenda do dia com atalho manual wa.me
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('agendamentos')}
              className="text-xs font-medium text-[#20483B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver Agenda
            </button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={
                  isConfigured
                    ? 'Nenhum atendimento agendado hoje'
                    : 'Agenda aguardando conexão'
                }
                description={
                  isConfigured
                    ? 'Os próximos agendamentos de banho, tosa e consultas serão listados aqui automaticamente.'
                    : 'Configure o Supabase para carregar a agenda operacional isolada por empresa.'
                }
                actionLabel={
                  isConfigured ? 'Ir para Agendamentos' : 'Configurar Supabase'
                }
                onAction={() =>
                  navigateTo(isConfigured ? 'agendamentos' : 'configuracoes')
                }
              />
            ) : (
              <div className="divide-y divide-[#EDF2EF]">
                {upcomingAppointments.map((appt) => {
                  const phone =
                    appt.customer?.whatsapp || appt.customer?.phone || '';
                  const waUrl = phone
                    ? buildWhatsAppLink(
                        phone,
                        `Olá ${appt.customer?.full_name ?? ''}, confirmando o atendimento de ${appt.pet?.name ?? 'seu pet'} na ${activeTenant?.name ?? 'nossa unidade'}.`
                      )
                    : '';

                  return (
                    <div
                      key={appt.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#102D27]">
                          {appt.pet?.name ?? 'Pet'} ·{' '}
                          {appt.service?.name ?? 'Serviço'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#5C6B66]">
                          <span className="font-mono tabular-nums">
                            {formatShortDateTime(appt.scheduled_start)}
                          </span>{' '}
                          · {appt.customer?.full_name ?? 'Tutor'} ·{' '}
                          {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
                        </p>
                      </div>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#DDE6E1] px-2.5 py-1.5 text-xs font-medium text-[#20483B] transition-colors hover:bg-[#F4F7F5] whitespace-nowrap shrink-0"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Row: Produtos com Estoque Baixo + Atividades Recentes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#EDF2EF] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-[#102D27]">
                Alerta de estoque baixo
              </h2>
              <p className="mt-0.5 text-xs text-[#5C6B66]">
                Itens abaixo do estoque mínimo configurado
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('estoque')}
              className="text-xs font-medium text-[#20483B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Gerenciar Estoque
            </button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : lowStockProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title={
                  isConfigured
                    ? 'Nenhum item crítico no estoque'
                    : 'Estoque aguardando conexão'
                }
                description={
                  isConfigured
                    ? 'Todos os produtos ativos estão acima do ponto mínimo de reposição.'
                    : 'Conecte o Supabase para monitorar saldos reais da tabela products.'
                }
              />
            ) : (
              <div className="divide-y divide-[#EDF2EF]">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#102D27]">
                        {product.name}
                      </p>
                      <p className="text-[#5C6B66]">
                        SKU: {product.sku || '—'} · Mínimo:{' '}
                        <span className="font-mono tabular-nums">
                          {product.min_stock_quantity} {product.unit}
                        </span>
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-[#B45309] tabular-nums whitespace-nowrap shrink-0">
                      {product.stock_quantity} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
          <div className="flex items-center justify-between gap-3 border-b border-[#EDF2EF] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-[#102D27]">
                Atividades recentes
              </h2>
              <p className="mt-0.5 text-xs text-[#5C6B66]">
                Trilha de auditoria multiempresa (audit_logs)
              </p>
            </div>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : recentActivities.length === 0 ? (
              <EmptyState
                icon={Activity}
                title={
                  isConfigured
                    ? 'Sem eventos recentes'
                    : 'Auditoria aguardando conexão'
                }
                description={
                  isConfigured
                    ? 'Ações operacionais, alterações de status e cadastros do tenant aparecerão aqui.'
                    : 'As gravações em audit_logs serão exibidas assim que o Supabase estiver conectado.'
                }
              />
            ) : (
              <div className="divide-y divide-[#EDF2EF]">
                {recentActivities.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#102D27]">
                        {log.action}
                      </p>
                      <p className="truncate text-[#5C6B66]">
                        Entidade: {log.entity_type}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#5C6B66] tabular-nums whitespace-nowrap shrink-0">
                      {formatShortDateTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
