/*
  Printmaking modules. Each one renders into an element with data-module="...":
  - matrix: a woodblock is carved, inked and pulled into a print (3D flip)
  - xsec:   animated cross-sections of where the ink sits in relief, intaglio and monotype
  - tools:  the marks each tool leaves, drawn on scroll
  - fan:    an edition of numbered sheets
*/
(function () {
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = window.AP_WORKS || [];
  const feature = W.find((w) => w.images || w.image) || null;
  const detailImg = feature ? (feature.images ? feature.images[Math.floor(feature.images.length / 2)] : feature.image) : null;

  function onView(el, fn, threshold) {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { threshold: threshold || 0.35 });
    io.observe(el);
  }

  // ---------- matrix ----------
  function matrix(root) {
    if (!detailImg) { root.closest("section").remove(); return; }
    const ed = feature.edition ? feature.edition.size : 1;
    root.innerHTML = `
      <div class="wrap matrix-wrap">
        <div>
          <span class="eyebrow"><b>01</b> The matrix</span>
          <h2>Every print starts <em>backwards.</em></h2>
          <p class="lede" style="margin-top:20px">The image is cut into the block as a mirror of itself. Ink sits only on what is left uncut, and the paper pressed onto it turns the picture the right way round.</p>
          <ol class="matrix-steps">
            <li><button type="button" data-step="0" aria-pressed="true"><span class="n">01</span><span><strong>Carve</strong><span class="t">The drawing is cut into the wood with knives and gouges. Everything carved away will stay white.</span></span></button></li>
            <li><button type="button" data-step="1" aria-pressed="false"><span class="n">02</span><span><strong>Ink</strong><span class="t">A roller lays a thin, even film of ink over the surface that remains. The grooves stay clean.</span></span></button></li>
            <li><button type="button" data-step="2" aria-pressed="false"><span class="n">03</span><span><strong>Pull</strong><span class="t">Paper is laid on the block and pressed. Peeled away, the image is reversed, ready to be signed and numbered.</span></span></button></li>
          </ol>
        </div>
        <div class="matrix">
          <div class="matrix-card">
            <div class="face block">
              <img class="carved" src="${detailImg}" alt="">
              <img class="inked" src="${detailImg}" alt="">
              <div class="gloss"></div>
              <div class="roller"></div>
            </div>
            <div class="face print">
              <div class="inner"><img src="${detailImg}" alt="${feature.title}, detail"></div>
              <div class="pencil"><span>1/${ed}</span><span>${feature.title}</span><span></span></div>
            </div>
          </div>
          <div class="matrix-label"><span class="mono" id="matrix-cap">The block, mirrored</span><span class="mono">${feature.title}, detail</span></div>
        </div>
      </div>`;
    const m = $(".matrix", root), cap = $("#matrix-cap", root);
    const caps = ["The block, carved and mirrored", "The block, inked", "The print, pulled from the block"];
    let timers = [];
    function set(step, user) {
      if (user) { timers.forEach(clearTimeout); timers = []; }
      $$("[data-step]", root).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.step === step)));
      m.classList.toggle("pulled", step === 2);
      if (step === 0) m.classList.remove("inked", "inking");
      if (step >= 1 && !m.classList.contains("inked")) {
        m.classList.remove("inking"); void m.offsetWidth;
        m.classList.add("inking", "inked");
      }
      cap.textContent = caps[step];
    }
    $$("[data-step]", root).forEach((b) => b.addEventListener("click", () => set(+b.dataset.step, true)));
    $(".matrix-card", root).addEventListener("click", () => {
      const cur = $$("[data-step]", root).findIndex((b) => b.getAttribute("aria-pressed") === "true");
      set((cur + 1) % 3, true);
    });
    if (reduce) return;

    // Scroll-scrubbed version: the section is pinned and scrolling carves, inks and pulls.
    root.classList.add("scrub");
    const card = $(".matrix-card", root), inked = $(".inked", root), roller = $(".roller", root), gloss = $(".gloss", root);
    const bar = document.createElement("div");
    bar.className = "scrub-bar"; bar.innerHTML = "<i></i>";
    $(".matrix-steps", root).after(bar);
    const clamp = (v) => Math.max(0, Math.min(1, v));
    let lastStep = -1;
    function update() {
      const span = root.offsetHeight - innerHeight;
      const p = clamp((scrollY - root.offsetTop) / (span || 1));
      const ink = clamp((p - 0.16) / 0.34), flip = clamp((p - 0.62) / 0.24);
      inked.style.clipPath = `inset(0 0 0 ${100 - ink * 100}%)`;
      roller.style.left = `${ink * 100}%`;
      roller.style.transform = "translateX(-50%)";
      roller.style.opacity = ink > 0 && ink < 1 ? 1 : 0;
      gloss.style.opacity = ink;
      card.style.transform = `rotateY(${flip * 180}deg)`;
      bar.firstChild.style.transform = `scaleX(${p})`;
      const step = p < 0.16 ? 0 : p < 0.6 ? 1 : 2;
      if (step !== lastStep) {
        lastStep = step;
        $$("[data-step]", root).forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.step === step)));
        cap.textContent = caps[step];
      }
    }
    const targets = [0.05, 0.45, 0.95];
    $$("[data-step]", root).forEach((b) => b.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      const y = root.offsetTop + targets[+b.dataset.step] * (root.offsetHeight - innerHeight);
      if (window.AP_LENIS) window.AP_LENIS.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: "smooth" });
    }, true));
    $(".matrix-card", root).addEventListener("click", (e) => e.stopImmediatePropagation(), true);
    let ticking = false;
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  // ---------- cross-sections ----------
  const C = { ink: "#121110", paper: "#f9f7f2", wood: "#c99c6b", woodDark: "#9c6f43", metal: "#b8b4ab", metalDark: "#8c887f", plexi: "#cfd9dc", label: "#7a746a", red: "#d4402a" };
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const label = (x1, y1, x2, y2, text, anchor) =>
    `<g class="lbl"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.label}" stroke-width=".8"/><text x="${x2}" y="${y2 + 13}" text-anchor="${anchor || "middle"}" font-family="JetBrains Mono, monospace" font-size="10.5" fill="${C.label}" letter-spacing=".3">${text}</text></g>`;
  const defs = (id) => `<defs>
      <linearGradient id="rg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5752"/><stop offset=".45" stop-color="#1b1a18"/><stop offset="1" stop-color="#050505"/></linearGradient>
      <pattern id="grain${id}" width="40" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 Q10 2 20 4 T40 4" stroke="${C.woodDark}" stroke-width=".7" fill="none" opacity=".55"/></pattern>
    </defs>`;

  const DIAGRAMS = {
    relief: {
      name: "Relief",
      title: "Ink on the surface",
      text: "In a woodcut or linocut the ink sits on top. What the artist cuts away stays the colour of the paper, so the image is made by removing everything that should not print.",
      rows: [["Techniques", "Woodcut, linocut, wood engraving"], ["Matrix", "Wood or linoleum block"], ["Look for", "Crisp edges, solid blacks, the grain of the wood"]],
      phases: ["Inking the block", "Paper laid on and pressed", "Lifted: the print"],
      build(id) {
        const valleys = [[92, 128], [186, 204], [258, 322], [378, 394], [448, 502], [544, 562]];
        let d = "M40 262 L40 170";
        valleys.forEach(([a, b]) => (d += ` L${a} 170 L${a + 5} 206 L${b - 5} 206 L${b} 170`));
        d += " L600 170 L600 262 Z";
        const lands = []; let x = 40;
        valleys.forEach(([a, b]) => { lands.push([x, a]); x = b; }); lands.push([x, 600]);
        const inkR = lands.map(([a, b]) => `<rect x="${a}" y="164" width="${b - a}" height="6" fill="${C.ink}"/>`).join("");
        const inkP = lands.map(([a, b]) => `<rect x="${a}" y="0" width="${b - a}" height="6" fill="${C.ink}"/>`).join("");
        return `${defs(id)}
          <clipPath id="ic${id}"><rect id="icr${id}" x="0" y="0" width="0" height="300"/></clipPath>
          <path d="${d}" fill="${C.wood}" stroke="${C.ink}" stroke-width="1"/>
          <path d="${d}" fill="url(#grain${id})"/>
          <g id="bink${id}" clip-path="url(#ic${id})">${inkR}</g>
          <g id="paper${id}"><rect x="30" y="0" width="580" height="8" fill="${C.paper}" stroke="${C.label}" stroke-width=".8"/><g id="pink${id}" transform="translate(0 8)" opacity="0">${inkP}</g></g>
          <g id="roller${id}"><line x1="0" y1="0" x2="46" y2="-62" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/><circle r="30" fill="url(#rg${id})"/><circle r="5" fill="#77736c"/></g>
          ${label(475, 206, 475, 272, "Carved away: stays white")}
          ${label(66, 170, 66, 272, "Uncut surface: takes the ink", "start")}
          ${label(590, 164, 590, 272, "Ink", "end")}`;
      },
      update(id, ph, t) {
        const e = ease(t);
        const p = ph === 0 ? e : 1;
        $(`#icr${id}`).setAttribute("width", 40 + p * 570);
        const r = $(`#roller${id}`);
        r.setAttribute("transform", `translate(${40 + p * 560} 134)`);
        r.style.opacity = ph === 0 ? 1 : 0;
        let py = -20, carry = 0, blockInk = 1;
        if (ph === 1) py = -20 + e * 176;
        if (ph >= 2) { py = 156 - (ph === 2 ? e : 1) * 110; carry = 1; blockInk = 0.18; }
        $(`#paper${id}`).setAttribute("transform", `translate(0 ${py})`);
        $(`#pink${id}`).setAttribute("opacity", carry);
        $(`#bink${id}`).setAttribute("opacity", blockInk);
      }
    },
    intaglio: {
      name: "Intaglio",
      title: "Ink in the grooves",
      text: "Drypoint and etching work the other way round. Lines are scratched or bitten into a plate, ink is pushed into them, and the surface is wiped clean. Damp paper under heavy pressure is forced into the lines to lift the ink out.",
      rows: [["Techniques", "Drypoint, etching, aquatint, engraving"], ["Matrix", "Metal or plexiglass plate"], ["Look for", "Velvety or fine lines, a plate mark pressed into the paper"]],
      phases: ["Ink pushed into the lines", "Surface wiped clean", "Damp paper pressed in", "Lifted: the print"],
      build(id) {
        const g = [110, 150, 166, 240, 300, 316, 332, 420, 470, 540];
        let d = "M40 240 L40 180";
        g.forEach((c) => (d += ` L${c - 7} 180 L${c} 202 L${c + 7} 180`));
        d += " L600 180 L600 240 Z";
        const gi = g.map((c) => `<path d="M${c - 6} 180 L${c} 199 L${c + 6} 180 Z" fill="${C.ink}"/>`).join("");
        const lift = g.map((c) => `<path d="M${c - 5} 0 L${c} 15 L${c + 5} 0 Z" fill="${C.ink}"/>`).join("");
        this._g = g;
        return `${defs(id)}
          <clipPath id="ic${id}"><rect id="icr${id}" x="0" y="0" width="0" height="300"/></clipPath>
          <clipPath id="wc${id}"><rect id="wcr${id}" x="0" y="0" width="640" height="300"/></clipPath>
          <path d="${d}" fill="${C.metal}" stroke="${C.ink}" stroke-width="1"/>
          <rect x="40" y="226" width="560" height="14" fill="${C.metalDark}" opacity=".35"/>
          <g id="gink${id}" clip-path="url(#ic${id})">${gi}<g clip-path="url(#wc${id})"><rect x="40" y="175" width="560" height="5" fill="${C.ink}"/></g></g>
          <g id="tarl${id}" opacity="0"><rect x="-34" y="146" width="68" height="30" rx="12" fill="#e2d6bd" stroke="${C.label}" stroke-width=".8"/><path d="M-26 154 h52 M-26 161 h52 M-26 168 h52" stroke="${C.label}" stroke-width=".6"/></g>
          <g id="paper${id}"><path id="pp${id}" fill="${C.paper}" stroke="${C.label}" stroke-width=".8"/><g id="plift${id}" opacity="0">${lift}</g></g>
          ${label(240, 196, 240, 272, "Ink held in the lines")}
          ${label(395, 180, 395, 272, "Surface wiped clean")}
          ${label(560, 240, 560, 272, "Plate", "middle")}`;
      },
      paper(id, y, dip) {
        let d = `M30 ${y} L610 ${y} L610 ${y + 12}`;
        const g = [...this._g].sort((a, b) => b - a);
        g.forEach((c) => (d += ` L${c + 7} ${y + 12} L${c} ${y + 12 + dip} L${c - 7} ${y + 12}`));
        d += ` L30 ${y + 12} Z`;
        $(`#pp${id}`).setAttribute("d", d);
      },
      update(id, ph, t) {
        const e = ease(t);
        $(`#icr${id}`).setAttribute("width", ph === 0 ? 40 + e * 570 : 640);
        const wx = ph === 1 ? 40 + e * 570 : ph > 1 ? 640 : 0;
        $(`#wcr${id}`).setAttribute("x", wx);
        const tl = $(`#tarl${id}`);
        tl.setAttribute("opacity", ph === 1 ? 1 : 0);
        tl.setAttribute("transform", `translate(${wx} 0)`);
        let y = -30, dip = 0, lifted = 0, gi = 1;
        if (ph === 2) { y = -30 + e * 198; dip = e > 0.7 ? ((e - 0.7) / 0.3) * 14 : 0; }
        if (ph === 3) { y = 168 - e * 120; dip = 14; lifted = 1; gi = 0.2; }
        this.paper(id, y, dip);
        $(`#plift${id}`).setAttribute("opacity", lifted);
        $(`#plift${id}`).setAttribute("transform", `translate(0 ${y + 12})`);
        $(`#gink${id}`).setAttribute("opacity", gi);
      }
    },
    planographic: {
      name: "Monotype",
      title: "Ink painted on a flat plate",
      text: "For a monotype the plate is not cut at all. Ink is brushed, rolled or wiped straight onto a smooth surface and printed once. A second, fainter pull, the ghost, is sometimes taken from what remains.",
      rows: [["Techniques", "Monotype, monoprint"], ["Matrix", "Smooth plate: glass, plexiglass, metal"], ["Look for", "Painterly marks, soft edges, one of one"]],
      phases: ["Ink painted onto the plate", "Paper laid on and pressed", "Lifted: one of a kind"],
      build(id) {
        const b = [[90, 34, 6], [170, 20, 4], [238, 46, 8], [330, 26, 5], [400, 52, 7], [492, 22, 4], [548, 30, 6]];
        this._n = b.length;
        const blobs = (y, cls) => b.map(([cx, rx, ry], i) => `<ellipse class="${cls}" data-i="${i}" cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.ink}" opacity="${0.55 + (i % 3) * 0.15}"/>`).join("");
        return `${defs(id)}
          <rect x="40" y="198" width="560" height="16" fill="${C.plexi}" stroke="${C.ink}" stroke-width="1" opacity=".85"/>
          <path d="M44 201 L596 201" stroke="#fff" stroke-width="1.2" opacity=".7"/>
          <g id="pb${id}">${blobs(194, "pbl")}</g>
          <g id="paper${id}"><rect x="30" y="0" width="580" height="8" fill="${C.paper}" stroke="${C.label}" stroke-width=".8"/><g id="pl${id}" opacity="0">${blobs(12, "pbl2")}</g></g>
          ${label(238, 202, 238, 272, "Ink painted on a smooth plate")}
          ${label(520, 214, 520, 272, "Plate, not cut")}`;
      },
      update(id, ph, t) {
        const e = ease(t);
        $$(`#pb${id} .pbl`).forEach((el) => {
          const i = +el.dataset.i, k = ph === 0 ? clamp01(t * this._n - i) : 1;
          el.setAttribute("transform", `translate(${el.getAttribute("cx")} 194) scale(${k}) translate(${-el.getAttribute("cx")} -194)`);
        });
        let py = -20, carry = 0, ghost = 1;
        if (ph === 1) py = -20 + e * 202;
        if (ph === 2) { py = 182 - e * 130; carry = 1; ghost = 0.22; }
        $(`#paper${id}`).setAttribute("transform", `translate(0 ${py})`);
        $(`#pl${id}`).setAttribute("opacity", carry);
        $(`#pb${id}`).setAttribute("opacity", ghost);
      }
    }
  };

  let xid = 0;
  function xsec(root) {
    const keys = Object.keys(DIAGRAMS);
    root.innerHTML = `
      <div class="xsec-tabs" role="tablist">${keys.map((k, i) => `<button class="xsec-tab" role="tab" type="button" data-k="${k}" aria-selected="${i === 0}">${DIAGRAMS[k].name}</button>`).join("")}</div>
      <div class="xsec">
        <div class="xsec-fig"><span class="corner tl reg"><i></i></span><span class="corner br reg"><i></i></span><div class="fig"></div></div>
        <div class="xsec-text"></div>
      </div>`;
    let raf, cur;
    function show(k, autoplay) {
      cancelAnimationFrame(raf);
      const D = DIAGRAMS[k], id = ++xid;
      cur = k;
      $$(".xsec-tab", root).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.k === k)));
      $(".fig", root).innerHTML = `<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cross-section: ${D.title}"><text class="cap" id="ph${id}" x="40" y="34" font-family="JetBrains Mono, monospace" font-size="11" fill="${C.red}" letter-spacing=".4"></text>${D.build(id)}</svg>`;
      $(".xsec-text", root).innerHTML = `
        <span class="eyebrow">${D.name}</span>
        <h3>${D.title}</h3>
        <p>${D.text}</p>
        <dl>${D.rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>
        <button class="xsec-replay" type="button">Play again</button>`;
      $(".xsec-replay", root).onclick = () => show(k, true);
      const n = D.phases.length, dur = 1500, hold = 450;
      const ph = $(`#ph${id}`);
      if (!autoplay) { D.update(id, 0, 0); ph.textContent = `1 / ${n} — ${D.phases[0].toUpperCase()}`; return; }
      if (reduce) { D.update(id, n - 1, 1); ph.textContent = `${n} / ${n} — ${D.phases[n - 1].toUpperCase()}`; return; }
      const start = performance.now();
      const step = (now) => {
        const el = Math.max(0, now - start), seg = dur + hold;
        const i = Math.min(n - 1, Math.floor(el / seg));
        const t = clamp01((el - i * seg) / dur);
        D.update(id, i, t);
        ph.textContent = `${i + 1} / ${n} — ${D.phases[i].toUpperCase()}`;
        if (el < n * seg) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    $$(".xsec-tab", root).forEach((b) => b.addEventListener("click", () => show(b.dataset.k, true)));
    show(keys[0], false);
    onView(root, () => show(cur, true), 0.4);
  }

  // ---------- tools ----------
  function tools(root) {
    const R = (seed) => { let a = seed; return () => ((a = (a * 16807) % 2147483647) / 2147483647); };
    const black = (inner) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#121110"/>${inner}</svg>`;
    const vg = () => { const r = R(7); let s = ""; for (let i = 0; i < 16; i++) { const y = 18 + i * 11; s += `<path class="mark" style="--i:${i}" d="M${14 + r() * 20} ${y} q60 ${-6 + r() * 12} ${150 + r() * 20} ${-4 + r() * 8}" stroke="#f9f7f2" stroke-width="${1.2 + r() * 1.6}" fill="none" stroke-linecap="round"/>`; } return black(s); };
    const ug = () => { const r = R(11); let s = ""; for (let i = 0; i < 9; i++) { const x = 20 + r() * 130, y = 20 + i * 19; s += `<path class="mark" style="--i:${i}" d="M${x} ${y} q${20 + r() * 20} ${-4 + r() * 8} ${40 + r() * 30} ${-2 + r() * 4}" stroke="#f9f7f2" stroke-width="${8 + r() * 5}" fill="none" stroke-linecap="round"/>`; } return black(s); };
    const kn = () => black(`
      <path class="mark" style="--i:0" d="M30 160 L70 60 L110 140 L150 40 L176 120" stroke="#f9f7f2" stroke-width="1.6" fill="none" stroke-linejoin="miter"/>
      <path class="mark" style="--i:3" d="M36 162 L74 70 L110 150 L150 52 L172 126" stroke="#f9f7f2" stroke-width="1" fill="none"/>
      <path class="mark" style="--i:6" d="M20 182 L180 176" stroke="#f9f7f2" stroke-width="1.4" fill="none"/>
      <path class="mark" style="--i:8" d="M60 30 L100 22 L96 48 Z" stroke="#f9f7f2" stroke-width="1.2" fill="none"/>`);
    const dp = () => {
      const r = R(19); let s = "", t = "";
      for (let i = 0; i < 14; i++) {
        const x = 20 + r() * 160, y = 180 - r() * 20, d = `M${x} ${y} q${-20 + r() * 40} -60 ${-30 + r() * 60} ${-110 - r() * 40}`;
        s += `<path class="mark" style="--i:${i}" d="${d}" stroke="#121110" stroke-width="3.2" fill="none" opacity=".28" filter="url(#burr)"/>`;
        t += `<path class="mark" style="--i:${i}" d="${d}" stroke="#121110" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      }
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="burr"><feGaussianBlur stdDeviation="1.1"/></filter><rect width="200" height="200" fill="#f9f7f2"/><rect width="200" height="200" fill="#121110" opacity=".04"/>${s}${t}</svg>`;
    };
    const T = [
      ["V-gouge", "Woodcut · linocut", "Cuts a fine, sharp channel. Used for detail: hatching, texture, the edge of a cloud.", vg],
      ["U-gouge", "Woodcut · linocut", "A rounded scoop that clears wider areas and leaves soft-ended marks.", ug],
      ["Knife", "Woodcut", "Outlines shapes with two angled cuts, before the gouges clear around them.", kn],
      ["Drypoint needle", "Drypoint", "Scratches straight into the plate. The ridge it throws up, the burr, holds ink and prints a soft, velvety line.", dp]
    ];
    root.innerHTML = `<div class="tools">${T.map(([n, use, txt, f], i) => `
      <div class="tool">
        <div class="mono"><span>${String(i + 1).padStart(2, "0")}</span><span>${use}</span></div>
        <div class="spec">${f()}</div>
        <h3>${n}</h3>
        <p>${txt}</p>
      </div>`).join("")}</div>`;
    $$(".mark", root).forEach((p) => { try { p.style.setProperty("--len", Math.ceil(p.getTotalLength()) + 1); } catch (e) {} });
    onView(root, () => $(".tools", root).classList.add("drawn"), 0.25);
  }

  // ---------- edition fan ----------
  function fan(root) {
    const n = feature && feature.edition ? feature.edition.size : 10;
    const img = detailImg;
    root.innerHTML = `<div class="fan" role="list" aria-label="An edition of ${n}">${Array.from({ length: n }, (_, i) => `
      <div class="s" role="listitem" tabindex="0" style="--i:${(i * 9) / (n - 1 || 1)}">
        <div class="img" style="${img ? `background-image:url('${img}')` : "background:#121110"}"></div>
        <div class="n"><span>${i + 1}/${n}</span></div>
      </div>`).join("")}</div>`;
  }

  const MODS = { matrix, xsec, tools, fan };
  $$("[data-module]").forEach((el) => MODS[el.dataset.module] && MODS[el.dataset.module](el));
})();
