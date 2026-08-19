/* ==========================================================================
   Mandrill Hub — Camada de interatividade (cursor + magnético + spotlight)
   Self-contained: injeta seu próprio CSS. Para remover, é só tirar
   <script src="interactions.js"></script> do index.html.

   Guardas: só liga em ponteiro preciso (mouse) e respeita
   prefers-reduced-motion. Em touch/teclado, nada muda.
   ========================================================================== */
(function () {
  "use strict";

  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduced) return; // celular, tablet ou acessibilidade → sai

  var BRAND =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--brand")
      .trim() || "#715bfe";

  /* ---------- 1. CSS injetado ---------- */
  var css =
    /* esconde cursor nativo, menos em campos de texto */
    ".mh-cursor-on, .mh-cursor-on * { cursor: none !important; }" +
    ".mh-cursor-on input, .mh-cursor-on textarea, .mh-cursor-on select," +
    ".mh-cursor-on [contenteditable] { cursor: auto !important; }" +
    /* anel + ponto */
    ".mh-cur { position: fixed; top: 0; left: 0; z-index: 99999; pointer-events: none;" +
    "  border-radius: 50%; transform: translate(-50%, -50%); will-change: transform;" +
    "  opacity: 0; transition: opacity .25s ease; }" +
    ".mh-cur--ring { width: 34px; height: 34px; border: 1.5px solid " + hex(BRAND, 0.55) + ";" +
    "  transition: width .22s ease, height .22s ease, background .22s ease, border-color .22s ease, opacity .25s ease; }" +
    ".mh-cur--dot { width: 6px; height: 6px; background: " + BRAND + "; }" +
    /* estado hover em elementos interativos */
    ".mh-cur--ring.is-hover { width: 56px; height: 56px; background: " + hex(BRAND, 0.1) + ";" +
    "  border-color: " + hex(BRAND, 0.9) + "; }" +
    ".mh-cur--dot.is-hover { opacity: 0 !important; }" +
    /* clique */
    ".mh-cur--ring.is-down { width: 26px; height: 26px; background: " + hex(BRAND, 0.18) + "; }" +
    /* spotlight nos cards/painéis */
    ".mh-spot { position: relative; }" +
    ".mh-spot::before { content: ''; position: absolute; inset: 0; border-radius: inherit;" +
    "  pointer-events: none; opacity: 0; transition: opacity .3s ease; z-index: 0;" +
    "  background: radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%)," +
    "  " + hex(BRAND, 0.16) + ", transparent 60%); }" +
    ".mh-spot:hover::before { opacity: 1; }" +
    ".mh-spot > * { position: relative; z-index: 1; }" +
    /* botões magnéticos com transição suave ao soltar */
    ".mh-mag { transition: transform .35s cubic-bezier(.2,.8,.2,1); }";

  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- 2. Elementos do cursor ---------- */
  var ring = make("mh-cur mh-cur--ring");
  var dot = make("mh-cur mh-cur--dot");
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.documentElement.classList.add("mh-cursor-on");

  var mx = window.innerWidth / 2,
    my = window.innerHeight / 2;
  var rx = mx,
    ry = my; // posição suavizada do anel
  var visible = false;

  window.addEventListener(
    "mousemove",
    function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      if (!visible) {
        visible = true;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", function () {
    visible = false;
    ring.style.opacity = "0";
    dot.style.opacity = "0";
  });

  window.addEventListener("mousedown", function () {
    ring.classList.add("is-down");
  });
  window.addEventListener("mouseup", function () {
    ring.classList.remove("is-down");
  });

  /* loop de suavização do anel (lerp) */
  (function raf() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
    requestAnimationFrame(raf);
  })();

  /* ---------- 3. Hover em elementos interativos ---------- */
  var HOVER_SEL = "a, button, .btn, .card, .form-card, .faq-q, [data-cursor]";
  var FIELD_SEL = "input, textarea, select, [contenteditable]";

  document.addEventListener(
    "mouseover",
    function (e) {
      if (e.target.closest(FIELD_SEL)) {
        // sobre um campo: esconde cursor custom, deixa o caret nativo
        ring.style.opacity = "0";
        dot.style.opacity = "0";
        return;
      }
      if (e.target.closest(HOVER_SEL)) {
        ring.classList.add("is-hover");
        dot.classList.add("is-hover");
      }
    },
    true
  );

  document.addEventListener(
    "mouseout",
    function (e) {
      if (e.target.closest(FIELD_SEL) && visible) {
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
      if (e.target.closest(HOVER_SEL)) {
        ring.classList.remove("is-hover");
        dot.classList.remove("is-hover");
      }
    },
    true
  );

  /* ---------- 4. Spotlight nos cards/painéis ---------- */
  var spots = document.querySelectorAll(".card, .form-card");
  spots.forEach(function (el) {
    el.classList.add("mh-spot");
    el.addEventListener(
      "mousemove",
      function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      },
      { passive: true }
    );
  });

  /* ---------- 5. Botões magnéticos ---------- */
  var mags = document.querySelectorAll(".btn");
  var STRENGTH = 0.32; // quanto o botão "puxa" (0–1)
  mags.forEach(function (el) {
    el.classList.add("mh-mag");
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      el.style.transform =
        "translate(" + dx * STRENGTH + "px," + dy * STRENGTH + "px)";
    });
    el.addEventListener("mouseleave", function () {
      el.style.transform = "translate(0,0)";
    });
  });

  /* ---------- utils ---------- */
  function make(cls) {
    var d = document.createElement("div");
    d.className = cls;
    d.setAttribute("aria-hidden", "true");
    return d;
  }

  // aceita #rrggbb, #rgb ou rgb()/rgba() e devolve rgba(...) com alpha
  function hex(c, a) {
    c = c.trim();
    if (c[0] === "#") {
      if (c.length === 4) {
        c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      }
      var n = parseInt(c.slice(1), 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }
    // já é rgb()/rgba(): injeta/ajusta o alpha
    var m = c.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      var p = m[1].split(",").slice(0, 3).map(function (s) { return s.trim(); });
      return "rgba(" + p.join(",") + "," + a + ")";
    }
    return c;
  }
})();
