Configuração de domínio (DNS, SSL, redirects entre apex/www e entre domínios alternativos) é feita por você no painel Lovable — não em código. Veja o passo a passo acima da mensagem.

Do lado do código, preparo a app para que, assim que `livemarket.app` estiver ativo, todos os sinais de SEO, compartilhamento social e canonicalização apontem para ele.

## Mudanças no código

1. **Domínio canônico centralizado**
   - Adicionar `src/lib/site.ts` exportando `SITE_URL = "https://livemarket.app"` e `SITE_NAME = "Live Market"`.
   - Usar essa constante em qualquer lugar que precise de URL absoluto (og:url, canonical, JSON-LD).

2. **`src/routes/__root.tsx` — defaults globais**
   - Adicionar `og:site_name = "Live Market"` (se ainda não estiver).
   - Adicionar JSON-LD `Organization` com `name`, `url: SITE_URL`, `logo`.
   - **Não** colocar `<link rel="canonical">` no root (regra TanStack: canonical só em rotas-folha, senão duplica).

3. **Canonical + og:url por rota**
   - Em cada rota-folha (`/`, `/home`, `/lojas`, `/chat`, `/carrinho`, `/checkout`, `/perfil`, `/login`, `/cadastro`, `/loja/$id`, `/produto/$id`), adicionar no `head()`:
     - `meta: { property: "og:url", content: "${SITE_URL}<path>" }`
     - `links: [{ rel: "canonical", href: "${SITE_URL}<path>" }]`

4. **`public/robots.txt`** (criar)
   ```
   User-agent: *
   Allow: /

   Sitemap: https://livemarket.app/sitemap.xml
   ```

5. **`src/routes/sitemap[.]xml.tsx`** (criar server route)
   - Gera XML com as rotas estáticas públicas usando `SITE_URL`.
   - Retorna `Content-Type: application/xml`.

6. **Limpeza de placeholders/host antigo**
   - Remover qualquer referência residual a `live-market-shop.lovable.app` em comentários/meta (se houver — busca já feita não encontrou em código, mas vou validar novamente antes de aplicar).

## O que NÃO faço em código

- Redirects 301 entre `livemarketplace.com → livemarket.app`: configurado no painel ao definir Primary domain.
- HTTPS / certificados: Lovable provisiona automaticamente.
- DNS: feito no registrar (ou comprado direto pela Lovable, que já configura).
- Redirect apex ↔ www: configurado pela escolha de Primary no painel.

## Resultado

Quando você apontar `livemarket.app` no painel, a app já estará servindo todos os metadados, sitemap e robots com o domínio correto, sem precisar de novo deploy de código.
