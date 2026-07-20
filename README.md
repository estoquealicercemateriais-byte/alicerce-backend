# WhatsBot Construcao

Projeto monorepo para painel administrativo e bot de WhatsApp com integração Evolution API.

## Estrutura
- artifacts/api-server: API backend
- artifacts/whatsbot-dashboard: painel frontend
- lib: bibliotecas compartilhadas

## Deploy
- Frontend: Vercel
- Backend: Railway

## Variáveis de ambiente
Veja o arquivo .env.example

## Banco de dados Supabase
Use a URL de conexão do Supabase no campo DATABASE_URL.
Exemplo:
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

Para criar as tabelas, rode:
corepack pnpm --filter @workspace/db push
