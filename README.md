# WhatsBot Construcao

Projeto monorepo para painel administrativo e bot de WhatsApp com integração Evolution API.

## Estrutura
- artifacts/api-server: API backend
- artifacts/whatsbot-dashboard: painel frontend
- lib: bibliotecas compartilhadas

## Deploy
- Frontend: Vercel
- Backend: Railway

No projeto da Vercel, configure `VITE_API_BASE_URL` com a URL publica do backend Railway, sem barra no final.
Exemplo:
`VITE_API_BASE_URL=https://seu-backend.up.railway.app`

## Variáveis de ambiente
Veja o arquivo .env.example

### Seguranca do WhatsApp
Por padrao o backend nao envia respostas automaticas nem permite envio manual pelo painel. Isso evita disparos acidentais e reduz risco de bloqueio da conta.

- `WHATSAPP_BOT_AUTO_REPLY_ENABLED=true`: habilita respostas automaticas somente para conversas diretas que enviarem comando de opt-in como `oi`, `ola`, `menu`, `inicio`, `comecar` ou `atendimento`.
- `WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST=1`: limita quantas ofertas o bot envia por pedido. O limite maximo aceito pelo codigo e 3.
- `WHATSAPP_MANUAL_SEND_ENABLED=true`: habilita envio manual pela rota de conversas.
- `ADMIN_API_KEY=...`: chave obrigatoria no header `x-admin-api-key` para envio manual quando ele estiver habilitado.
- `EVOLUTION_WEBHOOK_SECRET=...`: se configurado, a rota `/api/webhook/evolution` exige o segredo no header `x-webhook-secret` ou na query `?secret=...`.

O webhook ignora mensagens de grupos, broadcasts, status e newsletters. Comandos `parar`, `sair`, `cancelar`, `bloquear`, `remover`, `descadastrar` e `stop` fecham a conversa e interrompem respostas automaticas.

## Banco de dados Supabase
Use a URL de conexão do Supabase no campo DATABASE_URL.
Exemplo:
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

Para criar as tabelas, rode:
corepack pnpm --filter @workspace/db push
