# Módulo de Imóveis (Imobiliárias)

Adiciona ao app um novo tipo de "vendedor": **imobiliárias**, com fluxo paralelo ao das lojas — cadastro, aprovação pelo admin, publicação de imóveis, lives com taxa por sessão e contato pelos clientes.

## 1. Base de dados (nova migração)

Tabelas novas no schema `public` (todas com RLS + GRANTs):

- **`real_estate_agencies`** — perfil da imobiliária
  - `owner_id` (uuid → auth.users), `name`, `nif` (obrigatório), `phone`, `email`, `description`, `logo_url`, `cover_url`
  - `province_id`, `municipality_id`, `district`, `street`, `lat`, `lng`
  - `status` (enum `agency_status`: pending / active / rejected / suspended), `rejection_reason`
  - Política: só empresas registadas (NIF obrigatório); admin aprova manualmente.

- **`properties`** — imóveis publicados
  - `agency_id`, `title`, `description`, `property_type` (enum: casa, apartamento, terreno, comercial, escritório)
  - `listing_type` (enum: venda, arrendamento)
  - `price_aoa`, `rent_period` (mensal / diário — só para arrendamento)
  - `bedrooms`, `bathrooms`, `area_m2`, `parking_spots`, `furnished` (bool)
  - `province_id`, `municipality_id`, `district`, `street`, `lat`, `lng`
  - `status` (enum `property_status`: pending / approved / rejected / sold / rented), `featured` (bool)
  - Tabela auxiliar `property_images` (várias fotos por imóvel)

- **`property_visit_requests`** — pedidos de visita
  - `property_id`, `customer_id`, `preferred_date`, `preferred_time`, `message`, `contact_phone`
  - `status` (pendente / confirmada / recusada / realizada)

- **`agency_live_fees`** — controle da taxa por live de imóvel
  - `agency_id`, `live_id` (nullable até a live ser criada), `amount_aoa` (default 5000)
  - `status` (pending / paid / approved / rejected), `proof_url`, `payment_method`, `rejection_reason`
  - Fluxo igual à subscrição da loja: dono carrega comprovativo → admin aprova → live habilitada

- **Configuração**: usar `payment_methods` existente; valor padrão da taxa fica em constante no código (5.000 Kz), editável depois.

Lives reutilizam a tabela `lives` existente, com gatilho: ao criar live para uma agência, exigir um `agency_live_fees` com status `approved` e ainda não consumido.

## 2. Rotas novas

- **`/imoveis`** (público) — listagem geral com filtros (tipo, venda/arrendamento, província, faixa de preço, quartos)
- **`/imoveis/$id`** (público) — detalhe do imóvel: galeria, mapa OpenStreetMap, dados, botões "Marcar visita" (formulário) e "WhatsApp" (deep link), ver lives ativas da imobiliária
- **`/imobiliaria/$id`** (público) — página da imobiliária: imóveis, lives, contatos
- **`/_authenticated/imobiliaria/cadastro`** — formulário de cadastro da imobiliária (com validação Zod, captura de geolocalização, mapa preview)
- **`/_authenticated/imobiliaria/painel`** — painel do dono: meus imóveis, criar/editar imóvel, pedidos de visita recebidos, lives, pagar taxa de live (upload de comprovativo)
- **`/_authenticated/imobiliaria/imovel/novo`** e **`/_authenticated/imobiliaria/imovel/$id/editar`**
- **`/_authenticated/admin/imobiliarias`** — admin aprova/rejeita imobiliárias, imóveis e taxas de live

## 3. Integração com o app existente

- **Home**: novo card "Imóveis" na grade de categorias, navegando para `/imoveis`
- **Perfil**: novo bloco "Tenho imóveis para vender/arrendar" → `/imobiliaria/cadastro`
- **Live**: tela de live verifica se é live de imobiliária; se sim, mostra badge "Imóvel" e botão para o imóvel/agência
- **Chat existente** (`conversations`/`messages`): reutilizado para conversa cliente ↔ imobiliária a partir do botão "Contatar" no imóvel

## 4. Detalhes técnicos

- Server functions com `requireSupabaseAuth` para criar imóveis, marcar visita e iniciar live; admin usa funções `security definer` (`admin_approve_agency`, `admin_approve_property`, `admin_approve_agency_live_fee`)
- Validação Zod em todos os formulários (NIF, telefone +244, preços > 0, datas futuras para visita)
- Upload de imagens via bucket existente reaproveitado (`store-assets` para logo/cover, novo bucket `property-images` para fotos dos imóveis); comprovativos no bucket `subscription-proofs`
- Mapas: OpenStreetMap embed (mesmo padrão usado em `/transportador`)
- Pagamento de live: por enquanto manual (comprovativo + aprovação admin), valor fixo de 5.000 Kz; estrutura já permite trocar para integração marketplace depois

## 5. Fora de escopo (fica para depois)

- Pagamento automático/online (Multicaixa Express, Stripe) — agora só comprovativo manual
- Repasse automático para a imobiliária via marketplace
- Agenda integrada com calendário externo
- Avaliações/reviews de imóveis

Posso seguir e implementar?
