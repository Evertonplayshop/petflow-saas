-- ============================================================================
-- PETFLOW SaaS — Migration 003: Auth Sync & Transactional Tenant Onboarding
-- ============================================================================

-- 1. Sincronizar novos usuários de auth.users para public.profiles automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. Operação transacional segura para criar empresa + proprietário + templates padrão
CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
  p_owner_user_id UUID,
  p_company_name TEXT,
  p_slug TEXT,
  p_legal_name TEXT DEFAULT NULL,
  p_document_number TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  membership_id UUID,
  slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_membership_id UUID;
  v_clean_slug TEXT;
BEGIN
  IF p_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'p_owner_user_id é obrigatório';
  END IF;

  IF char_length(trim(COALESCE(p_company_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Nome da empresa deve ter ao menos 2 caracteres';
  END IF;

  v_clean_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9-]+', '-', 'g'));
  v_clean_slug := trim(BOTH '-' FROM v_clean_slug);

  IF char_length(v_clean_slug) < 2 THEN
    RAISE EXCEPTION 'Slug da empresa inválido';
  END IF;

  -- Garante existência do profile caso trigger ainda não tenha rodado
  INSERT INTO public.profiles (id, full_name, email)
  SELECT u.id,
         COALESCE(NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
         u.email
  FROM auth.users u
  WHERE u.id = p_owner_user_id
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tenants (
    name, slug, legal_name, document_number, phone, whatsapp_phone, email
  )
  VALUES (
    trim(p_company_name),
    v_clean_slug,
    NULLIF(trim(p_legal_name), ''),
    NULLIF(trim(p_document_number), ''),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_email), '')
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.memberships (
    tenant_id, user_id, role, is_active, accepted_at
  )
  VALUES (
    v_tenant_id, p_owner_user_id, 'owner', TRUE, NOW()
  )
  RETURNING id INTO v_membership_id;

  UPDATE public.profiles
  SET default_tenant_id = COALESCE(default_tenant_id, v_tenant_id)
  WHERE id = p_owner_user_id;

  -- Cria modelos iniciais de mensagem WhatsApp para a nova empresa
  INSERT INTO public.message_templates (tenant_id, name, category, body)
  VALUES
    (
      v_tenant_id,
      'Confirmação de Agendamento',
      'appointment_confirmation',
      'Olá {{cliente}}, confirmamos o agendamento de {{servico}} para {{pet}} no dia {{data}} às {{horario}}. Equipe {{empresa}}.'
    ),
    (
      v_tenant_id,
      'Lembrete de Atendimento',
      'appointment_reminder',
      'Olá {{cliente}}, passando para lembrar do horário de {{pet}} ({{servico}}) em {{data}} às {{horario}}. Qualquer dúvida, responda por aqui!'
    ),
    (
      v_tenant_id,
      'Pet Pronto para Retirada',
      'pet_ready',
      'Olá {{cliente}}! {{pet}} já finalizou o atendimento de {{servico}} e está pronto para retirada na {{empresa}}.'
    ),
    (
      v_tenant_id,
      'Atualização de Pedido',
      'order_update',
      'Olá {{cliente}}, seu pedido #{{pedido}} na {{empresa}} está com status: {{status}}.'
    );

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_tenant_id,
    p_owner_user_id,
    'tenant.created',
    'tenants',
    v_tenant_id,
    jsonb_build_object('company_name', trim(p_company_name), 'slug', v_clean_slug)
  );

  RETURN QUERY SELECT v_tenant_id, v_membership_id, v_clean_slug;
END;
$$;

REVOKE ALL ON FUNCTION public.create_tenant_with_owner(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_owner(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
