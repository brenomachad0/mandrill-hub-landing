/* ==========================================================================
   Mandrill Hub — Interações & navegação fluida
   ========================================================================== */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const progress = document.getElementById("scrollProgress");

  /* -------------------------------------------------------------
     1. Barra de progresso + estado do header no scroll
     ------------------------------------------------------------- */
  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? scrollTop / docHeight : 0;
    progress.style.transform = "scaleX(" + ratio + ")";

    header.classList.toggle("is-scrolled", scrollTop > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------------------
     2. Menu mobile
     ------------------------------------------------------------- */
  navToggle.addEventListener("click", function () {
    const open = nav.classList.toggle("is-open");
    header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      header.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* -------------------------------------------------------------
     3. Smooth scroll com compensação da altura do header
     ------------------------------------------------------------- */
  const headerOffset = 76;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const id = link.getAttribute("href");
      if (id === "#" || id === "#top") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
        return;
      }
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerOffset + 1;
      window.scrollTo({ top: top, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  /* -------------------------------------------------------------
     4. Scroll reveal (fade + slide) com IntersectionObserver
     ------------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* -------------------------------------------------------------
     5. Scroll spy — destaca o link ativo da navegação
     ------------------------------------------------------------- */
  const navLinks = Array.prototype.slice.call(
    document.querySelectorAll("#nav a")
  );
  const sections = navLinks
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            navLinks.forEach((l) =>
              l.classList.toggle("is-active", l.getAttribute("href") === id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* -------------------------------------------------------------
     6. FAQ acordeão animado
     ------------------------------------------------------------- */
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    const btn = item.querySelector(".faq-q");
    const answer = item.querySelector(".faq-a");
    btn.addEventListener("click", function () {
      const isOpen = item.classList.contains("is-open");
      // fecha todos (comportamento acordeão)
      faqItems.forEach(function (other) {
        other.classList.remove("is-open");
        other.querySelector(".faq-a").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("is-open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
  // reajusta altura em resize
  window.addEventListener("resize", function () {
    const open = document.querySelector(".faq-item.is-open .faq-a");
    if (open) open.style.maxHeight = open.scrollHeight + "px";
  });

  /* -------------------------------------------------------------
     7. Marquee sem emenda — duplica largura já no HTML
        (feedback visual de pausa no hover via CSS)
     ------------------------------------------------------------- */

  /* -------------------------------------------------------------
     8. Componente do dashboard — digitação da URL, slideshow,
        flutuação com parallax e brilho roxo no cursor
     ------------------------------------------------------------- */
  (function dashboardComponent() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    /* 8.1 — Digitação da URL ao carregar */
    const urlPill = document.getElementById("urlPill");
    const urlText = document.getElementById("urlText");
    const fullUrl = "app.mandrill.com.br";
    if (urlText) {
      if (prefersReduced) {
        urlText.textContent = fullUrl;
        urlPill.classList.add("done");
      } else {
        let i = 0;
        setTimeout(function type() {
          urlText.textContent = fullUrl.slice(0, i);
          if (i++ < fullUrl.length) {
            setTimeout(type, 55 + Math.random() * 45);
          } else {
            setTimeout(() => urlPill.classList.add("done"), 900);
          }
        }, 650);
      }
    }

    /* 8.2 — Slideshow das telas (auto + dots) */
    const track = document.getElementById("dashTrack");
    const dotsWrap = document.getElementById("dashDots");
    if (track && dotsWrap) {
      const slides = track.children.length;
      let current = 0;
      let timer = null;
      const DELAY = 5200;

      for (let s = 0; s < slides; s++) {
        const dot = document.createElement("button");
        dot.className = "dash-dot" + (s === 0 ? " is-active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Tela " + (s + 1));
        dot.addEventListener("click", function () {
          go(s);
          restart();
        });
        dotsWrap.appendChild(dot);
      }
      const dots = dotsWrap.children;

      function go(n) {
        current = (n + slides) % slides;
        track.style.transform = "translateX(" + -current * 100 + "%)";
        for (let d = 0; d < dots.length; d++) {
          dots[d].classList.toggle("is-active", d === current);
        }
      }
      function next() { go(current + 1); }
      function start() { timer = setInterval(next, DELAY); }
      function stop() { if (timer) clearInterval(timer); timer = null; }
      function restart() { stop(); start(); }

      start();
      // pausa quando o mouse está sobre o componente
      dashboard.addEventListener("mouseenter", stop);
      dashboard.addEventListener("mouseleave", start);
      // pausa quando a aba não está visível
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else restart();
      });
    }

    /* 8.3 — Parallax com o mouse (inclina o contêiner inteiro) */
    if (!prefersReduced) {
      let raf = null;
      let tx = 0, ty = 0; // -0.5..0.5

      dashboard.addEventListener("mousemove", function (e) {
        const rect = dashboard.getBoundingClientRect();
        tx = (e.clientX - rect.left) / rect.width - 0.5;
        ty = (e.clientY - rect.top) / rect.height - 0.5;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      function apply() {
        raf = null;
        dashboard.style.transform =
          "rotateX(" + (-ty * 6).toFixed(2) + "deg) rotateY(" +
          (tx * 9).toFixed(2) + "deg)";
      }

      dashboard.addEventListener("mouseleave", function () {
        dashboard.style.transform = "";
      });
    }
  })();

  /* -------------------------------------------------------------
     9. Modal "Teste grátis" + envio pro Google Sheets
     ------------------------------------------------------------- */
  const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbxBiPiO04n4s4pYn9t0ffb8wslvUnWkvpg-uMI8OZRe8IOY77bKjM1Ep38DkdTgGG-ZVA/exec";
  const EMAIL_FALLBACK = "suporte@mandrill.com.br";

  const modal = document.getElementById("testeModal");
  const form = document.getElementById("testeForm");

  if (modal) {
    const panelForm = document.getElementById("testeModalForm");
    const panelOk = document.getElementById("testeModalSuccess");
    let lastFocus = null;

    function showPanel(which) {
      const ok = which === "success";
      panelForm.hidden = ok;
      panelOk.hidden = !ok;
    }

    function focusables() {
      return Array.prototype.filter.call(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ),
        function (el) {
          return el.offsetParent !== null;
        }
      );
    }

    function onKey(e) {
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function openModal() {
      lastFocus = document.activeElement;
      showPanel("form");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKey);
      const first = modal.querySelector("input, select");
      if (first) window.setTimeout(function () { first.focus(); }, 80);
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    // gatilhos: qualquer link p/ #teste e botões com data-open-teste
    document
      .querySelectorAll('a[href="#teste"], [data-open-teste]')
      .forEach(function (t) {
        t.addEventListener("click", function (e) {
          e.preventDefault();
          openModal();
        });
      });

    // fechar: X, clique no backdrop e botão "Fechar"
    modal.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", closeModal);
    });

    /* ---- envio do formulário ---- */
    if (form) {
      const msg = document.createElement("p");
      msg.id = "formMsg";
      msg.setAttribute("role", "status");
      msg.style.cssText =
        "margin-top:14px;font-size:.92rem;font-weight:500;border-radius:10px;display:none;line-height:1.45;";
      form.appendChild(msg);

      function showErr(text) {
        msg.textContent = text;
        msg.style.display = "block";
        msg.style.padding = "12px 14px";
        msg.style.background = "rgba(200,60,20,.14)";
        msg.style.border = "1px solid #c8501e";
        msg.style.color = "#f0a68a";
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const btn = form.querySelector('button[type="submit"]');
        const original = btn.textContent;
        const data = {
          nome: form.nome.value.trim(),
          produtora: form.produtora.value.trim(),
          cidade: form.cidade.value.trim(),
          email: form.email.value.trim(),
          whatsapp: form.whatsapp.value.trim(),
          tamanho: form.equipe.value, // "equipe" no form -> "tamanho" na planilha
          mensagem: "",
          origem: "landing-hub",
          data_hora: new Date().toISOString(),
        };

        btn.disabled = true;
        btn.style.opacity = "0.85";
        btn.textContent = "Enviando...";
        msg.style.display = "none";

        fetch(LEAD_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        })
          .then(function () {
            // no-cors não deixa ler a resposta; sucesso de rede = ok.
            form.reset();
            showPanel("success"); // troca pro painel "conta criada"
          })
          .catch(function () {
            showErr(
              "Deu um problema no envio. Tenta de novo ou chama a gente em " +
                EMAIL_FALLBACK + "."
            );
          })
          .finally(function () {
            btn.disabled = false;
            btn.style.opacity = "";
            btn.textContent = original;
          });
      });
    }
  }
})();
