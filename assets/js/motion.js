/*
  Site-wide motion: smooth scrolling, a follower cursor, rolling link labels,
  and an ink-wipe page transition. All of it switches off for reduced motion,
  and the cursor only exists on devices with a fine pointer.
*/
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  // ---------- smooth scroll ----------
  if (!reduce && window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, anchors: { offset: -72 } });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.AP_LENIS = lenis;
    // let the drawer, menu and lightbox scroll natively
    const stop = () => (document.body.classList.contains("cart-open") || document.body.classList.contains("menu-open") || document.querySelector(".lightbox.on")) ? lenis.stop() : lenis.start();
    new MutationObserver(stop).observe(document.body, { attributes: true, attributeFilter: ["class"], subtree: false });
    document.addEventListener("click", () => setTimeout(stop, 0));
  }

  // ---------- rolling labels ----------
  function rollify(el) {
    const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node || el.querySelector(".roll")) return;
    const text = node.textContent.trim();
    // the duplicate label is generated content; keep the accessible name single
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").replace(/[\u2192]/g, "").trim());
    const span = document.createElement("span");
    span.className = "roll";
    span.dataset.t = text;
    span.innerHTML = `<span>${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</span>`;
    const lead = node.textContent.match(/^\s*/)[0], trail = node.textContent.match(/\s*$/)[0];
    el.replaceChild(span, node);
    if (lead) el.insertBefore(document.createTextNode(lead), span);
    if (trail) span.after(document.createTextNode(trail));
  }
  if (!reduce) {
    const run = () => $$(".nav a, .btn, .chip, .seg button, .xsec-tab").forEach(rollify);
    run();
    new MutationObserver(() => run()).observe(document.body, { childList: true, subtree: true });
  }

  // ---------- follower cursor ----------
  if (fine && !reduce) {
    const c = document.createElement("div");
    c.className = "cursor";
    c.innerHTML = `<span class="cursor-label"></span>`;
    document.body.appendChild(c);
    const label = c.firstChild;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, shown = false;
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!shown) { cx = x; cy = y; shown = true; c.classList.add("on"); }
      const t = e.target.closest && e.target.closest("[data-cursor], a, button, .card, label, select, input, textarea");
      let mode = "", text = "";
      if (t) {
        if (t.dataset.cursor === "ink") { mode = "ink"; text = "Ink"; }
        else if (t.classList.contains("card")) { mode = "view"; text = "View"; }
        else if (t.closest("#stage") && !t.closest(".room-mode, .block-mode")) { mode = "view"; text = "Zoom"; }
        else if (t.matches("input, textarea, select")) { mode = "hide"; }
        else mode = "link";
      }
      c.dataset.mode = mode;
      label.textContent = text;
    }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("on"));
    document.addEventListener("pointerenter", () => shown && c.classList.add("on"));
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ---------- ink-wipe page transitions ----------
  if (!reduce) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || a.hasAttribute("download") || !/\.html$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      try { sessionStorage.setItem("ap-pt", "1"); } catch (err) {}
      document.documentElement.classList.add("leaving");
      setTimeout(() => (location.href = url.href), 480);
    });
    // coming back via the back button restores the page from cache with the wipe still on
    addEventListener("pageshow", (e) => { if (e.persisted) document.documentElement.classList.remove("leaving"); });
  }
})();
