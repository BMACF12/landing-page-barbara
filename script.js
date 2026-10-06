(() => {
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  // Pseudo-aleatorio con semilla: el mapa y las hojas salen siempre iguales
  const rng = (seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646)(7);

  /* ---------------- Ramas con hojas ---------------- */
  const LEAF = "M0 0 C 5 -6.5, 16 -7.5, 25 0 C 16 7.5, 5 6.5, 0 0 Z";
  document.querySelectorAll("[data-branch]").forEach((svg, b) => {
    const defs = document.createElementNS(SVGNS, "defs");
    defs.innerHTML = `<linearGradient id="lg${b}" x1="0" x2="1"><stop offset="0" stop-color="#6e4329"/><stop offset="1" stop-color="#b98a5e"/></linearGradient>
      <linearGradient id="lgl${b}" x1="0" x2="1"><stop offset="0" stop-color="#9b6c47"/><stop offset="1" stop-color="#d8b48b"/></linearGradient>`;
    svg.prepend(defs);
    let order = 0;
    svg.querySelectorAll(".stem").forEach((stem, s) => {
      const len = stem.getTotalLength();
      const step = s === 0 ? 15 : 13;
      for (let d = 10, k = 0; d < len - 4; d += step, k++) {
        const p = stem.getPointAtLength(d);
        const q = stem.getPointAtLength(Math.min(d + 1, len));
        const tangent = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
        const side = k % 2 ? 1 : -1;
        const angle = tangent + side * (38 + rng() * 22);
        const size = (0.55 + rng() * 0.45) * (1 - (d / len) * 0.25) * (s ? 0.85 : 1);
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${size.toFixed(2)})`);
        const leaf = document.createElementNS(SVGNS, "g");
        leaf.setAttribute("class", "leaf");
        leaf.style.transitionDelay = `${0.5 + order++ * 0.07}s`;
        leaf.innerHTML = `<path d="${LEAF}" fill="url(#${rng() > 0.35 ? "lg" : "lgl"}${b})"/><path class="leaf-vein" d="M1 0 Q 12 -1, 23 0"/>`;
        g.appendChild(leaf);
        svg.appendChild(g);
      }
      stem.setAttribute("pathLength", "1");
    });
  });

  /* ---------------- Partículas doradas ---------------- */
  const particles = document.getElementById("particles");
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("span");
    const size = 2 + Math.random() * 4;
    s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${10 + Math.random() * 12}s;animation-delay:${-Math.random() * 20}s;--dx:${(Math.random() - 0.5) * 80}px`;
    particles.appendChild(s);
  }

  /* ---------------- Texto dividido por letras ---------------- */
  document.querySelectorAll("[data-split]").forEach(el => {
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.innerHTML = [...text]
      .map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${c === " " ? "&nbsp;" : c}</span>`)
      .join("");
  });

  /* ---------------- Revelado al hacer scroll ---------------- */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.id === "mapCard") setTimeout(() => e.target.classList.add("drawn"), 300);
      observer.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  const startReveals = () =>
    document.querySelectorAll(".reveal, .reveal-scale, .split, .signature").forEach(el => observer.observe(el));

  /* ---------------- Scroll: progreso + parallax ---------------- */
  const progress = document.getElementById("progress");
  const parallax = [...document.querySelectorAll(".parallax")];
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    document.documentElement.style.setProperty("--sy", y);
    parallax.forEach(el => (el.style.transform = `translate3d(0, ${y * el.dataset.speed}px, 0)`));
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------------- Sobre de invitación ---------------- */
  const intro = document.getElementById("intro");
  const envelope = document.getElementById("envelope");
  let opened = false;
  const reveal = () => {
    body.classList.remove("locked");
    body.classList.add("ready");
    window.scrollTo(0, 0);
    startReveals();
    onScroll();
  };
  const openEnvelope = () => {
    if (opened) return;
    opened = true;
    clearTimeout(autoOpen);
    if (reduced) { intro.remove(); reveal(); return; }
    intro.classList.add("opening");
    setTimeout(() => { intro.classList.add("done"); reveal(); }, 2500);
    setTimeout(() => intro.remove(), 4000);
  };
  envelope.addEventListener("click", openEnvelope);
  // Si nadie toca el sello, se abre solo
  const autoOpen = setTimeout(openEnvelope, reduced ? 0 : 6000);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ---------------- Inclinación 3D del mapa ---------------- */
  const mapCard = document.getElementById("mapCard");
  if (window.matchMedia("(hover: hover)").matches && !reduced) {
    mapCard.addEventListener("pointermove", e => {
      if (!mapCard.classList.contains("in")) return;
      const r = mapCard.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      mapCard.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
    });
    mapCard.addEventListener("pointerleave", () => (mapCard.style.transform = ""));
  }

  /* ---------------- Efecto ripple en botones ---------------- */
  document.querySelectorAll(".btn").forEach(btn =>
    btn.addEventListener("pointerdown", e => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 0.6;
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s);
      setTimeout(() => s.remove(), 700);
    })
  );

  /* ---------------- Agendar (.ics) ---------------- */
  const EVENT = {
    title: "Open House · Bárbara Atenea Beauty Club",
    details: "Recibe un análisis facial digital personalizado, sin costo.",
    location: "Edificio Clifford 2, Local 1A, Luxemburgo N34-191 y Holanda, Quito",
  };

  // Google Calendar no permite fijar recordatorios por URL: usa el aviso por defecto de cada usuario
  document.getElementById("addCal").addEventListener("click", () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: EVENT.title,
      dates: "20261016T100000/20261016T180000",
      ctz: "America/Guayaquil",
      details: EVENT.details,
      location: EVENT.location,
    });
    window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank", "noopener");
  });
})();
