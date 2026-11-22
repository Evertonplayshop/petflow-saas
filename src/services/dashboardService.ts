import { getSupabaseClient, isSupabaseConfigured } from '../integrations/supabase/client';
import { AppServiceError } from '../lib/errors';
import type { DashboardDataState, TimeSeriesPoint } from '../types/dashboard';
import type { Appointment, AuditLog, Order, Product } from '../types/database';

function startOfDayIso(date: Date): string {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function endOfDayIso(date: Date): string {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.toISOString();
}

function buildDailySeries(
  rows: Array<{ dateIso: string; value: number }>,
  days = 7
): TimeSeriesPoint[] {
  if (rows.length === 0) return [];

  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const row of rows) {
    const key = row.dateIso.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + row.value);
    }
  }

  return Array.from(buckets.entries()).map(([isoDate, value]) => {
    const [, month, day] = isoDate.split('-');
    return {
      label: `${day}/${month}`,
      value,
    };
  });
}

export const dashboardService = {
  createUnconfiguredState(): DashboardDataState {
    return {
      metrics: {
        periodRevenueCents: null,
        totalOrdersCount: null,
        todayAppointmentsCount: null,
        customersCount: null,
        lowStockProductsCount: null,
      },
      revenueSeries: [],
      appointmentsSeries: [],
      recentOrders: [],
      upcomingAppointments: [],
      lowStockProducts: [],
      recentActivities: [],
      isLoading: false,
      isConfigured: false,
      error: null,
      lastUpdatedAt: null,
    };
  },

  async fetchTenantDashboard(tenantId: string): Promise<DashboardDataState> {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      return this.createUnconfiguredState();
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const todayStart = startOfDayIso(now);
    const todayEnd = endOfDayIso(now);

    const [
      paymentsRes,
      ordersCountRes,
      todayAppointmentsRes,
      customersCountRes,
      productsRes,
      recentOrdersRes,
      upcomingAppointmentsRes,
      weekAppointmentsRes,
      auditLogsRes,
    ] = await Promise.all([
      supabase
        .from('payments')
        .select('amount_cents, paid_at, created_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('scheduled_start', todayStart)
        .lte('scheduled_start', todayEnd),
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id, tenant_id, category_id, supplier_id, sku, name, unit, cost_cents, sale_price_cents, stock_quantity, min_stock_quantity, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
      supabase
        .from('orders')
        .select('id, tenant_id, order_number, customer_id, status, total_cents, created_at, customer:customers(id, full_name, phone)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('appointments')
        .select('id, tenant_id, customer_id, pet_id, service_id, employee_id, scheduled_start, scheduled_end, status, price_cents, notes, customer:customers(id, full_name, phone, whatsapp), pet:pets(id, name, species), service:services(id, name)')
        .eq('tenant_id', tenantId)
        .gte('scheduled_start', todayStart)
        .order('scheduled_start', { ascending: true })
        .limit(5),
      supabase
        .from('appointments')
        .select('scheduled_start')
        .eq('tenant_id', tenantId)
        .gte('scheduled_start', sevenDaysAgo.toISOString()),
      supabase
        .from('audit_logs')
        .select('id, tenant_id, actor_user_id, action, entity_type, entity_id, metadata, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const firstError =
      paymentsRes.error ||
      ordersCountRes.error ||
      todayAppointmentsRes.error ||
      customersCountRes.error ||
      productsRes.error ||
      recentOrdersRes.error ||
      upcomingAppointmentsRes.error ||
      weekAppointmentsRes.error ||
      auditLogsRes.error;

    if (firstError) {
      throw new AppServiceError(firstError.message, 'DASHBOARD_QUERY_ERROR');
    }

    const paidRows = paymentsRes.data ?? [];
    const periodRevenueCents = paidRows.reduce(
      (sum, row) => sum + (Number(row.amount_cents) || 0),
      0
    );

    const allProducts = (productsRes.data ?? []) as Product[];
    const lowStockProducts = allProducts.filter(
      (p) => Number(p.stock_quantity) <= Number(p.min_stock_quantity)
    );

    const revenueSeries = buildDailySeries(
      paidRows.map((row) => ({
        dateIso: String(row.paid_at || row.created_at),
        value: Math.round((Number(row.amount_cents) || 0) / 100),
      })),
      7
    );

    const appointmentsSeries = buildDailySeries(
      (weekAppointmentsRes.data ?? []).map((row) => ({
        dateIso: String(row.scheduled_start),
        value: 1,
      })),
      7
    );

    return {
      metrics: {
        periodRevenueCents,
        totalOrdersCount: ordersCountRes.count ?? 0,
        todayAppointmentsCount: todayAppointmentsRes.count ?? 0,
        customersCount: customersCountRes.count ?? 0,
        lowStockProductsCount: lowStockProducts.length,
      },
      revenueSeries,
      appointmentsSeries,
      recentOrders: (recentOrdersRes.data as unknown as Order[]) ?? [],
      upcomingAppointments:
        (upcomingAppointmentsRes.data as unknown as Appointment[]) ?? [],
      lowStockProducts: lowStockProducts.slice(0, 6),
      recentActivities: (auditLogsRes.data as AuditLog[]) ?? [],
      isLoading: false,
      isConfigured: true,
      error: null,
      lastUpdatedAt: new Date().toISOString(),
    };
  },
};
