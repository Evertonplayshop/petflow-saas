export type AppRole =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'attendant'
  | 'stock_clerk'
  | 'employee';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'failed'
  | 'cancelled';

export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'bank_transfer'
  | 'other';

export type StockMovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'return_in'
  | 'loss_out';

export type ExpenseStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type WhatsAppTemplateCategory =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'order_update'
  | 'pet_ready'
  | 'general';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  document_number: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  logo_url: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  timezone: string;
  currency: string;
  plan_tier: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  is_active: boolean;
  cakto_subscription_id?: string | null;
  cakto_checkout_url?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  default_tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: AppRole;
  is_active: boolean;
  accepted_at: string | null;
  created_at: string;
  tenant?: Tenant;
}

export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  document_number: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Pet {
  id: string;
  tenant_id: string;
  customer_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rodent' | 'reptile' | 'other';
  breed: string | null;
  size: 'mini' | 'small' | 'medium' | 'large' | 'giant' | null;
  weight_kg: number | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
}

export interface Employee {
  id: string;
  tenant_id: string;
  user_id: string | null;
  full_name: string;
  role_title: string;
  email: string | null;
  phone: string | null;
  commission_rate: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  customer_id: string;
  pet_id: string;
  service_id: string;
  employee_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: AppointmentStatus;
  price_cents: number;
  notes: string | null;
  customer?: Pick<Customer, 'id' | 'full_name' | 'phone' | 'whatsapp'>;
  pet?: Pick<Pet, 'id' | 'name' | 'species'>;
  service?: Pick<ServiceItem, 'id' | 'name'>;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  supplier_id: string | null;
  sku: string | null;
  name: string;
  unit: string;
  cost_cents: number;
  sale_price_cents: number;
  stock_quantity: number;
  min_stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: number;
  customer_id: string | null;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  customer?: Pick<Customer, 'id' | 'full_name' | 'phone'> | null;
}

export interface MessageTemplate {
  id: string;
  tenant_id: string;
  name: string;
  category: WhatsAppTemplateCategory;
  body: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
