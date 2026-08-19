/* ==========================================================================
   Mandrill Hub — Fundo interativo do hero (WebGL, sem watermark)
   Efeito recriado com os mesmos controles do Unicorn Studio:
   Noise Fill (Perlin) + Flow Field, nas cores da marca (#715bfe / #8876fe).

   >> Ajuste os valores em PARAMS abaixo — são os mesmos dos painéis do
      Unicorn Studio (0–100), então dá pra calibrar do mesmo jeito.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------
     PARÂMETROS — iguais aos painéis do Unicorn Studio
     ---------------------------------------------------------------- */
  var PARAMS = {
    // ---- Noise Fill (Perlin) ----
    noise: {
      scale: 0,         // tamanho do noise (menor = blobs maiores) — range 0–200
      smooth: 93,       // suavidade: maior = menos detalhe = mais liso
      amplitude: 100,   // contraste do noise
      phase: 333,       // deslocamento do padrão
      threshold: 35,    // corte: maior = mais escuro
      speed: 0.2,       // velocidade da animação
      bulgeAmount: 73,  // força da "lente" que segue o mouse
      bulgeScale: 11,   // raio da lente do mouse
      momentum: 100,    // inércia do mouse (maior = mais suave/lento)
    },
    // ---- Flow Field ----
    flow: {
      angle: 211,       // direção do fluxo (graus)
      scale: 11,        // escala do campo de fluxo
      amount: 94,       // intensidade da distorção
      phase: 75,        // deslocamento do fluxo
      mixRadius: 75,    // (informativo)
      speed: 0.1,       // velocidade da animação do fluxo
    },
    // ---- Máscara (radial) ----
    mask: {
      amount: 100,      // força da máscara (0 = desligada, esconde as bordas)
      radius: 0,        // tamanho da área visível
      feather: 89,      // suavidade da borda da máscara
    },
  };

  // Vazio = usa o shader próprio (sem watermark). Preencher com o Project ID
  // reativa a cena do Unicorn Studio (que, no plano free, mostra a marca d'água).
  var UNICORN_PROJECT_ID = "";

  // Converte os valores dos painéis (0–100) nos uniforms do shader
  function mapParams(P) {
    var N = P.noise, F = P.flow, M = P.mask || { amount: 0, radius: 70, feather: 55 };
    var sm = (N.smooth == null ? 0 : N.smooth);
    return {
      u_nFreq: 0.30 + N.scale * 0.020,                 // range de escala ampliado (0–200)
      u_nPhase: (N.phase / 100) * 6.283,
      u_nContrast: 0.6 + N.amplitude / 100,
      u_nSpeed: N.speed,
      u_detail: 1.0 + (1.0 - sm / 100) * 4.0,          // Smooth ↑ => menos octaves => mais liso
      u_bias: (0.5 - N.threshold / 100) * 0.9,         // Threshold ↑ => mais escuro
      u_fAngle: (F.angle * Math.PI) / 180,
      u_fFreq: 0.6 + F.scale * 0.055,
      u_fAmount: (F.amount / 100) * 0.35,
      u_fPhase: (F.phase / 100) * 6.283,
      u_fSpeed: F.speed,
      u_bulgeAmt: (N.bulgeAmount / 100) * 0.53,
      u_bulgeScale: 3.0 + (100 - N.bulgeScale) * 0.06,
      u_maskAmt: M.amount / 100,                        // máscara radial
      u_maskRadius: 0.25 + (M.radius / 100) * 1.05,
      u_maskFeather: 0.05 + (M.feather / 100) * 0.60,
    };
  }
  // inércia do mouse a partir de "momentum"
  var MOUSE_LERP = 0.14 - (PARAMS.noise.momentum / 100) * 0.11;

  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("heroCanvas");
  if (!hero || !canvas) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------
     Caminho A — Cena real do Unicorn Studio (quando houver ID)
     ------------------------------------------------------------- */
  if (UNICORN_PROJECT_ID) {
    var host = document.getElementById("unicornFx");
    host.setAttribute("data-us-project", UNICORN_PROJECT_ID);
    host.setAttribute("data-us-dpi", "1.5");
    host.setAttribute("data-us-scale", "1");
    canvas.style.display = "none";
    (function () {
      if (window.UnicornStudio) { hero.classList.add("fx-active"); return; }
      window.UnicornStudio = { isInitialized: false };
      var s = document.createElement("script");
      s.src = "assets/unicorn/unicornStudio.umd.js";
      s.onerror = function () {
        var cdn = document.createElement("script");
        cdn.src = "https://cdn.unicorn.studio/v1.4.2/unicornStudio.umd.js";
        cdn.onload = s.onload;
        (document.head || document.body).appendChild(cdn);
      };
      s.onload = function () {
        if (!window.UnicornStudio.isInitialized) {
          window.UnicornStudio.init();
          window.UnicornStudio.isInitialized = true;
        }
        hero.classList.add("fx-active");
      };
      (document.head || document.body).appendChild(s);
    })();
    return;
  }

  /* -------------------------------------------------------------
     Caminho B — Shader WebGL (padrão, sem watermark)
     ------------------------------------------------------------- */
  var gl = canvas.getContext("webgl", {
    alpha: false, antialias: true, preserveDrawingBuffer: true,
  }) || canvas.getContext("experimental-webgl", { alpha: false });
  if (!gl) return; // sem WebGL: mantém o glow em CSS

  var VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_mouseOn;",
    "uniform float u_nFreq,u_nPhase,u_nContrast,u_nSpeed,u_detail,u_bias;",
    "uniform float u_fAngle,u_fFreq,u_fAmount,u_fPhase,u_fSpeed;",
    "uniform float u_bulgeAmt,u_bulgeScale,u_maskAmt,u_maskRadius,u_maskFeather;",
    // Simplex noise 2D (Ashima / Gustavson)
    "vec3 md3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec2 md2(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}",
    "vec3 pm(vec3 x){return md3(((x*34.0)+1.0)*x);}",
    "float sn(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);",
    "  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);",
    "  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=md2(i);",
    "  vec3 p=pm(pm(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));",
    "  vec3 mm=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);mm=mm*mm;mm=mm*mm;",
    "  vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;",
    "  mm*=1.79284291400159-0.85373472095314*(a0*a0+h*h);",
    "  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(mm,g);}",
    // fbm com nº de octaves controlável (u_detail) — Smooth reduz o detalhe
    "float fbm(vec2 p){float v=0.0,a=0.5,s=0.0;for(int i=0;i<5;i++){float w=a*clamp(u_detail-float(i),0.0,1.0);v+=w*sn(p);s+=w;p=p*2.0+vec2(37.0,17.0);a*=0.5;}return v/max(s,0.0001);}",
    "void main(){",
    "  vec2 uv=gl_FragCoord.xy/u_res.xy;float asp=u_res.x/u_res.y;",
    "  vec2 p=(uv-0.5);p.x*=asp;vec2 m=(u_mouse-0.5);m.x*=asp;",
    // Bulge do mouse (Bulge Amount / Scale)
    "  vec2 toM=p-m;float dm=length(toM);",
    "  float bulge=exp(-dm*dm*u_bulgeScale)*u_mouseOn*u_bulgeAmt;p-=toM*bulge;",
    "  float tn=u_time*0.06*u_nSpeed;float tf=u_time*0.06*u_fSpeed;",
    "  vec2 sp=p*u_nFreq+u_nPhase;",
    // Flow Field — distorção direcional (Angle / Scale / Amount / Phase)
    "  vec2 fdir=vec2(cos(u_fAngle),sin(u_fAngle));",
    "  float fl=fbm(p*u_fFreq+u_fPhase+tf);vec2 fw=fdir*fl*u_fAmount;",
    // Noise Fill com domain warping SUAVE (warp baixo = sem marmorização)
    "  vec2 q=vec2(fbm(sp+tn),fbm(sp+vec2(5.2,1.3)-tn));",
    "  float f=fbm(sp+0.6*q+fw);f=f*0.5+0.5;",
    "  float g=clamp((f-0.5)*u_nContrast+0.5+u_bias,0.0,1.0);",
    // Máscara radial — esconde/suaviza o efeito nas bordas
    "  float mdc=length(p);",
    "  float mask=1.0-u_maskAmt*smoothstep(u_maskRadius-u_maskFeather,u_maskRadius+u_maskFeather,mdc);",
    "  g*=mix(1.0,mask,0.85);",
    // Paleta roxa da marca — rampa contínua (transições suaves, sem contorno)
    "  vec3 bg=vec3(0.028,0.030,0.046);vec3 pDeep=vec3(0.17,0.12,0.46);",
    "  vec3 pMain=vec3(0.40,0.32,0.95);vec3 pLite=vec3(0.64,0.58,1.0);",
    "  vec3 col=bg;",
    "  col=mix(col,pDeep,smoothstep(0.16,0.55,g));",
    "  col=mix(col,pMain,smoothstep(0.42,0.82,g));",
    "  col=mix(col,pLite,smoothstep(0.72,1.02,g));",
    "  col+=pMain*exp(-dm*dm*5.0)*u_mouseOn*0.10;",
    "  gl_FragColor=vec4(col,1.0);}",
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("hero-bg shader:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // localização dos uniforms de parâmetro (cache)
  var paramLocs = {};
  (function () {
    var tmp = mapParams(PARAMS);
    for (var k in tmp) paramLocs[k] = gl.getUniformLocation(prog, k);
  })();

  // aplica os PARAMS ao shader (chamado pelo painel de controle, ao vivo)
  function applyParams(P) {
    gl.useProgram(prog);
    var U = mapParams(P);
    for (var kk in U) { if (paramLocs[kk]) gl.uniform1f(paramLocs[kk], U[kk]); }
    MOUSE_LERP = 0.14 - (P.noise.momentum / 100) * 0.11;
  }
  applyParams(PARAMS);

  // API pública para o painel de controle (hero-controls.js)
  window.HeroFX = {
    params: PARAMS,
    apply: function (P) { applyParams(P || PARAMS); },
    defaults: JSON.parse(JSON.stringify(PARAMS)),
  };

  var uRes = gl.getUniformLocation(prog, "u_res");
  var uTime = gl.getUniformLocation(prog, "u_time");
  var uMouse = gl.getUniformLocation(prog, "u_mouse");
  var uMouseOn = gl.getUniformLocation(prog, "u_mouseOn");

  hero.classList.add("fx-active");

  var W = 1, H = 1;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  resize();
  window.addEventListener("resize", resize);

  var mx = 0.5, my = 0.55, tmx = 0.5, tmy = 0.55, mOn = 0, tOn = 0;
  hero.addEventListener("mousemove", function (e) {
    var r = hero.getBoundingClientRect();
    tmx = (e.clientX - r.left) / r.width;
    tmy = 1 - (e.clientY - r.top) / r.height;
    tOn = 1;
  });
  hero.addEventListener("mouseleave", function () { tOn = 0; });

  var inView = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
    }, { threshold: 0 }).observe(hero);
  }

  var startT = null;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!inView || document.hidden) { startT = null; return; }
    if (startT === null) startT = now;

    mx += (tmx - mx) * MOUSE_LERP;
    my += (tmy - my) * MOUSE_LERP;
    mOn += (tOn - mOn) * 0.08;

    var t = reduce ? 0.0 : (now - startT) * 0.001;
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uMouseOn, mOn);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(frame);
})();
