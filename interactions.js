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
    ".mh-cur--dot { width: 16px; height: 16px; background: #ffffff;" +
    "  box-shadow: 0 0 14px " + hex("#ffffff", 0.4) + "; }" +
    /* estado hover em elementos interativos */
    ".mh-cur--ring.is-hover { width: 62px; height: 62px; background: " + hex(BRAND, 0.1) + ";" +
    "  border-color: " + hex(BRAND, 0.9) + "; }" +
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
    /* botões: brilho no hover (sem sair do lugar) */
    ".btn { transition: background .25s ease, border-color .25s ease, color .25s ease," +
    "  filter .25s ease, box-shadow .3s ease; }" +
    ".btn--primary:hover { box-shadow: 0 10px 34px " + hex(BRAND, 0.5) +
    ", 0 0 0 1px " + hex(BRAND, 0.45) + "; filter: brightness(1.05); }" +
    ".btn--secondary:hover { box-shadow: 0 10px 30px " + hex("#ffffff", 0.14) +
    ", 0 0 0 1px " + hex("#ffffff", 0.4) + "; }" +
    /* sublinhado animado nos links do menu */
    ".nav a { position: relative; }" +
    ".nav a::after { content: ''; position: absolute; left: 0; bottom: -6px; height: 2px;" +
    "  width: 100%; background: " + BRAND + "; border-radius: 2px; transform: scaleX(0);" +
    "  transform-origin: left center; transition: transform .32s cubic-bezier(.2,.8,.2,1); }" +
    ".nav a:hover::after { transform: scaleX(1); }" +
    /* tilt 3D nos cards */
    ".mh-tilt { transition: transform .3s cubic-bezier(.2,.8,.2,1); }";

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
  var pdx = mx,
    pdy = my; // posição anterior do ponto (p/ calcular velocidade)
  var visible = false;

  window.addEventListener(
    "mousemove",
    function (e) {
      mx = e.clientX;
      my = e.clientY;
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

  /* loop: anel suave + deformação do ponto pela velocidade */
  (function raf() {
    // anel segue com atraso (lerp)
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform =
      "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";

    // ponto central: posição + deformação líquida no sentido do movimento
    var vx = mx - pdx,
      vy = my - pdy;
    pdx = mx;
    pdy = my;
    var speed = Math.min(Math.hypot(vx, vy), 55);
    var t = speed / 55; // 0 (parado) → 1 (rápido)
    var ang = (Math.atan2(vy, vx) * 180) / Math.PI;
    var sx = 1 + t * 0.7; // estica no sentido do movimento
    var sy = 1 - t * 0.4; // achata no eixo perpendicular
    dot.style.transform =
      "translate(" + mx + "px," + my + "px) translate(-50%,-50%)" +
      " rotate(" + ang + "deg) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";

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
    var tiltable = el.classList.contains("card"); // form não inclina (usabilidade)
    if (tiltable) el.classList.add("mh-tilt");
    el.addEventListener(
      "mousemove",
      function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width; // 0..1
        var py = (e.clientY - r.top) / r.height; // 0..1
        el.style.setProperty("--mx", px * 100 + "%");
        el.style.setProperty("--my", py * 100 + "%");
        if (tiltable) {
          var rotY = (px - 0.5) * 10; // graus
          var rotX = (0.5 - py) * 10;
          el.style.transform =
            "perspective(820px) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" +
            rotY.toFixed(2) + "deg) translateZ(6px)";
        }
      },
      { passive: true }
    );
    if (tiltable) {
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    }
  });

  /* ---------- 5. Botões: brilho no hover ----------
     O efeito visual é 100% CSS (.btn--*:hover, injetado acima).
     Sem transform aqui de propósito: o botão brilha sem sair do lugar. */

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
