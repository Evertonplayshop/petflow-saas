# PETFLOW

Aplicação React/Vite com API Express compatível com execução local e funções serverless da Vercel.

## Desenvolvimento local

Requisitos: Node.js 22.12 ou superior.

```bash
npm install
npm run dev
```

Crie um `.env.local` a partir de `.env.example` e preencha as credenciais necessárias. Nunca use `VITE_` em chaves secretas.

## Publicação na Vercel

1. Importe o repositório no painel da Vercel e selecione o framework **Vite**.
2. A configuração `vercel.json` executa `npm run build` e publica `dist`. A navegação do app ocorre na rota raiz com estado em query string; a API é exposta separadamente pela função `api/[...path].ts`.
3. Configure estas variáveis em **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (pode ser igual a `VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; nunca prefixar com `VITE_`)
   - `CAKTO_CHECKOUT_URL`
   - `CAKTO_MONTHLY_PRICE_CENTS` (`5000` para R$ 50/mês)
   - `CAKTO_WEBHOOK_SECRET` (segredo definido também na configuração do webhook)
   - `GEMINI_API_KEY`, se usar os recursos Gemini
4. Execute as migrations `001` a `005` no SQL Editor do Supabase, na ordem.
5. Em **Authentication → URL Configuration** do Supabase, configure o domínio da Vercel como Site URL e inclua o domínio de produção e os previews necessários em Redirect URLs.
6. Configure o webhook da Cakto para `https://SEU-DOMINIO/api/billing/cakto/webhook` e use o segredo configurado em `CAKTO_WEBHOOK_SECRET` no cabeçalho `x-cakto-webhook-secret` ou `x-webhook-secret`.
7. Após o deploy, verifique `https://SEU-DOMINIO/api/health`.

As credenciais e chaves de serviço devem ser definidas como variáveis de ambiente da Vercel, nunca enviadas ao repositório.
