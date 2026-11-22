import type { Appointment, AuditLog, Order, Product } from '../types/database';

export interface DashboardMetrics {
  periodRevenueCents: number | null;
  totalOrdersCount: number | null;
  todayAppointmentsCount: number | null;
  customersCount: number | null;
  lowStockProductsCount: number | null;
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface DashboardDataState {
  metrics: DashboardMetrics;
  revenueSeries: TimeSeriesPoint[];
  appointmentsSeries: TimeSeriesPoint[];
  recentOrders: Order[];
  upcomingAppointments: Appointment[];
  lowStockProducts: Product[];
  recentActivities: AuditLog[];
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
}
