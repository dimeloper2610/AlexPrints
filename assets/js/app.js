/* AlexPrints — shared chrome, cart and page logic. No build step, no dependencies. */
(function () {
  const C = window.AP_CONFIG;
  const W = window.AP_WORKS;
  const T = window.AP_TECHNIQUES;
  const CAT = window.AP_CATEGORIES;
  const ART = window.AP_ART;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  const money = (n) =>
    new Intl.NumberFormat(C.locale, { style: "currency", currency: C.currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
  const byId = (id) => W.find((w) => w.id === id);
  const cm = (s) => (s ? `${s[0]} × ${s[1]} cm` : "");
  const techName = (w) => (T[w.technique] ? T[w.technique].name : w.technique);
  const isIntaglio = (w) => T[w.technique] && T[w.technique].family === "Intaglio";

  // ---------- availability ----------
  function stock(w) {
    if (w.edition) return w.edition.available == null ? 1 : w.edition.available; // null = not stated yet
    return w.available ? 1 : 0;
  }
  function status(w) {
    const n = stock(w);
    if (n <= 0) return { key: "sold", label: "Sold" };
    if (w.edition && w.edition.available != null && n <= 3) return { key: "low", label: `${n} left` };
    return { key: "ok", label: "Available" };
  }
  const buyable = (w) => stock(w) > 0 && w.price != null;
  const workUrl = (w) => `work.html?id=${encodeURIComponent(w.id)}`;
  const mailto = (subject, body) =>
    `mailto:${C.email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

  // ---------- storage (fails quietly in private mode) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- cart ----------
  const cart = {
    items: store.get("ap-cart", []).filter((i) => byId(i.id)),
    save() { store.set("ap-cart", this.items); renderCart(); },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); },
    unit(i) { const w = byId(i.id); return w.price + (i.framed ? C.framingPrice : 0); },
    total() { return this.items.reduce((a, i) => a + this.unit(i) * i.qty, 0); },
    inCart(id) { return this.items.filter((i) => i.id === id).reduce((a, i) => a + i.qty, 0); },
    add(id, framed) {
      const w = byId(id);
      if (!w || !buyable(w)) return false;
      if (this.inCart(id) >= stock(w)) { toast(w.edition ? `Only ${stock(w)} impressions available` : "This is a unique work, already in your cart"); return false; }
      const key = id + (framed ? ":f" : "");
      const ex = this.items.find((i) => i.key === key);
      if (ex) ex.qty++; else this.items.push({ key, id, framed: !!framed, qty: 1 });
      this.save();
      return true;
    },
    setQty(key, qty) {
      const i = this.items.find((x) => x.key === key);
      if (!i) return;
      const w = byId(i.id);
      const others = this.inCart(i.id) - i.qty;
      i.qty = Math.max(0, Math.min(qty, stock(w) - others));
      if (!i.qty) this.items = this.items.filter((x) => x !== i);
      this.save();
    },
    clear() { this.items = []; this.save(); }
  };

  // ---------- chrome ----------
  function header() {
    const cat = params.get("category");
    const cur = (p, c) => (page === p && (c === undefined || c === cat) ? ' aria-current="page"' : "");
    return `
      ${C.previewNotice ? `<div class="preview-note">Preview — sample works, names and prices</div>` : ""}
      <header class="site-header">
        <div class="wrap">
          <a class="logo" href="index.html"><span class="stamp" aria-hidden="true">AF</span>Alex<span>Prints</span></a>
          <nav class="nav" id="nav" aria-label="Main">
            <a href="works.html?category=print"${cur("works", "print")}>Prints</a>
            <a href="works.html?category=painting"${cur("works", "painting")}>Paintings</a>
            <a href="works.html"${cur("works", null)}>All works</a>
            <a href="process.html"${cur("process")}>Process</a>
            <a href="about.html"${cur("about")}>About</a>
          </nav>
          <div class="header-actions">
            <button class="cart-btn" type="button" data-open-cart aria-label="Open cart">Cart <span class="cart-count">0</span></button>
            <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Menu"><span></span><span></span></button>
          </div>
        </div>
      </header>`;
  }

  function footer() {
    const year = new Date().getFullYear();
    return `
      <footer class="site-footer">
        <div class="wrap">
          <div class="footer-cta">
            <p class="footer-big">Ask about<br>a <em>print</em>.</p>
            <a class="btn" href="mailto:${esc(C.email)}">Write to Alex <span class="arr">&rarr;</span></a>
          </div>
          <div class="footer-grid">
            <div>
              <h4>${esc(C.artist)}</h4>
              <p>Woodcuts, drypoints and monotypes, cut and printed by hand. Based in Stockholm.</p>
              <a class="link-arrow" href="mailto:${esc(C.email)}">${esc(C.email)}</a>
            </div>
            <div>
              <h4>Works</h4>
              <ul>
                <li><a href="works.html?category=print">Prints</a></li>
                <li><a href="works.html?category=painting">Paintings</a></li>
                <li><a href="works.html?category=proof">Proofs &amp; studies</a></li>
                <li><a href="works.html?available=1">Available now</a></li>
              </ul>
            </div>
            <div>
              <h4>Studio</h4>
              <ul>
                <li><a href="process.html">Process</a></li>
                <li><a href="process.html#read">Reading a print</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="about.html#contact">Commissions</a></li>
                ${C.instagram ? `<li><a href="${esc(C.instagram)}" rel="noopener">Instagram</a></li>` : ""}
              </ul>
            </div>
          </div>
          <div class="footer-bottom mono">
            <span>&copy; ${year} ${esc(C.siteName)}</span>
            <span>Stockholm · Printed by hand</span>
          </div>
        </div>
      </footer>
      <div class="drawer-backdrop" data-close-cart></div>
      <aside class="drawer" aria-label="Cart" aria-hidden="true">
        <div class="drawer-head"><h2>Cart</h2><button class="icon-btn" type="button" data-close-cart>Close</button></div>
        <div class="drawer-body" id="cart-lines"></div>
        <div class="drawer-foot" id="cart-foot"></div>
      </aside>
      <div class="toast" role="status" aria-live="polite"></div>`;
  }

  function lineHTML(i, compact) {
    const w = byId(i.id);
    const max = stock(w) - (cart.inCart(w.id) - i.qty);
    return `
      <div class="line">
        <a class="line-thumb fit" href="${workUrl(w)}" style="--r:${ART.ratio(w)}">${ART.media(w, { inscribe: false })}</a>
        <div>
          <a class="line-title" href="${workUrl(w)}">${esc(w.title)}</a>
          <div class="line-meta">${esc(techName(w))}${w.edition ? ` · edition of ${w.edition.size}` : ""}${i.framed ? " · framed" : ""}</div>
          ${compact ? `<div class="line-meta">Qty ${i.qty}</div>` : `
          <div class="qty" data-key="${esc(i.key)}">
            <button type="button" data-q="-1" aria-label="Decrease">−</button><span>${i.qty}</span><button type="button" data-q="1" aria-label="Increase" ${i.qty >= max ? "disabled" : ""}>+</button>
          </div>`}
        </div>
        <div class="line-right">
          <span class="line-price">${money(cart.unit(i) * i.qty)}</span>
          ${compact ? "" : `<button class="remove" type="button" data-remove="${esc(i.key)}">Remove</button>`}
        </div>
      </div>`;
  }

  function renderCart() {
    $$(".cart-count").forEach((el) => (el.textContent = cart.count()));
    const lines = $("#cart-lines"), foot = $("#cart-foot");
    if (!lines) return;
    if (!cart.items.length) {
      lines.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p><a class="link-arrow" href="works.html?category=print">Browse prints</a></div>`;
      foot.innerHTML = "";
    } else {
      lines.innerHTML = cart.items.map((i) => lineHTML(i)).join("");
      foot.innerHTML = `
        <div class="total-row"><span>Subtotal</span><strong>${money(cart.total())}</strong></div>
        <p class="small">Shipping is quoted with your order confirmation. Nothing is charged yet.</p>
        <a class="btn block" href="checkout.html">Request order</a>`;
    }
    if (page === "checkout") renderCheckout();
  }

  function openCart(open) {
    document.body.classList.toggle("cart-open", open);
    if (open) $(".toast").classList.remove("on");
    $(".drawer").setAttribute("aria-hidden", String(!open));
    if (open) $(".drawer .icon-btn").focus();
  }

  let toastTimer;
  function toast(msg, action) {
    const t = $(".toast");
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ""}`;
    if (action) $("button", t).onclick = () => { action.fn(); t.classList.remove("on"); };
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 3600);
  }

  function bindChrome() {
    document.body.insertAdjacentHTML("afterbegin", header());
    document.body.insertAdjacentHTML("beforeend", footer());
    const hdr = $(".site-header");
    const onScroll = () => hdr.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const mb = $(".menu-btn");
    mb.addEventListener("click", () => {
      const open = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", open);
      mb.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-cart]")) { openCart(true); document.body.classList.remove("menu-open"); }
      if (e.target.closest("[data-close-cart]")) openCart(false);
      const q = e.target.closest(".qty button");
      if (q) { const key = q.parentElement.dataset.key; const i = cart.items.find((x) => x.key === key); cart.setQty(key, i.qty + Number(q.dataset.q)); }
      const rm = e.target.closest("[data-remove]");
      if (rm) cart.setQty(rm.dataset.remove, 0);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { openCart(false); closeLightbox(); document.body.classList.remove("menu-open"); }
    });
    renderCart();
  }

  // ---------- reveal on scroll ----------
  function reveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }

  // ---------- cards ----------
  function priceLabel(w) {
    if (w.price == null) return "On request";
    return (w.edition ? "" : "") + money(w.price);
  }
  function card(w) {
    const st = status(w);
    const tag = st.key === "ok" ? "" : `<span class="tag ${st.key}">${st.label}</span>`;
    return `
      <a class="card reveal" href="${workUrl(w)}">
        <div class="card-media${w.category === "painting" ? " is-painting" : ""}">
          ${ART.media(w)}
          ${tag ? `<div class="media-tags">${tag}</div>` : ""}
        </div>
        <div class="card-body">
          <div>
            <div class="card-title">${esc(w.title)}</div>
            <div class="card-meta mono">${esc(techName(w))} · ${w.year}${w.edition ? ` · Ed. ${w.edition.size}` : ""}</div>
          </div>
          <div class="card-price">${st.key === "sold" ? "Sold" : priceLabel(w)}</div>
        </div>
      </a>`;
  }

  // ---------- home ----------
  function initHome() {
    const prints = W.filter((w) => w.category === "print");
    const hero = prints.find((w) => w.featured && (w.images || w.image)) || prints.find((w) => w.featured) || prints[0];
    const press = $("#press");
    press.innerHTML = `
      <div class="press-bed">
        <span class="corner tl reg"><i></i></span><span class="corner tr reg"><i></i></span><span class="corner bl reg"><i></i></span><span class="corner br reg"><i></i></span>
        <a class="press-sheet" href="${workUrl(hero)}" aria-label="${esc(hero.title)}" style="display:block">
          <div class="press-print">${ART.media(hero, { eager: true, inscribe: false }).replace(/class="sheet[^"]*"/, 'class="press-media"')}</div>
          <div class="roller" aria-hidden="true"></div>
        </a>
      </div>
      <figcaption class="press-meta">
        <strong>${esc(hero.title)}</strong>
        <span class="mono">${esc(techName(hero))}, ${hero.year}</span>
        <span class="mono">${hero.edition ? `Edition of ${hero.edition.size}` : "Unique"}</span>
        <a class="link-arrow" href="${workUrl(hero)}">View the print</a>
      </figcaption>`;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { press.classList.add("go"); io.disconnect(); } }), { threshold: 0.3 });
      io.observe(press);
    } else press.classList.add("go");

    const real = W.filter((w) => w.images || w.image);
    const rest = prints.filter((w) => !real.includes(w)).sort((a, b) => (stock(b) > 0) - (stock(a) > 0));
    $("#featured").innerHTML = real.concat(rest).slice(0, 4).map(card).join("");

    $("#marquee").innerHTML = (() => {
      const words = ["Woodcut", "Cut by hand", "Drypoint", "Signed in pencil", "Monotype", "One of one", "Linocut", "Numbered editions", "Stockholm", "Patras"];
      const set = words.map((w) => `<span>${w}</span>`).join("");
      return `<div class="marquee-track" aria-hidden="true">${set}${set}</div>`;
    })();
  }

  // ---------- works ----------
  function initWorks() {
    const state = {
      category: params.get("category") || "all",
      technique: params.get("technique") || "all",
      available: params.get("available") === "1",
      sort: params.get("sort") || "newest"
    };
    if (state.technique !== "all" && !params.get("category")) {
      const w = W.find((x) => x.technique === state.technique);
      if (w && w.category === "painting") state.category = "painting";
    }

    const titles = {
      all: ["All works", "Prints, paintings, proofs and studies. Every print is inked and pulled by hand, in small numbered editions."],
      print: ["Prints", "Etchings, linocuts, woodcuts and monotypes, printed by hand in the studio in small numbered editions."],
      painting: ["Paintings", "Original paintings. Each one is unique."],
      proof: ["Proofs & studies", "Trial proofs, artist's proofs and working states. Outside the edition, often one of a kind."]
    };

    const catChips = $("#cat-chips"), techChips = $("#tech-chips");
    function render() {
      const [h, l] = titles[state.category] || titles.all;
      $("#works-title").textContent = h;
      $("#works-lede").textContent = l;
      document.title = `${h} — ${C.siteName}`;

      catChips.innerHTML = [["all", "All"]].concat(Object.entries(CAT).map(([k, v]) => [k, v.name]))
        .map(([k, n]) => `<button class="chip" type="button" data-cat="${k}" aria-pressed="${state.category === k}">${n}</button>`).join("");

      const pool = W.filter((w) => state.category === "all" || w.category === state.category);
      const techs = [...new Set(pool.map((w) => w.technique))];
      if (!techs.includes(state.technique)) state.technique = "all";
      techChips.innerHTML = techs.length > 1
        ? [["all", "Any technique"]].concat(techs.map((t) => [t, T[t].name]))
            .map(([k, n]) => `<button class="chip" type="button" data-tech="${k}" aria-pressed="${state.technique === k}">${n}</button>`).join("")
        : "";

      let list = pool.filter((w) => state.technique === "all" || w.technique === state.technique);
      if (state.available) list = list.filter((w) => stock(w) > 0);
      const sorters = {
        newest: (a, b) => b.year - a.year,
        "price-asc": (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9),
        "price-desc": (a, b) => (b.price ?? -1) - (a.price ?? -1),
        size: (a, b) => (b.imageSize ? b.imageSize[0] * b.imageSize[1] : 0) - (a.imageSize ? a.imageSize[0] * a.imageSize[1] : 0)
      };
      list = list.slice().sort(sorters[state.sort] || sorters.newest);

      const t = T[state.technique];
      $("#technique-note").innerHTML = t ? `<strong>${t.name}.</strong> ${esc(t.short)} ${t.look ? esc(t.look) : ""} <a href="process.html#techniques">More on techniques</a>` : "";
      $("#result-count").textContent = `${list.length} ${list.length === 1 ? "work" : "works"}`;
      $("#grid").innerHTML = list.length ? list.map(card).join("") : `<p class="empty">Nothing here right now. <a href="works.html">See all works</a></p>`;
      $("#avail").checked = state.available;
      $("#sort").value = state.sort;
      reveal();

      const q = new URLSearchParams();
      if (state.category !== "all") q.set("category", state.category);
      if (state.technique !== "all") q.set("technique", state.technique);
      if (state.available) q.set("available", "1");
      if (state.sort !== "newest") q.set("sort", state.sort);
      history.replaceState(null, "", "works.html" + (q.toString() ? "?" + q : ""));
      $$(".nav a").forEach((a) => {
        const u = new URL(a.href, location.href);
        const match = u.pathname.endsWith("works.html") && (u.searchParams.get("category") || "all") === state.category;
        if (match) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
    }

    catChips.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { state.category = b.dataset.cat; state.technique = "all"; render(); } });
    techChips.addEventListener("click", (e) => { const b = e.target.closest("[data-tech]"); if (b) { state.technique = b.dataset.tech; render(); } });
    $("#avail").addEventListener("change", (e) => { state.available = e.target.checked; render(); });
    $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
    render();
  }

  // ---------- work detail ----------
  function roomSVG(w, framed, aspect) {
    // Everything in cm. A 210 cm sofa gives the sense of scale.
    // The viewBox grows to the stage's shape so the wall fills it edge to edge.
    const size = w.category === "painting" || !w.sheetSize ? w.imageSize : w.sheetSize;
    const frame = framed ? 3 : 0;
    const aw = size[0] + frame * 2, ah = size[1] + frame * 2;
    const VW = 360, VH = 250, floor = 215;
    const sofaW = 210, sofaH = 82, sofaX = (VW - sofaW) / 2;
    const ax = (VW - aw) / 2;
    const ay = Math.min(floor - sofaH - 22 - ah, 150 - ah / 2);
    const inner = w.image
      ? `<image href="${esc(w.image)}" x="${ax + frame}" y="${ay + frame}" width="${size[0]}" height="${size[1]}" preserveAspectRatio="xMidYMid slice"/>`
      : ART.svg(w, { inscribe: false }).replace("<svg ", `<svg x="${ax + frame}" y="${ay + frame}" width="${size[0]}" height="${size[1]}" preserveAspectRatio="none" `);
    let vx = 0, vy = 0, vw = VW, vh = VH;
    if (aspect) {
      if (VW / aspect > VH) { vh = VW / aspect; vy = VH - vh; }
      else { vw = VH * aspect; vx = (VW - vw) / 2; }
    }
    return `
      <svg viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(w.title)} shown to scale above a 210 cm sofa">
        <rect x="-2000" y="-2000" width="4400" height="${2000 + floor}" fill="#e6dfd1"/>
        <rect x="-2000" y="${floor}" width="4400" height="2000" fill="#cfc4b1"/>
        <rect x="-2000" y="${floor - 1}" width="4400" height="1.2" fill="#bfb39e"/>
        <rect x="${ax + 1.5}" y="${ay + 2.5}" width="${aw}" height="${ah}" fill="#000" opacity=".12" filter="blur(2px)"/>
        ${framed ? `<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="#a88a63"/>` : ""}
        ${inner}
        <g fill="#b9ad98">
          <rect x="${sofaX}" y="${floor - sofaH}" width="${sofaW}" height="${sofaH - 40}" rx="6"/>
          <rect x="${sofaX - 8}" y="${floor - 52}" width="${sofaW + 16}" height="40" rx="6"/>
          <rect x="${sofaX - 10}" y="${floor - 60}" width="20" height="50" rx="6"/>
          <rect x="${sofaX + sofaW - 10}" y="${floor - 60}" width="20" height="50" rx="6"/>
          <rect x="${sofaX + 6}" y="${floor - 12}" width="4" height="12"/><rect x="${sofaX + sofaW - 10}" y="${floor - 12}" width="4" height="12"/>
        </g>
        <g font-family="IBM Plex Mono, monospace" font-size="5" fill="#6f6859" letter-spacing=".4">
          <text x="${VW / 2}" y="${ay - 6}" text-anchor="middle">${size[0]} × ${size[1]} cm${framed ? " + frame" : ""}</text>
          <text x="${VW / 2}" y="${VH - 12}" text-anchor="middle">Sofa 210 cm wide</text>
        </g>
      </svg>`;
  }

  let lightbox;
  function openLightbox(w, cx, cy) {
    if (!lightbox) {
      document.body.insertAdjacentHTML("beforeend", `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Zoomed view"><button class="lightbox-close" type="button">Close</button><div class="lightbox-inner fit"></div><div class="lightbox-hint mono">Tap to zoom · drag to move</div></div>`);
      lightbox = $(".lightbox");
      $(".lightbox-close").onclick = closeLightbox;
      $(".lightbox-inner", lightbox).addEventListener("click", (e) => {
        const target = e.target.closest(".sheet, .canvas-work");
        if (!target) { if (!lightbox.classList.contains("zoomed")) closeLightbox(); return; }
        const r = target.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        zoomTo(!lightbox.classList.contains("zoomed"), fx, fy);
      });
    }
    const inner = $(".lightbox-inner", lightbox);
    inner.style.setProperty("--r", ART.ratio(w));
    inner.innerHTML = ART.media(w, { eager: true });
    lightbox.classList.add("on");
    document.body.style.overflow = "hidden";
    if (cx != null) zoomTo(true, cx, cy); else lightbox.classList.remove("zoomed");
    $(".lightbox-close").focus();
  }
  function zoomTo(on, fx, fy) {
    lightbox.classList.toggle("zoomed", on);
    if (!on) return;
    const t = $(".lightbox-inner > *", lightbox);
    requestAnimationFrame(() => {
      lightbox.scrollTo(t.offsetLeft + t.offsetWidth * fx - innerWidth / 2, t.offsetTop + t.offsetHeight * fy - innerHeight / 2);
    });
  }
  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains("on")) return;
    lightbox.classList.remove("on", "zoomed");
    document.body.style.overflow = "";
  }

  function loupe(stage) {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const lens = document.createElement("div");
    lens.className = "loupe";
    lens.innerHTML = `<div class="loupe-inner"></div>`;
    stage.appendChild(lens);
    const inner = lens.firstChild, Z = 3, R = 110;
    let src;
    stage.addEventListener("mouseenter", () => {
      src = $(".sheet, .canvas-work", stage);
      if (!src) return;
      inner.innerHTML = "";
      const clone = src.cloneNode(true);
      clone.style.width = src.offsetWidth * Z + "px";
      clone.style.transition = "none";
      inner.appendChild(clone);
    });
    stage.addEventListener("mousemove", (e) => {
      if (!src || stage.classList.contains("room-mode") || stage.classList.contains("block-mode")) { lens.classList.remove("on"); return; }
      const r = src.getBoundingClientRect(), s = stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      lens.classList.toggle("on", inside);
      lens.style.left = e.clientX - s.left - R + "px";
      lens.style.top = e.clientY - s.top - R + "px";
      inner.style.transform = `translate(${R - x * Z}px, ${R - y * Z}px)`;
    });
    stage.addEventListener("mouseleave", () => lens.classList.remove("on"));
  }

  function initWork() {
    const w = byId(params.get("id")) || W[0];
    document.title = `${w.title} — ${C.siteName}`;
    const st = status(w);
    const cat = CAT[w.category];
    const t = T[w.technique] || { name: w.technique, short: "" };
    const sold = st.key === "sold";
    const canBuy = buyable(w);
    const hasBlock = !!(w.images || w.image) && T[w.technique] && T[w.technique].family === "Relief";

    const specs = [
      ["Technique", `<abbr title="${esc(t.short)}">${esc(t.name)}</abbr>${t.family && t.family !== "Painting" ? ` <span class="mono">· ${t.family}</span>` : ""}`],
      w.imageSize ? [w.category === "painting" ? "Size" : "Image", cm(w.imageSize)] : null,
      w.sheetSize ? ["Sheet", cm(w.sheetSize)] : null,
      w.paper ? [w.category === "painting" ? "Support" : "Paper", esc(w.paper)] : null,
      ["Edition", w.edition ? `${w.edition.size} impressions` : w.category === "proof" ? "Outside the edition, unique" : "Unique"],
      ["Year", w.year],
      w.category !== "painting" ? ["Signed", `Signed, titled and ${w.edition ? "numbered" : "inscribed"} in pencil`] : null
    ].filter(Boolean);

    const tally = w.edition
      ? `<div class="edition">
          <div class="edition-head"><span class="mono">Edition of ${w.edition.size}</span><span class="mono">${w.edition.available == null ? "Ask for availability" : `${w.edition.available} available`}</span></div>
          <div class="tally anim" aria-hidden="true">${Array.from({ length: w.edition.size }, (_, i) => `<i class="${i < w.edition.size - (w.edition.available ?? w.edition.size) ? "sold" : ""}" style="animation-delay:${i * 18}ms"></i>`).join("")}</div>
        </div>`
      : "";

    const options = canBuy && w.frameable
      ? `<div class="options" role="radiogroup" aria-label="Framing">
          <label class="option"><span><input type="radio" name="frame" value="0" checked>Unframed</span><span class="mono">${money(w.price)}</span></label>
          <label class="option"><span><input type="radio" name="frame" value="1">Framed, natural wood, glazed</span><span class="mono">+ ${money(C.framingPrice)}</span></label>
        </div>`
      : "";

    const askBody = `Hello ${C.artist},\n\nI'm interested in "${w.title}" (${t.name}, ${w.year}).\n\n`;
    let actions;
    if (canBuy) actions = `<button class="btn block" type="button" id="add">Add to cart</button><a class="btn ghost block" href="${mailto(`About: ${w.title}`, askBody)}">Ask a question</a>`;
    else if (sold) actions = `<a class="btn block" href="${mailto(`Waitlist: ${w.title}`, askBody + "Please let me know if an impression becomes available, or about similar works.\n")}">Ask about similar works</a>`;
    else actions = `<a class="btn block" href="${mailto(`Price enquiry: ${w.title}`, askBody)}">Enquire about price</a>`;

    $("#work").innerHTML = `
      <div class="wrap">
        <div class="crumbs mono"><a href="works.html?category=${w.category}">${cat.name}</a> / <a href="works.html?technique=${w.technique}">${esc(t.name)}</a></div>
        <div class="work-grid">
          <div class="viewer">
            <div class="stage fit${ART.ratio(w) > 1.6 ? " wide" : ""}" id="stage" style="--r:${ART.ratio(w)}">${ART.media(w, { eager: true })}${hasBlock ? `<div class="blockview" aria-label="The block, mirrored (illustration)"><div class="flip">${w.images ? `<div class="strip">${w.images.map((src) => `<img src="${esc(src)}" alt="">`).join("")}</div>` : `<img src="${esc(w.image)}" alt="">`}</div></div>` : ""}<div class="room"></div></div>
            <div class="viewer-tools">
              <div class="seg"${w.imageSize || hasBlock ? "" : " hidden"} role="group" aria-label="View">
                <button type="button" data-view="art" aria-pressed="true">Artwork</button>
                ${hasBlock ? `<button type="button" data-view="block" aria-pressed="false">The block</button>` : ""}
                ${w.imageSize ? `<button type="button" data-view="room" aria-pressed="false">To scale</button>` : ""}
              </div>
              <span class="hint" id="hint"></span>
            </div>
          </div>
          <div class="work-info">
            <span class="eyebrow">${cat.singular} · ${esc(t.name)}</span>
            <h1>${esc(w.title)}</h1>
            <div class="sub mono">${esc(t.name)}, ${w.year}${w.imageSize ? ` · ${cm(w.imageSize)}` : ""}</div>
            <div class="price-row">
              <span class="price" id="price">${sold ? "Sold" : w.price == null ? "Price on request" : money(w.price)}</span>
              <span class="tag ${st.key === "ok" ? "" : st.key}">${st.key === "ok" ? (w.edition ? "In stock" : "Available") : st.label}</span>
            </div>
            ${tally}
            ${options}
            <div class="buy-actions">${actions}</div>
            <p class="desc">${esc(w.description)}</p>
            <dl class="specs">${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
            <div class="notes">
              ${w.category !== "painting" ? `<p>${isIntaglio(w) ? "Printed from the plate on a hand-turned etching press. Look for the plate mark pressed into the paper around the image." : t.family === "Relief" ? "Printed from the carved block. Small variations in inking make each impression slightly different." : "A single impression from a painted plate. It cannot be repeated."}</p>` : ""}
              <p>Shipped ${w.category === "painting" ? "wrapped and boxed" : "flat between boards, or rolled for large sheets"}. Shipping is quoted with your order.</p>
              ${w.imageSize ? `<p>Not sure about size? Switch to “To scale” to see it above a sofa.</p>` : ""}
            </div>
          </div>
        </div>
      </div>`;

    const stage = $("#stage");
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hint = $("#hint");
    hint.textContent = fine ? "Hover to look closer · click to enlarge" : "Tap to enlarge";
    loupe(stage);
    stage.addEventListener("click", (e) => {
      if (stage.classList.contains("room-mode") || stage.classList.contains("block-mode")) return;
      const src = $(".sheet, .canvas-work", stage);
      const r = src.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (fine && inside) openLightbox(w, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      else openLightbox(w);
    });

    const framedNow = () => { const el = $('input[name="frame"]:checked'); return !!(el && el.value === "1"); };
    const room = $(".room", stage);
    function setView(v) {
      const isRoom = v === "room";
      $$("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
      stage.classList.toggle("block-mode", v === "block");
      stage.classList.toggle("room-mode", isRoom);
      room.classList.toggle("on", isRoom);
      $(".sheet, .canvas-work", stage).style.display = isRoom ? "none" : "";
      if (isRoom) room.innerHTML = roomSVG(w, framedNow(), stage.clientWidth / stage.clientHeight);
      hint.textContent = isRoom ? "Shown to scale" : v === "block" ? "The block: mirrored, inked on the uncut surface (illustration)" : fine ? "Hover to look closer · click to enlarge" : "Tap to enlarge";
    }
    $$("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

    $$('input[name="frame"]').forEach((r) => r.addEventListener("change", () => {
      $("#price").textContent = money(w.price + (framedNow() ? C.framingPrice : 0));
      if (stage.classList.contains("room-mode")) room.innerHTML = roomSVG(w, framedNow(), stage.clientWidth / stage.clientHeight);
    }));

    const add = $("#add");
    if (add) add.addEventListener("click", () => {
      if (cart.add(w.id, framedNow())) {
        $(".cart-btn").classList.remove("bump"); void $(".cart-btn").offsetWidth; $(".cart-btn").classList.add("bump");
        toast(`${w.title} added to cart`, { label: "View cart", fn: () => openCart(true) });
      }
    });

    const related = W.filter((x) => x !== w && (x.technique === w.technique || x.category === w.category))
      .sort((a, b) => (b.technique === w.technique) - (a.technique === w.technique)).slice(0, 4);
    if (related.length) {
      $("#related").innerHTML = `
        <div class="wrap">
          <div class="section-head"><h2>More ${w.category === "painting" ? "paintings" : "to look at"}</h2><a class="link-arrow" href="works.html?category=${w.category}">All ${cat.name.toLowerCase()}</a></div>
          <div class="grid cols-4">${related.map(card).join("")}</div>
        </div>`;
    }
  }

  // ---------- process ----------
  function initProcess() {
    const demo = W.find((w) => w.technique === "etching" && w.edition) ||
      { title: "Untitled", category: "print", technique: "etching", imageSize: [20, 28], sheetSize: [35, 45], edition: { size: 20, available: 13 }, art: { seed: 11 } };
    const fig = $("#anatomy-fig");
    fig.innerHTML = ART.media(demo);
    // geometry mirrors art.js so pins land on the right spots (as % of the sheet)
    const [SW, SH] = demo.sheetSize.map((v) => v * 10), [IW, IH] = demo.imageSize.map((v) => v * 10);
    const ix = (SW - IW) / 2, iy = Math.max((SH - IH) * 0.42, 10);
    const ty = iy + IH + Math.min(14, (SH - iy - IH) * 0.45) + 6;
    const m = Math.min(IW, IH) * 0.035 + 4;
    const pins = [
      [ix + IW * 0.5, iy + IH * 0.4],
      [ix - m, iy + IH * 0.7],
      [ix + 8, ty - 10],
      [SW / 2, ty - 10],
      [ix + IW - 20, ty - 12],
      [SW - (SW - IW - 2 * m) / 4, iy + IH * 0.15]
    ];
    fig.insertAdjacentHTML("beforeend", pins.map(([x, y], i) => `<button class="pin" type="button" data-pin="${i}" style="left:${(x / SW) * 100}%;top:${(y / SH) * 100}%" aria-label="Point ${i + 1}">${i + 1}</button>`).join(""));
    const items = $$("#anatomy-list li");
    const hl = (i) => {
      $$(".pin", fig).forEach((p) => p.classList.toggle("on", p.dataset.pin == i));
      items.forEach((li, k) => li.classList.toggle("on", k == i));
    };
    fig.addEventListener("mouseover", (e) => { const p = e.target.closest(".pin"); if (p) hl(p.dataset.pin); });
    fig.addEventListener("click", (e) => { const p = e.target.closest(".pin"); if (p) hl(p.dataset.pin); });
    items.forEach((li, i) => li.addEventListener("mouseenter", () => hl(i)));

    const techs = ["etching", "drypoint", "aquatint", "linocut", "woodcut", "monotype"];
    $("#tech-list").innerHTML = techs.map((k, n) => {
      const t = T[k];
      const sample = W.find((w) => w.technique === k) ||
        { title: t.name, category: "print", technique: k, imageSize: [20, 24], sheetSize: [28, 34], art: { seed: 30 + n } };
      const count = W.filter((w) => w.technique === k).length;
      return `
        <a class="tech reveal" id="t-${k}" href="works.html?technique=${k}">
          <div class="art fit" style="--r:${ART.ratio(sample)}">${ART.media(sample, { inscribe: false })}</div>
          <h3>${t.name}</h3>
          <span class="mono">${t.family}${count ? ` · ${count} ${count === 1 ? "work" : "works"}` : ""}</span>
          <p>${esc(t.short)}</p>
          <p>${esc(t.look)}</p>
        </a>`;
    }).join("");
  }

  // ---------- about ----------
  function initAbout() {
    const f = $("#contact-form");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(f);
      const body = `${d.get("message")}\n\n${d.get("name")}\n${d.get("email")}`;
      send(f, { type: d.get("topic"), name: d.get("name"), email: d.get("email"), message: d.get("message") }, mailto(`${d.get("topic")} — ${d.get("name")}`, body), $("#contact-status"));
    });
  }

  // ---------- checkout ----------
  function renderCheckout() {
    const box = $("#summary");
    if (!box) return;
    if (!cart.items.length) {
      box.innerHTML = `<h2>Your order</h2><p class="small">Your cart is empty.</p><a class="link-arrow" href="works.html?category=print">Browse prints</a>`;
      $("#order-form button[type=submit]").disabled = true;
      return;
    }
    $("#order-form button[type=submit]").disabled = false;
    box.innerHTML = `
      <h2>Your order</h2>
      ${cart.items.map((i) => lineHTML(i, true)).join("")}
      <div class="total-row" style="margin-top:20px"><span>Subtotal</span><strong>${money(cart.total())}</strong></div>
      <p class="small">Plus shipping, quoted by email.</p>`;
  }

  function send(form, data, fallbackMailto, statusEl) {
    const done = (msg) => { statusEl.innerHTML = msg; statusEl.classList.add("on"); statusEl.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
    if (!C.formEndpoint) {
      location.href = fallbackMailto;
      done(`Your email app should open with the message ready to send. If it doesn't, write to <a href="mailto:${esc(C.email)}">${esc(C.email)}</a>.`);
      return Promise.resolve(false);
    }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    return fetch(C.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
      .then((r) => { if (!r.ok) throw new Error(); done("Thank you. Your message is on its way — you'll hear back by email."); form.reset(); return true; })
      .catch(() => { done(`Something went wrong. Please write to <a href="${fallbackMailto}">${esc(C.email)}</a> instead.`); return false; })
      .finally(() => { btn.disabled = false; });
  }

  function initCheckout() {
    renderCheckout();
    const f = $("#order-form");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!cart.items.length) return;
      const d = Object.fromEntries(new FormData(f));
      const lines = cart.items.map((i) => {
        const w = byId(i.id);
        return `- ${w.title} (${techName(w)}${i.framed ? ", framed" : ""}) × ${i.qty} — ${money(cart.unit(i) * i.qty)}`;
      });
      const body = [
        `Order request`, ``, ...lines, ``, `Subtotal: ${money(cart.total())}`, ``,
        `Name: ${d.name}`, `Email: ${d.email}`, `Phone: ${d.phone || "-"}`,
        `Ship to: ${d.address}, ${d.city} ${d.postcode}, ${d.country}`, ``, d.notes ? `Notes: ${d.notes}` : ""
      ].join("\n");
      send(f, { ...d, items: lines, subtotal: cart.total() }, mailto(`Order request — ${d.name}`, body), $("#order-status"))
        .then((ok) => { if (ok) cart.clear(); });
    });
  }

  // ---------- boot ----------
  bindChrome();
  ({ home: initHome, works: initWorks, work: initWork, process: initProcess, about: initAbout, checkout: initCheckout }[page] || (() => {}))();
  reveal();
})();
