# Finance Family — versão só online

Controle financeiro da família (entradas, saídas, orçamentos por categoria e insights).
Esta é a versão **só online**: não guarda dados no aparelho, não tem fila nem sincronização.
O que resta de "app" é o **PWA instalável** (manifest, ícones e um Service Worker mínimo que não guarda nada).

A versão com uso offline está na pasta irmã `finance-family/`, que não é alterada por esta.

## Stack

Next.js (App Router) + TypeScript + Prisma 7 + PostgreSQL + TanStack Query + React Hook Form + Zod + SCSS (CSS Modules).
Login próprio: `jose` + `bcrypt` + cookie HttpOnly + `src/proxy.ts`.

## Como rodar em desenvolvimento

```bash
docker compose up -d          # banco: container finance-family-online-db, porta 5435
npm install
npx prisma migrate deploy     # aplica as migrations
npm run dev                   # http://localhost:3000
```

O arquivo `.env` (não vai para o git) precisa de:

```
DATABASE_URL="postgresql://finance:finance_dev@localhost:5435/finance_family_online?schema=public"
AUTH_SECRET="<texto aleatório com 32+ caracteres>"
```

Este banco é independente do da versão offline (porta 5434), então as duas versões rodam ao mesmo tempo, com dados separados.

## Diferenças em relação à versão offline

- Sem IndexedDB, fila de pendências, sincronização, ☁️, avisos de "sem internet" e cache de dados.
- Salvar um lançamento chama a API direto. Sem internet, aparece a mensagem de erro com "Tentar de novo".
- Service Worker mínimo: só torna o app instalável. Não intercepta nem guarda nenhuma requisição.
- A API de lançamentos não tem o modo `updated_since`, que só a sincronização usava.
- Mantidos de propósito: o ID do lançamento gerado no aparelho (tocar duas vezes em "Salvar" não duplica) e a exclusão lógica.

## Documentação do projeto

Fica na pasta `docs/` da raiz (fora deste projeto): decisões, modelo de dados e `roadmap-online.md`.

## Pontos de atenção antes do deploy

- Trocar `AUTH_SECRET` por um segredo próprio do servidor; o cookie de sessão só é `Secure` em produção, então o deploy precisa de HTTPS.
- `npm audit` aponta avisos de severidade alta no CLI do Prisma 7.10.0 (`deepmerge-ts`, `mysql2`), que é ferramenta de desenvolvimento e não roda com o app. Reavaliar quando houver uma versão estável mais nova do Prisma.
