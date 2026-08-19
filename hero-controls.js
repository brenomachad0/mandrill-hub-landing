/* ==========================================================================
   Mandrill Hub — Painel de controle do fundo interativo
   Sliders ao vivo para os parâmetros de Noise Fill + Flow Field.
   (Ferramenta de ajuste — para remover do site, apague a linha
    <script src="hero-controls.js"></script> no index.html.)
   ========================================================================== */
(function () {
  "use strict";

  function init() {
    var FX = window.HeroFX;
    if (!FX || !FX.params) return; // shader não ativo (ex.: modo Unicorn) → não mostra painel

    var P = FX.params;

    // Definição dos controles: [grupo, chave, min, max, step, rótulo]
    var GROUPS = [
      ["Noise Fill (Perlin)", "noise", [
        ["scale", 0, 200, 1, "Scale"],
        ["smooth", 0, 100, 1, "Smooth"],
        ["amplitude", 0, 100, 1, "Amplitude"],
        ["phase", 0, 360, 1, "Phase"],
        ["threshold", 0, 100, 1, "Threshold"],
        ["speed", 0, 3, 0.1, "Speed"],
        ["bulgeAmount", 0, 100, 1, "Bulge Amount"],
        ["bulgeScale", 0, 100, 1, "Bulge Scale"],
        ["momentum", 0, 100, 1, "Momentum"],
      ]],
      ["Flow Field", "flow", [
        ["angle", 0, 360, 1, "Angle"],
        ["scale", 0, 100, 1, "Scale"],
        ["amount", 0, 100, 1, "Amount"],
        ["phase", 0, 360, 1, "Phase"],
        ["speed", 0, 3, 0.1, "Speed"],
      ]],
      ["Máscara", "mask", [
        ["amount", 0, 100, 1, "Amount"],
        ["radius", 0, 100, 1, "Radius"],
        ["feather", 0, 100, 1, "Feather"],
      ]],
    ];

    /* ---- estilos ---- */
    var css = document.createElement("style");
    css.textContent = [
      "#fxToggle{position:fixed;right:18px;bottom:18px;z-index:9999;width:46px;height:46px;border-radius:50%;",
      "border:1px solid #2f2b57;background:#171528;color:#a99cff;font-size:20px;cursor:pointer;display:flex;",
      "align-items:center;justify-content:center;box-shadow:0 10px 30px -10px rgba(0,0,0,.7);transition:transform .2s,background .2s;}",
      "#fxToggle:hover{background:#1e1b38;transform:translateY(-2px);}",
      "#fxPanel{position:fixed;right:18px;bottom:74px;z-index:9999;width:290px;max-height:78vh;overflow-y:auto;",
      "background:rgba(18,17,30,.96);backdrop-filter:blur(12px);border:1px solid #2f2b57;border-radius:14px;",
      "padding:16px;color:#e2e3e9;font-family:Inter,system-ui,sans-serif;box-shadow:0 24px 60px -24px rgba(0,0,0,.85);",
      "display:none;}",
      "#fxPanel.open{display:block;}",
      "#fxPanel h4{margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8876fe;font-weight:600;}",
      "#fxPanel .grp{margin-bottom:16px;}",
      "#fxPanel .row{margin:9px 0;}",
      "#fxPanel .row .lab{display:flex;justify-content:space-between;font-size:12px;color:#c9cbd6;margin-bottom:4px;}",
      "#fxPanel .row .lab b{color:#fff;font-weight:600;}",
      "#fxPanel input[type=range]{width:100%;height:4px;-webkit-appearance:none;appearance:none;background:#2b2846;",
      "border-radius:99px;outline:none;margin:0;}",
      "#fxPanel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;",
      "background:#715bfe;cursor:pointer;border:2px solid #cfc7ff;}",
      "#fxPanel input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:#715bfe;",
      "cursor:pointer;border:2px solid #cfc7ff;}",
      "#fxPanel .btns{display:flex;gap:8px;margin-top:6px;}",
      "#fxPanel .btns button{flex:1;padding:9px;border-radius:9px;border:1px solid #2f2b57;background:#211d3d;",
      "color:#e2e3e9;font-size:12.5px;font-weight:600;cursor:pointer;transition:background .2s;font-family:inherit;}",
      "#fxPanel .btns button:hover{background:#2a2550;}",
      "#fxPanel .hint{font-size:11px;color:#8a8ca0;margin:10px 0 0;line-height:1.4;}",
      "@media (max-width:520px){#fxPanel{width:calc(100vw - 36px);}}",
    ].join("");
    document.head.appendChild(css);

    /* ---- botão flutuante ---- */
    var toggle = document.createElement("button");
    toggle.id = "fxToggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Ajustar fundo");
    toggle.textContent = "⚙"; // ⚙
    document.body.appendChild(toggle);

    /* ---- painel ---- */
    var panel = document.createElement("div");
    panel.id = "fxPanel";
    document.body.appendChild(panel);

    var refs = []; // {group,key,input,valEl,step}

    GROUPS.forEach(function (g) {
      var title = g[0], group = g[1], items = g[2];
      var wrap = document.createElement("div");
      wrap.className = "grp";
      var h = document.createElement("h4");
      h.textContent = title;
      wrap.appendChild(h);

      items.forEach(function (it) {
        var key = it[0], min = it[1], max = it[2], step = it[3], label = it[4];
        var row = document.createElement("div");
        row.className = "row";
        var lab = document.createElement("div");
        lab.className = "lab";
        var name = document.createElement("span");
        name.textContent = label;
        var val = document.createElement("b");
        val.textContent = P[group][key];
        lab.appendChild(name);
        lab.appendChild(val);

        var input = document.createElement("input");
        input.type = "range";
        input.min = min; input.max = max; input.step = step;
        input.value = P[group][key];

        input.addEventListener("input", function () {
          var v = parseFloat(input.value);
          P[group][key] = v;
          val.textContent = step < 1 ? v.toFixed(1) : v;
          FX.apply(P);
        });

        row.appendChild(lab);
        row.appendChild(input);
        wrap.appendChild(row);
        refs.push({ group: group, key: key, input: input, val: val, step: step });
      });
      panel.appendChild(wrap);
    });

    /* ---- botões ---- */
    var btns = document.createElement("div");
    btns.className = "btns";
    var bReset = document.createElement("button");
    bReset.textContent = "Resetar";
    var bCopy = document.createElement("button");
    bCopy.textContent = "Copiar valores";
    btns.appendChild(bReset);
    btns.appendChild(bCopy);
    panel.appendChild(btns);

    var hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "Ajuste ao vivo. Use “Copiar valores” e cole no PARAMS do hero-bg.js pra deixar fixo.";
    panel.appendChild(hint);

    /* ---- ações ---- */
    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
    });

    bReset.addEventListener("click", function () {
      var d = FX.defaults;
      refs.forEach(function (r) {
        var dv = d[r.group][r.key];
        P[r.group][r.key] = dv;
        r.input.value = dv;
        r.val.textContent = r.step < 1 ? Number(dv).toFixed(1) : dv;
      });
      FX.apply(P);
    });

    bCopy.addEventListener("click", function () {
      var txt = JSON.stringify({ noise: P.noise, flow: P.flow, mask: P.mask }, null, 2);
      var done = function () {
        var t = bCopy.textContent;
        bCopy.textContent = "Copiado ✓";
        setTimeout(function () { bCopy.textContent = t; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, function () { window.prompt("Copie os valores:", txt); });
      } else {
        window.prompt("Copie os valores:", txt);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
