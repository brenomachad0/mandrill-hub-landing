# Mandrill Hub — Landing Page

Site estático (sem build) da landing do **Mandrill Hub**, com captura de leads em modal → Google Sheets.

## Rodar local
Dois cliques no `index.html` (ou `python3 -m http.server` na pasta). Sem dependências, sem build.

## Estrutura
| Arquivo | O que é |
|---|---|
| `index.html` | Página + modal de "Teste grátis". |
| `styles.css` | Estilos (design do designer + modal). |
| `script.js` | Navegação, modal, **envio do lead** e máscara/validação do form. |
| `hero-bg.js` | Efeito de fundo do hero (canvas). |
| `hero-controls.js` | Painel de calibração do efeito do hero (dev). |
| `interactions.js` | Cursor customizado, hover e brilho dos botões. |
| `assets/`, `img/` | Logos e screenshots. |
| `google-apps-script.gs` | Backend da planilha (Google Apps Script). |

## Captura de leads (já funcionando)
O formulário (dentro do modal, `#testeForm`) envia via `fetch` para um **Web App do Google Apps Script**, que grava na aba **Leads** de uma planilha Google.

- Endpoint configurado em `script.js` → constante **`LEAD_ENDPOINT`**.
- Código do backend em `google-apps-script.gs` (colado no Apps Script da planilha, publicado como Web App com acesso "Qualquer pessoa").
- O campo do form `equipe` é mapeado para a coluna `tamanho` da planilha.
- Sem backend próprio: é `POST` `no-cors` direto pro Apps Script.

Para trocar a planilha/endpoint: publique um novo Web App e atualize `LEAD_ENDPOINT` em `script.js`.

## Deploy no domínio
É estático — serve em qualquer host (Nginx/Apache/S3/CDN/Vercel/Netlify). Suba a pasta inteira mantendo os caminhos relativos (`assets/`, `img/`, `.css`, `.js`).

- Remova a meta `robots noindex` do `<head>` do `index.html` quando for pra produção indexável.
- HTTPS recomendado (o envio do form vai pro Google via HTTPS).
- Fontes vêm do Google Fonts (Inter + Poppins) via `<link>` no `<head>`.

## Notas
- Efeitos interativos desligam sozinhos em touch e com `prefers-reduced-motion`.
- Fonte de conteúdo/identidade: brand Mandrill. Naming interno (selo/certificação) é placeholder e não aparece inventado na página.
