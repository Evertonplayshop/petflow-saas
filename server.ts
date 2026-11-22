import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CAKTO_CHECKOUT_URL =
  process.env.CAKTO_CHECKOUT_URL ||
  'https://pay.cakto.com.br/36edgkj_1356460';
const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET || '';

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sanitizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function secretMatchesHeader(received: string | undefined, secret: string): boolean {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

function findPayloadValue(payload: unknown, keys: string[]): unknown {
  if (!payload || typeof payload !== 'object') return undefined;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const value = findPayloadValue(item, keys);
      if (value !== undefined) return value;
    }
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (typeof record[key] === 'string' || typeof record[key] === 'number') {
      return record[key];
    }
  }
  for (const value of Object.values(record)) {
    const nested = findPayloadValue(value, keys);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

async function createApp(options: { localServer?: boolean } = {}) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // --------------------------------------------------------------------------
  // API: Health & Supabase Configuration Status (never exposes secrets)
  // --------------------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    const clientConfigured = Boolean(
      process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
    );
    const serverConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

    res.json({
      status: 'ok',
      service: 'petflow-api',
      supabase: {
        clientConfigured,
        serverConfigured,
      },
    });
  });

  app.get('/api/billing/status', async (req: Request, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      res.status(401).json({ error: 'INVALID_TOKEN' });
      return;
    }

    const { data: memberships } = await supabaseAdmin
      .from('memberships')
      .select('tenant:tenants(id, name, plan_tier, subscription_status, current_period_end, cancel_at_period_end)')
      .eq('user_id', userData.user.id)
      .eq('is_active', true)
      .limit(1);

    const tenant = Array.isArray(memberships)
      ? ((memberships[0] as unknown as { tenant?: unknown })?.tenant as
          | { id?: string; plan_tier?: string; subscription_status?: string; current_period_end?: string; cancel_at_period_end?: boolean }
          | undefined)
      : undefined;

    res.json({
      planName: 'PETFLOW Mensal',
      priceCents: Number(process.env.CAKTO_MONTHLY_PRICE_CENTS || 5000),
      currency: 'BRL',
      billingInterval: 'month',
      checkoutUrl: CAKTO_CHECKOUT_URL,
      tenant: tenant ?? null,
    });
  });

  app.post('/api/billing/cakto/webhook', async (req: Request, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'SUPABASE_NOT_CONFIGURED' });
      return;
    }

    if (!CAKTO_WEBHOOK_SECRET) {
      res.status(503).json({ error: 'WEBHOOK_SECRET_NOT_CONFIGURED' });
      return;
    }

    const received =
      typeof req.headers['x-cakto-webhook-secret'] === 'string'
        ? req.headers['x-cakto-webhook-secret']
        : typeof req.headers['x-webhook-secret'] === 'string'
          ? req.headers['x-webhook-secret']
          : undefined;
    if (!secretMatchesHeader(received, CAKTO_WEBHOOK_SECRET)) {
      res.status(401).json({ error: 'INVALID_WEBHOOK_SECRET' });
      return;
    }

    const payload = req.body ?? {};
    const eventType =
      String(
        findPayloadValue(payload, [
          'event',
          'event_type',
          'type',
          'status',
          'state',
        ]) ?? 'unknown'
      ).toLowerCase();
    const eventId =
      findPayloadValue(payload, ['event_id', 'eventId', 'id', 'transaction_id']) ??
      null;
    const tenantId =
      findPayloadValue(payload, ['tenant_id', 'tenantId', 'company_id']) ?? null;
    const email =
      findPayloadValue(payload, ['customer_email', 'buyer_email', 'email']) ?? null;
    const subscriptionId =
      findPayloadValue(payload, ['subscription_id', 'subscriptionId']) ?? null;
    const periodEnd =
      findPayloadValue(payload, ['current_period_end', 'period_end', 'expires_at']) ??
      null;

    let resolvedTenantId =
      typeof tenantId === 'string' ? tenantId : null;
    if (!resolvedTenantId && typeof email === 'string') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('default_tenant_id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      resolvedTenantId = profile?.default_tenant_id ?? null;
    }

    const paid =
      eventType.includes('paid') ||
      eventType.includes('approved') ||
      eventType.includes('active') ||
      eventType.includes('success') ||
      eventType.includes('completed');
    const cancelled =
      eventType.includes('cancel') ||
      eventType.includes('refund') ||
      eventType.includes('chargeback') ||
      eventType.includes('expired');
    const pastDue =
      eventType.includes('past_due') ||
      eventType.includes('overdue') ||
      eventType.includes('failed') ||
      eventType.includes('denied');

    if (resolvedTenantId) {
      const update: Record<string, unknown> = {
        cakto_checkout_url: CAKTO_CHECKOUT_URL,
        cancel_at_period_end: cancelled,
      };
      if (paid) update.subscription_status = 'active';
      if (pastDue) update.subscription_status = 'past_due';
      if (cancelled) update.subscription_status = 'cancelled';
      if (typeof subscriptionId === 'string') {
        update.cakto_subscription_id = subscriptionId;
      }
      if (typeof periodEnd === 'string') {
        const date = new Date(periodEnd);
        if (!Number.isNaN(date.getTime())) update.current_period_end = date.toISOString();
      }
      if (paid) update.plan_tier = 'professional';

      await supabaseAdmin
        .from('tenants')
        .update(update)
        .eq('id', resolvedTenantId);
    }

    await supabaseAdmin.from('billing_events').upsert(
      {
        tenant_id: resolvedTenantId,
        provider: 'cakto',
        provider_event_id:
          eventId === null ? null : String(eventId),
        event_type: eventType,
        payload,
      },
      { onConflict: 'provider,provider_event_id', ignoreDuplicates: true }
    );

    res.status(200).json({ received: true });
  });

  // --------------------------------------------------------------------------
  // API: Transactional Tenant + Owner Onboarding (Backend + PostgreSQL RPC)
  // --------------------------------------------------------------------------
  app.post('/api/tenants/register', async (req: Request, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(503).json({
        error: 'SUPABASE_NOT_CONFIGURED',
        message:
          'As credenciais administrativas do Supabase (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY) não estão configuradas no servidor.',
      });
      return;
    }

    const {
      companyName,
      companySlug,
      legalName,
      documentNumber,
      companyPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone,
    } = req.body ?? {};

    if (
      typeof companyName !== 'string' ||
      companyName.trim().length < 2 ||
      typeof ownerName !== 'string' ||
      ownerName.trim().length < 2 ||
      typeof ownerEmail !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()) ||
      typeof ownerPassword !== 'string' ||
      ownerPassword.length < 8
    ) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message:
          'Verifique os dados obrigatórios: nome da empresa, nome do proprietário, e-mail válido e senha com ao menos 8 caracteres.',
      });
      return;
    }

    const finalSlug = sanitizeSlug(
      typeof companySlug === 'string' && companySlug.trim().length >= 2
        ? companySlug
        : companyName
    );

    if (finalSlug.length < 2) {
      res.status(400).json({
        error: 'INVALID_SLUG',
        message: 'Identificador (slug) da empresa inválido.',
      });
      return;
    }

    let createdUserId: string | null = null;

    try {
      const { data: userResult, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
          email: ownerEmail.trim().toLowerCase(),
          password: ownerPassword,
          email_confirm: true,
          user_metadata: {
            full_name: ownerName.trim(),
            phone: typeof ownerPhone === 'string' ? ownerPhone.trim() : null,
          },
        });

      if (createUserError || !userResult.user) {
        res.status(400).json({
          error: 'AUTH_CREATE_FAILED',
          message:
            createUserError?.message ||
            'Não foi possível criar a conta do proprietário.',
        });
        return;
      }

      createdUserId = userResult.user.id;

      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
        'create_tenant_with_owner',
        {
          p_owner_user_id: createdUserId,
          p_company_name: companyName.trim(),
          p_slug: finalSlug,
          p_legal_name: typeof legalName === 'string' ? legalName.trim() : null,
          p_document_number:
            typeof documentNumber === 'string' ? documentNumber.trim() : null,
          p_phone: typeof companyPhone === 'string' ? companyPhone.trim() : null,
          p_email: ownerEmail.trim().toLowerCase(),
        }
      );

      if (rpcError) {
        // Compensa falha removendo usuário recém-criado para manter atomicidade
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        res.status(400).json({
          error: 'TENANT_CREATE_FAILED',
          message:
            rpcError.message ||
            'Erro ao registrar empresa e vínculo do proprietário.',
        });
        return;
      }

      const resultRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      res.status(201).json({
        tenantId: resultRow?.tenant_id ?? null,
        membershipId: resultRow?.membership_id ?? null,
        slug: resultRow?.slug ?? finalSlug,
        ownerUserId: createdUserId,
      });
    } catch (err) {
      if (createdUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId).catch(() => {});
      }
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Erro interno ao processar cadastro multiempresa.',
      });
    }
  });

  // --------------------------------------------------------------------------
  // API: Backend RBAC & Membership Verification
  // --------------------------------------------------------------------------
  app.get('/api/auth/permissions', async (req: Request, res: Response) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      res.status(503).json({
        error: 'SUPABASE_NOT_CONFIGURED',
        message: 'Supabase não configurado no servidor.',
      });
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token de autenticação ausente.',
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Sessão inválida ou expirada.',
      });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, is_super_admin, default_tenant_id')
      .eq('id', userData.user.id)
      .maybeSingle();

    const { data: memberships } = await supabaseAdmin
      .from('memberships')
      .select(
        'id, tenant_id, role, is_active, tenant:tenants(id, name, slug, logo_url, plan_tier, subscription_status, is_active)'
      )
      .eq('user_id', userData.user.id)
      .eq('is_active', true);

    res.json({
      userId: userData.user.id,
      profile,
      memberships: memberships ?? [],
    });
  });

  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      next: (error?: unknown) => void
    ) => {
      if (
        typeof err === 'object' &&
        err !== null &&
        'type' in err &&
        (err as { type?: string }).type === 'entity.parse.failed'
      ) {
        res.status(400).json({
          error: 'INVALID_JSON',
          message: 'O corpo da requisição não contém um JSON válido.',
        });
        return;
      }
      next(err);
    }
  );

  // --------------------------------------------------------------------------
  if (options.localServer) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PETFLOW server listening on http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

let vercelApp: ReturnType<typeof createApp> | undefined;

export async function handleVercelRequest(req: Request, res: Response) {
  vercelApp ??= createApp();
  const app = await vercelApp;
  app(req, res);
}

if (!process.env.VERCEL) {
  createApp({ localServer: true }).catch((err) => {
    console.error('Failed to start PETFLOW server:', err);
    process.exit(1);
  });
}
