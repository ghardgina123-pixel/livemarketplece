## Visão geral

Reorganizar o fluxo de conta, perfil e configurações do Live Market, separando claramente **Cliente** e **Lojista**, abrindo um menu de Configurações funcional, adicionando módulo **CRM Premium** para lojistas e cadastrando os métodos de pagamento de Angola (Express, e-Kwanza, Unitel Money, Afrimoney, Kwik e Referência Multicaixa).

---

## 1. Cadastro com escolha de tipo de conta

Na tela `/cadastro` (e no primeiro acesso após baixar o app), o usuário escolhe:

- **Sou Cliente** → fluxo atual (nome, email, telefone, senha)
- **Sou Lojista** → fluxo estendido com dados de empresa

Campos extras do lojista (obrigatórios para criar a loja):
- Nome da empresa / marca
- NIF
- Categoria do negócio
- Telefone comercial e email comercial
- Província + Município + Endereço completo
- **Localização no mapa** (pin com lat/lng — captura via "usar minha localização" + ajuste manual)
- Logo e capa (opcional no cadastro, obrigatório antes de publicar)
- Dados bancários (banco, IBAN, titular)

Ao concluir, o lojista é criado como `customer` + `seller` (papéis em `user_roles`) e uma `stores` em status `pending` é gerada automaticamente.

---

## 2. Botão de Configurações funcional no Perfil

Hoje o ícone de engrenagem no topo de `/perfil` não abre nada. Vamos:

- Transformar em um **Sheet/Drawer lateral** (`Configurações`) que abre ao clicar.
- O conteúdo do menu se adapta ao papel do usuário.

### Seções do menu (organizadas)

**Minha conta**
- Editar perfil (nome, foto, telefone)
- Endereços
- Segurança e privacidade
- Idioma, região e moeda

**Como cliente**
- Minhas compras (pedidos)
- Favoritos
- Métodos de pagamento salvos
- Afiliados (programa de indicação — link, ganhos, saques)

**Como lojista** (só aparece se tiver loja ou clicar em "Quero vender")
- Minha loja (editar dados, status)
- Meus produtos (listar, cadastrar novo, editar, estoque)
- Pedidos recebidos
- Financeiro / Saques (payouts)
- **CRM Premium** (badge "PRO")
- Afiliados da loja

**Suporte**
- Ajuda e suporte
- Termos e privacidade
- Sair

---

## 3. CRM Premium para lojistas (pago)

Novo módulo opcional para lojas:
- Página `/lojista/crm` protegida por assinatura ativa.
- Funcionalidades planejadas: lista de clientes da loja, histórico de compras por cliente, segmentação, campanhas (mensagens em massa via chat), notas internas.
- Tela de **paywall** quando a loja não tem o plano: mostra benefícios, preço mensal em AOA e botão "Assinar CRM".
- Tabela `store_subscriptions` (store_id, plan, status, started_at, expires_at) para controle.
- Cobrança feita pelos métodos locais já cadastrados (ver seção 4). Sem provedor internacional nesta fase.

---

## 4. Métodos de pagamento de Angola

Inserir em `payment_methods` (já existente, com filtro por `country_code='AO'` e `is_active=true`) as opções:

| method_type | display_name | requires_proof | observação |
|---|---|---|---|
| `express` | Pagamento Express | sim | referência + comprovante |
| `ekwanza` | e-Kwanza | sim | número de telefone |
| `unitel_money` | Unitel Money | sim | número Unitel |
| `afrimoney` | Afrimoney | sim | número Africell |
| `kwik` | Kwik | sim | conta Kwik |
| `multicaixa_ref` | Pagamento por Referência (Multicaixa) | sim | entidade + referência |

Todos como **manual / comprovante** nesta fase (o checkout já tem o filtro pronto — basta popular a tabela e ajustar ícones/labels).

---

## 5. Telas e rotas afetadas

```text
src/routes/cadastro.tsx           → adicionar seletor Cliente/Lojista + form estendido
src/routes/index.tsx (splash)     → CTA duplo "Sou Cliente" / "Quero vender"
src/routes/perfil.tsx             → engrenagem abre <SettingsSheet/>
src/components/SettingsSheet.tsx  → novo, menu organizado por papel
src/routes/_authenticated/
  lojista.tsx                     → dashboard lojista (já existe, reorganizar)
  lojista.produtos.tsx            → meus produtos (novo)
  lojista.pedidos.tsx             → pedidos recebidos (novo)
  lojista.crm.tsx                 → CRM Premium + paywall (novo)
  compras.tsx                     → minhas compras (novo)
  afiliados.tsx                   → programa de afiliados (novo, placeholder)
```

Mapa: usar Leaflet + OpenStreetMap (já é leve e não precisa de chave). Componente `LocationPicker` reutilizável no cadastro de lojista e em endereços.

---

## 6. Banco de dados (migrações)

- `payment_methods`: inserir as 6 linhas para Angola (data, não schema).
- `store_subscriptions` (nova tabela): id, store_id, plan ('crm'), status, started_at, expires_at, RLS (dono da loja lê; admin gerencia).
- `stores`: já tem lat/lng, nif, dados bancários — sem mudança de schema.
- `user_roles`: já tem enum com `customer`, `seller`, `admin` — sem mudança.

---

## Fora do escopo deste plano

- Implementação real do CRM (telas internas) — entregamos paywall + estrutura; as features do CRM viram um próximo plano.
- Integração automática com APIs dos provedores angolanos (Express/Unitel/etc.) — fica como comprovante manual.
- Programa de afiliados completo — entra como placeholder navegável.

Confirma se posso seguir com este escopo (especialmente: CRM como paywall + estrutura, e métodos de pagamento como comprovante manual)?