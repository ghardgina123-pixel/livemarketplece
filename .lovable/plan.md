# Plano de implementação — Live Market v2

Escopo grande. Vou dividir em **4 fases** entregáveis para você validar cada etapa antes de avançar.

---

## Fase 1 — Backend (Lovable Cloud) e Autenticação

- Ativar **Lovable Cloud** (banco PostgreSQL + Auth).
- Telas de **Login/Cadastro** passam a usar auth real (e-mail/senha + Google).
- Criar schema do banco com RLS:
  - `profiles` — dados do usuário (auto-criado no signup).
  - `user_roles` (enum `app_role`: `customer`, `seller`, `admin`) — tabela separada + função `has_role()` (segurança).
  - `stores` — loja do lojista (status: `pending` / `active` / `rejected`, dados bancários, NIF, logo).
  - `products` — produtos (status: `pending` / `approved` / `rejected`, preço em BRL base, estoque).
  - `lives` — sessões ao vivo (status, livekit_room, produtos vinculados).
  - `live_products` — N:N entre lives e produtos.
  - `orders` + `order_items` — pedidos do cliente.
  - `payouts` — fila de repasse com `release_at = paid_at + 10min`, status `pending`/`released`, valor líquido após comissão (definida em config, ex: 10%).
- Storage bucket para logos de loja e fotos de produto.

## Fase 2 — Transição Cliente → Lojista + Painel do Lojista

- Em `/perfil`: botão **"Quero Vender"**.
- Se sem loja → formulário de cadastro de loja → salva como `pending`.
- Se loja `pending` → tela "Aguardando aprovação".
- Se loja `active` → entra no **Painel do Lojista** (`/lojista`):
  - Aba **Meus Produtos** (CRUD, novos vão `pending`).
  - Aba **Pedidos** (recebidos da loja).
  - Aba **Repasses** (lista de payouts e quando serão liberados).
  - Botão **Iniciar Live** → seleciona produtos aprovados → cria sessão LiveKit.

## Fase 3 — Painel Admin (`/admin`)

- Rota separada protegida por `has_role(uid,'admin')`.
- Abas:
  - **Lojas pendentes** — aprovar/rejeitar (com justificativa).
  - **Produtos pendentes** — aprovar/rejeitar.
  - **Repasses** — visão geral.
  - **Usuários** — promover a admin/seller.
- Bootstrap: primeiro admin definido manualmente via SQL (vou avisar como promover você).

## Fase 4 — Lives (LiveKit) + Split automático de 10 min

- **LiveKit Cloud**: você cria conta grátis em livekit.io, me envia `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`. Vou pedir via tool de secrets.
- Server function gera token de host (lojista) e viewer (cliente).
- Tela de live integra o SDK `@livekit/components-react` com produtos fixados.
- Home `/lojas` lista lives ativas.
- **Split (simulado, sem mover dinheiro real)**:
  - Ao criar pedido (status `paid`): cria registro em `payouts` com `release_at = now() + interval '10 minutes'`, `commission_pct = 10%`, `net_amount = total - commission`.
  - **pg_cron** roda a cada 1 minuto: marca `payouts` com `release_at <= now()` como `released`.
  - Lojista vê o repasse "liberado" no painel. Quando plugar provedor real (Stripe Connect / Multicaixa API), substitui o cron por transferência real.

---

## Tecnicidades

- Stack mantida: TanStack Start + Lovable Cloud (Supabase).
- Server functions com `requireSupabaseAuth` para operações de seller/admin.
- Roles via `user_roles` + `has_role()` (nunca em `profiles`).
- Moeda continua tratada como hoje (`currency.ts`): preços armazenados em BRL e convertidos no display.
- LiveKit é o único custo externo recorrente (free tier cobre testes).

## O que vou pedir a você

1. Confirmar este plano.
2. Após Fase 1 ficar pronta: criar conta no LiveKit Cloud e me passar as 3 chaves quando eu solicitar (Fase 4).
3. Após Fase 1: definir manualmente seu usuário como admin (vou te mostrar como).

## Tamanho

Cada fase é uma resposta minha. Não dá para fazer tudo em uma única passada sem perder qualidade. Posso começar a **Fase 1** assim que você aprovar.