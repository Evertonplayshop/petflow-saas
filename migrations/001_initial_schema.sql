-- ============================================================================
-- PETFLOW SaaS — Migration 001: Initial Multi-Tenant Schema
-- PostgreSQL / Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'owner',
    'manager',
    'attendant',
    'stock_clerk',
    'employee'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'in_progress',
    'ready_for_pickup',
    'completed',
    'cancelled',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'draft',
    'pending',
    'paid',
    'preparing',
    'ready',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'partially_paid',
    'refunded',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM (
    'pix',
    'credit_card',
    'debit_card',
    'cash',
    'bank_transfer',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_type AS ENUM (
    'purchase_in',
    'sale_out',
    'adjustment_in',
    'adjustment_out',
    'return_in',
    'loss_out'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_status AS ENUM (
    'pending',
    'paid',
    'overdue',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.whatsapp_template_category AS ENUM (
    'appointment_confirmation',
    'appointment_reminder',
    'order_update',
    'pet_ready',
    'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- Updated_at Trigger Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. tenants (Empresas / Pet Shops)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  legal_name TEXT,
  document_number TEXT,
  email TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  logo_url TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  currency TEXT NOT NULL DEFAULT 'BRL',
  plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'cancelled')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants (is_active) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 2. profiles (Usuários globais sincronizados com auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  default_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));

-- ----------------------------------------------------------------------------
-- 3. memberships (Vínculo multiempresa Usuário <-> Tenant + Papel RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_memberships_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships (user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.memberships (tenant_id, role);

-- ----------------------------------------------------------------------------
-- 4. customers (Clientes / Tutores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  document_number TEXT,
  address_line TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON public.customers (tenant_id, full_name);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON public.customers (tenant_id, phone);

-- ----------------------------------------------------------------------------
-- 5. pets (Animais vinculados ao cliente e tenant)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1),
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'bird', 'rodent', 'reptile', 'other')),
  breed TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
  size TEXT CHECK (size IN ('mini', 'small', 'medium', 'large', 'giant')),
  weight_kg NUMERIC(6, 2) CHECK (weight_kg IS NULL OR weight_kg >= 0),
  birth_date DATE,
  coat_color TEXT,
  microchip_code TEXT,
  allergies TEXT,
  medical_notes TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_tenant_customer ON public.pets (tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_pets_tenant_name ON public.pets (tenant_id, name);

-- ----------------------------------------------------------------------------
-- 6. services (Serviços de Banho, Tosa, Clínica, Hotel, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  category TEXT NOT NULL DEFAULT 'grooming',
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_tenant_active ON public.services (tenant_id, is_active);

-- ----------------------------------------------------------------------------
-- 7. employees (Funcionários operacionais do Pet Shop)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  role_title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  hired_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant_active ON public.employees (tenant_id, is_active);

-- ----------------------------------------------------------------------------
-- 8. appointments (Agendamentos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  notes TEXT,
  whatsapp_notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_appointments_time CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_start ON public.appointments (tenant_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_status ON public.appointments (tenant_id, status);

-- ----------------------------------------------------------------------------
-- 9. categories (Categorias de Produtos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_categories_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON public.categories (tenant_id);

-- ----------------------------------------------------------------------------
-- 10. suppliers (Fornecedores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL CHECK (char_length(trim(company_name)) >= 2),
  trade_name TEXT,
  document_number TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address_line TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_active ON public.suppliers (tenant_id, is_active);

-- ----------------------------------------------------------------------------
-- 11. products (Produtos / Catálogo e Estoque Atual)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  sku TEXT,
  barcode TEXT,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'un',
  cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
  sale_price_cents INTEGER NOT NULL CHECK (sale_price_cents >= 0),
  stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  min_stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (min_stock_quantity >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_products_tenant_sku UNIQUE (tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON public.products (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products (tenant_id, stock_quantity, min_stock_quantity) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------------
-- 12. stock_movements (Movimentações de Estoque)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  movement_type public.stock_movement_type NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  unit_cost_cents INTEGER CHECK (unit_cost_cents IS NULL OR unit_cost_cents >= 0),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_product ON public.stock_movements (tenant_id, product_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 13. orders (Pedidos / Vendas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number BIGSERIAL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON public.orders (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders (tenant_id, status);

-- ----------------------------------------------------------------------------
-- 14. order_items (Itens dos Pedidos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_order_item_ref CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_order_items_tenant_order ON public.order_items (tenant_id, order_id);

-- ----------------------------------------------------------------------------
-- 15. payments (Pagamentos / Recebimentos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_at TIMESTAMPTZ,
  external_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_paid ON public.payments (tenant_id, status, paid_at DESC);

-- ----------------------------------------------------------------------------
-- 16. expenses (Despesas / Contas a Pagar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status public.expense_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_due ON public.expenses (tenant_id, status, due_date);

-- ----------------------------------------------------------------------------
-- 17. message_templates (Modelos WhatsApp wa.me)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category public.whatsapp_template_category NOT NULL DEFAULT 'general',
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_tenant ON public.message_templates (tenant_id, category);

-- ----------------------------------------------------------------------------
-- 18. audit_logs (Trilha de Auditoria Multiempresa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs (tenant_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- Attach updated_at Triggers
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'tenants', 'profiles', 'memberships', 'customers', 'pets',
    'services', 'employees', 'appointments', 'categories', 'suppliers',
    'products', 'orders', 'payments', 'expenses', 'message_templates'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;
