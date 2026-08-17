# Mandrill Hub — Landing Page

Landing page para vender o **Mandrill Hub** e captar produtoras interessadas (lista de leads → Google Sheets).

Feita com a identidade da marca Mandrill (paleta verde/areia/laranja, tipografia Fraunces + Inter). Arquivo único, sem dependências de build — abre em qualquer navegador e hospeda em qualquer lugar.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | A página inteira (HTML + CSS + JS, tudo embutido). |
| `google-apps-script.gs` | Código pra ligar o formulário a uma planilha do Google. |
| `README.md` | Este guia. |

---

## 1. Ver a página agora

É só dar dois cliques no `index.html` — abre no navegador. Nesse modo, sem configuração, o formulário abre o app de e-mail já preenchido para `suporte@mandrill.com.br` (funciona, mas não monta a lista sozinha).

Para a **lista automática no Google Sheets**, siga o passo 2.

---

## 2. Ligar o formulário ao Google Sheets (recomendado)

1. Crie uma planilha nova em [sheets.new](https://sheets.new). Dê o nome que quiser (ex.: *Leads Mandrill Hub*).
2. No menu, vá em **Extensões → Apps Script**.
3. Apague o conteúdo padrão e **cole todo o código** de `google-apps-script.gs`. Salve (ícone do disquete).
4. Clique em **Implantar → Nova implantação**.
   - Tipo: **App da Web** (Web app).
   - Executar como: **Eu**.
   - Quem tem acesso: **Qualquer pessoa** (*Anyone*). ⚠️ Precisa ser "qualquer pessoa" pra página conseguir enviar.
   - Clique **Implantar** e autorize o acesso quando pedir.
5. Copie a **URL do app da Web** (termina em `/exec`).
6. Abra o `index.html`, ache a linha:
   ```js
   const LEAD_ENDPOINT = "";
   ```
   e cole a URL entre as aspas:
   ```js
   const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
   ```
7. Salve. Pronto — cada envio vira uma linha na aba **Leads** da sua planilha.

> Quer receber um e-mail a cada lead? No `google-apps-script.gs`, descomente o bloco `MailApp.sendEmail(...)` e ajuste o endereço.

---

## 3. Publicar na internet

Qualquer uma destas serve (todas grátis pra um arquivo estático):

- **Vercel** ou **Netlify**: arraste a pasta em vercel.com/new ou app.netlify.com/drop.
- **GitHub Pages**: suba o `index.html` num repositório e ative o Pages.
- **Hostinger / seu domínio**: suba o `index.html` via FTP (ex.: para `hub.mandrill.com.br`).

Depois de publicar, teste o formulário e confirme que o lead caiu na planilha.

---

## 4. O que dá pra ajustar fácil

- **Textos**: tudo em português, direto no `index.html`.
- **Cores**: no bloco `:root` do `<style>` (variáveis `--verde-1`, `--laranja-1`, etc. — as cores oficiais do brandbook Mandrill).
- **Campos do formulário**: seção `<form id="leadForm">`. Se adicionar campo, lembre de incluir a coluna no `google-apps-script.gs`.
- **E-mail de contato**: constante `EMAIL_FALLBACK` no `<script>` e no rodapé.
- **Tipografia**: hoje usa **Fraunces** (substituto livre da *Recoleta*, que é paga) + **Inter** (fonte oficial de corpo da marca). Se você tiver a licença da Recoleta, dá pra trocar.

---

## Notas de marca (do brandbook)

- Fundo sempre verde-escuro (`#171E19`) ou areia (`#F9EAD9`); **laranja só como destaque/CTA**, nunca como fundo principal.
- Tom de voz: brasileiro, inventivo, direto e sem "papo de disrupção". A copy evita promessa mágica e não ataca ferramenta concorrente — explica o recorte.
- Nomes internos (certificação/selo) ainda são placeholder e **não** aparecem inventados na página.
