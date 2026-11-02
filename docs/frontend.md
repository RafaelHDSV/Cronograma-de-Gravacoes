# Frontend

> **Para que serve:** mapa do painel e regra de não-indexação.
> **Fonte da verdade:** `src/App.tsx`, `index.html`, `public/robots.txt`.

## SEO e indexação

Ferramenta interna (exibe nomes da equipe). `index.html` declara `noindex, nofollow`. `public/robots.txt` é `Disallow: /` (sem sitemap).

`InstitucionalGate` aplica `<Seo noindex />` no app e reafirma depois das páginas legais.
