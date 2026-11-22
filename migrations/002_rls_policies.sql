-- ============================================================================
-- PETFLOW SaaS — Migration 002: Row Level Security (RLS) & RBAC Policies
-- Isolamento estrito multiempresa por tenant_id e verificação de papel
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper Functions (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_super_admin = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.tenants t ON t.id = m.tenant_id
    WHERE m.tenant_id = p_tenant_id
      AND m.user_id = auth.uid()
      AND m.is_active = TRUE
      AND t.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.tenants t ON t.id = m.tenant_id
    WHERE m.tenant_id = p_tenant_id
      AND m.user_id = auth.uid()
      AND m.is_active = TRUE
      AND t.is_active = TRUE
      AND m.role = ANY(p_roles)
  );
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS on ALL 18 tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. tenants
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS tenants_select_policy ON public.tenants;
CREATE POLICY tenants_select_policy ON public.tenants
  FOR SELECT USING (public.is_tenant_member(id));

DROP POLICY IF EXISTS tenants_update_policy ON public.tenants;
CREATE POLICY tenants_update_policy ON public.tenants
  FOR UPDATE USING (public.has_tenant_role(id, ARRAY['owner', 'manager']::public.app_role[]))
  WITH CHECK (public.has_tenant_role(id, ARRAY['owner', 'manager']::public.app_role[]));

-- ----------------------------------------------------------------------------
-- 2. profiles
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.memberships m1
      JOIN public.memberships m2 ON m1.tenant_id = m2.tenant_id
      WHERE m1.user_id = auth.uid()
        AND m2.user_id = profiles.id
        AND m1.is_active = TRUE
        AND m2.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS profiles_update_self_policy ON public.profiles;
CREATE POLICY profiles_update_self_policy ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ----------------------------------------------------------------------------
-- 3. memberships
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS memberships_select_policy ON public.memberships;
CREATE POLICY memberships_select_policy ON public.memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS memberships_insert_policy ON public.memberships;
CREATE POLICY memberships_insert_policy ON public.memberships
  FOR INSERT WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS memberships_update_policy ON public.memberships;
CREATE POLICY memberships_update_policy ON public.memberships
  FOR UPDATE USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS memberships_delete_policy ON public.memberships;
CREATE POLICY memberships_delete_policy ON public.memberships
  FOR DELETE USING (
    public.has_tenant_role(tenant_id, ARRAY['owner']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 4. customers & 5. pets (Front-desk & Operations)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS customers_tenant_select ON public.customers;
CREATE POLICY customers_tenant_select ON public.customers
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS customers_tenant_write ON public.customers;
CREATE POLICY customers_tenant_write ON public.customers
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  );

DROP POLICY IF EXISTS pets_tenant_select ON public.pets;
CREATE POLICY pets_tenant_select ON public.pets
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS pets_tenant_write ON public.pets;
CREATE POLICY pets_tenant_write ON public.pets
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 6. services & 7. employees
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS services_tenant_select ON public.services;
CREATE POLICY services_tenant_select ON public.services
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS services_tenant_write ON public.services;
CREATE POLICY services_tenant_write ON public.services
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS employees_tenant_select ON public.employees;
CREATE POLICY employees_tenant_select ON public.employees
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS employees_tenant_write ON public.employees;
CREATE POLICY employees_tenant_write ON public.employees
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 8. appointments
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS appointments_tenant_select ON public.appointments;
CREATE POLICY appointments_tenant_select ON public.appointments
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS appointments_tenant_write ON public.appointments;
CREATE POLICY appointments_tenant_write ON public.appointments
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 9. categories, 10. suppliers, 11. products, 12. stock_movements
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS categories_tenant_select ON public.categories;
CREATE POLICY categories_tenant_select ON public.categories
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS categories_tenant_write ON public.categories;
CREATE POLICY categories_tenant_write ON public.categories
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  );

DROP POLICY IF EXISTS suppliers_tenant_select ON public.suppliers;
CREATE POLICY suppliers_tenant_select ON public.suppliers
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS suppliers_tenant_write ON public.suppliers;
CREATE POLICY suppliers_tenant_write ON public.suppliers
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  );

DROP POLICY IF EXISTS products_tenant_select ON public.products;
CREATE POLICY products_tenant_select ON public.products
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS products_tenant_write ON public.products;
CREATE POLICY products_tenant_write ON public.products
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  );

DROP POLICY IF EXISTS stock_movements_tenant_select ON public.stock_movements;
CREATE POLICY stock_movements_tenant_select ON public.stock_movements
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS stock_movements_tenant_insert ON public.stock_movements;
CREATE POLICY stock_movements_tenant_insert ON public.stock_movements
  FOR INSERT WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'stock_clerk', 'attendant']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 13. orders & 14. order_items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS orders_tenant_select ON public.orders;
CREATE POLICY orders_tenant_select ON public.orders
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS orders_tenant_write ON public.orders;
CREATE POLICY orders_tenant_write ON public.orders
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  );

DROP POLICY IF EXISTS order_items_tenant_select ON public.order_items;
CREATE POLICY order_items_tenant_select ON public.order_items
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS order_items_tenant_write ON public.order_items;
CREATE POLICY order_items_tenant_write ON public.order_items
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 15. payments & 16. expenses (Financial access restricted)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS payments_tenant_select ON public.payments;
CREATE POLICY payments_tenant_select ON public.payments
  FOR SELECT USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  );

DROP POLICY IF EXISTS payments_tenant_write ON public.payments;
CREATE POLICY payments_tenant_write ON public.payments
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager', 'attendant']::public.app_role[])
  );

DROP POLICY IF EXISTS expenses_tenant_select ON public.expenses;
CREATE POLICY expenses_tenant_select ON public.expenses
  FOR SELECT USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS expenses_tenant_write ON public.expenses;
CREATE POLICY expenses_tenant_write ON public.expenses
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

-- ----------------------------------------------------------------------------
-- 17. message_templates & 18. audit_logs
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS message_templates_tenant_select ON public.message_templates;
CREATE POLICY message_templates_tenant_select ON public.message_templates
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS message_templates_tenant_write ON public.message_templates;
CREATE POLICY message_templates_tenant_write ON public.message_templates
  FOR ALL USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  )
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS audit_logs_tenant_select ON public.audit_logs;
CREATE POLICY audit_logs_tenant_select ON public.audit_logs
  FOR SELECT USING (
    public.has_tenant_role(tenant_id, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS audit_logs_tenant_insert ON public.audit_logs;
CREATE POLICY audit_logs_tenant_insert ON public.audit_logs
  FOR INSERT WITH CHECK (
    tenant_id IS NULL AND public.is_super_admin()
    OR public.is_tenant_member(tenant_id)
  );
