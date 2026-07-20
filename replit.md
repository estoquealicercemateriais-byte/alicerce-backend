# Alicerce WhatsBot

Sistema completo de atendimento via WhatsApp para a **Alicerce Materiais para Construção**, com painel de gestão web e bot automatizado via Evolution API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — rodar servidor API (porta 5000)
- `pnpm --filter @workspace/whatsbot-dashboard run dev` — rodar painel web
- `pnpm run typecheck` — typecheck completo
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e schemas da spec OpenAPI
- `pnpm --filter @workspace/db run push` — aplicar mudanças de schema no DB (dev only)
- Required env: `DATABASE_URL` — string de conexão Postgres

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod v3
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind + shadcn/ui + TanStack Query
- WhatsApp: Evolution API (self-hosted)

## Where things live

- `lib/api-spec/openapi.yaml` — contrato OpenAPI (source of truth)
- `lib/db/src/schema/` — schema do banco (products, conversations, messages, orders, order_items, budget_requests, store_settings)
- `artifacts/api-server/src/routes/` — rotas Express
- `artifacts/api-server/src/services/evolutionBot.ts` — lógica do bot e integração Evolution API
- `artifacts/whatsbot-dashboard/src/pages/` — páginas do painel web

## Architecture decisions

- Bot opera como máquina de estados (campo `bot_step` na tabela conversations)
- Status da conversa: `bot` (bot respondendo), `human` (atendente assumiu), `closed` (encerrado)
- Webhook da Evolution API recebe mensagens em `/api/webhook/evolution`
- Configurações da Evolution API ficam na tabela `store_settings` (URL, API key, instance name)
- Mensagens outbound são salvas no DB antes de tentar enviar via Evolution (falha silenciosa se API não configurada)

## Product

- **Painel de Controle**: visão geral com métricas e conversas recentes
- **Conversas**: lista com status + painel lateral de mensagens, envio manual e toggle bot/humano
- **Pedidos**: gestão de pedidos com itens e atualização de status
- **Orçamentos**: solicitações de orçamento dos clientes com notas internas
- **Catálogo**: CRUD completo de produtos (nome, categoria, preço, unidade, estoque)
- **Configurações**: dados da loja e credenciais da Evolution API

## WhatsApp Bot Flow

```
Menu principal → 1 (Produtos) → exibe catálogo → menu
             → 2 (Orçamento) → solicita descrição → salva BudgetRequest → menu
             → 3 (Pedido) → informa equipe → menu
             → 4 (Horário/Local) → exibe info da loja → menu
             → 5 (Atendente) → muda status para "human" → atendente assume
```

## User preferences

_Populate as you build._

## Gotchas

- Para integrar a Evolution API: configure URL, API Key e Instance Name em Configurações > Evolution API
- O webhook deve ser configurado na Evolution API apontando para `/api/webhook/evolution`
- Ao mudar schema do DB, rodar `pnpm --filter @workspace/db run push` antes de reiniciar o servidor
