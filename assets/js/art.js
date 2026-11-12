/*
  Placeholder artwork generator.
  Draws a stand-in image per technique so the layout can be judged before the
  real photographs arrive. Prints are drawn as a full sheet: paper margins,
  plate mark for intaglio, and pencil inscriptions (edition, title, signature).
  Once a work has `image` set, the photo is used and none of this runs.
*/
(function () {
  const INK = {
    black: "#1d1b18",
    sepia: "#4a2f1e",
    red: "#a9342a",
    blue: "#22395a"
  };
  const PAINT = {
    earth: ["#b8572f", "#d9b47a", "#3c3a33", "#8a6b45", "#e9dcc3"],
    sea: ["#2e4d63", "#7fa1ad", "#d8d2c2", "#c46c3e", "#1f2f3a"]
  };
  const SHEET = "#faf7f0";
  const PENCIL = "#8d877c";
  let uid = 0;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function wave(r, x, y, w, amp, freq, phase, steps) {
    let d = `M${f(x)} ${f(y)}`;
    const n = steps || 24;
    for (let i = 1; i <= n; i++) {
      const px = x + (w * i) / n;
      const py = y + Math.sin(phase + (i / n) * freq * Math.PI * 2) * amp + (r() - 0.5) * amp * 0.25;
      d += ` L${f(px)} ${f(py)}`;
    }
    return d;
  }

  function hillPath(r, x, y, w, h, base) {
    const n = 40, p1 = r() * 6, p2 = r() * 6, k1 = 1 + r() * 1.5, k2 = 3 + r() * 3;
    let d = `M${f(x)} ${f(y + h)}`;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const lift = (0.55 + 0.45 * Math.sin(p1 + t * Math.PI * k1)) * 0.75 + (0.5 + 0.5 * Math.sin(p2 + t * Math.PI * k2)) * 0.25;
      d += ` L${f(x + w * t)} ${f(y + base - lift * h * 0.22)}`;
    }
    return d + ` L${f(x + w)} ${f(y + h)} Z`;
  }

  // ---------- techniques ----------
  function etching(r, x, y, w, h, ink, id) {
    const s = w / 200; // scale
    let out = "";
    const horizon = h * (0.45 + r() * 0.15);
    // sky: sparse horizontal hatching
    let sky = "";
    for (let yy = 4 * s; yy < horizon; yy += (3 + r() * 3) * s) {
      const x0 = x + r() * w * 0.3;
      const ww = w * (0.3 + r() * 0.6);
      sky += wave(r, x0, y + yy, Math.min(ww, x + w - x0), 0.6 * s, 1 + r(), r() * 6, 16) + " ";
    }
    out += `<path d="${sky}" fill="none" stroke="${ink}" stroke-width="${f(0.35 * s)}" opacity=".55"/>`;
    // sun
    const cx = x + w * (0.2 + r() * 0.6), cy = y + horizon * (0.35 + r() * 0.3), rad = w * (0.07 + r() * 0.05);
    for (let i = 0; i < 9; i++) out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad + i * 1.6 * s)}" fill="none" stroke="${ink}" stroke-width="${f(0.3 * s)}" opacity="${f(0.75 - i * 0.07)}"/>`;
    // land: dense waves
    let land = "";
    for (let yy = horizon; yy < h; yy += (1.1 + ((yy - horizon) / h) * 1.4) * s) {
      land += wave(r, x, y + yy, w, (0.8 + r()) * s, 1.5 + r() * 2, yy * 0.1, 28) + " ";
    }
    out += `<path d="${land}" fill="none" stroke="${ink}" stroke-width="${f(0.4 * s)}"/>`;
    // hill with cross-hatching
    const hp = hillPath(r, x, y, w, h, horizon + 2 * s);
    out += `<clipPath id="h${id}"><path d="${hp}"/></clipPath><g clip-path="url(#h${id})">`;
    let hatch = "";
    for (let k = -h; k < w; k += 1.6 * s) hatch += `M${f(x + k)} ${f(y + h)} L${f(x + k + h)} ${f(y)} `;
    for (let k = 0; k < w + h; k += 2.4 * s) hatch += `M${f(x + k)} ${f(y + h)} L${f(x + k - h)} ${f(y)} `;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${SHEET}"/><path d="${hatch}" stroke="${ink}" stroke-width="${f(0.32 * s)}"/></g>`;
    out += `<path d="${hp}" fill="none" stroke="${ink}" stroke-width="${f(0.6 * s)}"/>`;
    return out;
  }

  function drypoint(r, x, y, w, h, ink, id) {
    const s = w / 200;
    let out = `<filter id="b${id}"><feGaussianBlur stdDeviation="${f(0.35 * s)}"/></filter>`;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ink}" opacity=".05"/>`;
    let lines = "";
    // tall grasses / branches
    const n = 30 + Math.floor(r() * 20);
    for (let i = 0; i < n; i++) {
      let px = x + r() * w, py = y + h * (0.98 - r() * 0.05);
      let d = `M${f(px)} ${f(py)}`;
      const len = h * (0.3 + r() * 0.6), segs = 8, lean = (r() - 0.5) * 0.6;
      for (let k = 0; k < segs; k++) {
        px += lean * (len / segs) + (r() - 0.5) * 3 * s;
        py -= len / segs;
        d += ` L${f(px)} ${f(py)}`;
      }
      lines += d + " ";
    }
    out += `<g filter="url(#b${id})"><path d="${lines}" fill="none" stroke="${ink}" stroke-width="${f(1.1 * s)}" opacity=".5"/></g>`;
    out += `<path d="${lines}" fill="none" stroke="${ink}" stroke-width="${f(0.45 * s)}" stroke-linecap="round"/>`;
    // a bird
    const bx = x + w * (0.25 + r() * 0.5), by = y + h * 0.18;
    out += `<path d="M${f(bx - 8 * s)} ${f(by)} q${f(4 * s)} ${f(-4 * s)} ${f(8 * s)} 0 q${f(4 * s)} ${f(-4 * s)} ${f(8 * s)} 0" fill="none" stroke="${ink}" stroke-width="${f(0.6 * s)}"/>`;
    return out;
  }

  function aquatint(r, x, y, w, h, ink, id) {
    const s = w / 200;
    let out = `<filter id="g${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${f(1.8 / s) / 10}" numOctaves="2" seed="${id}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6"/><feComposite in="SourceGraphic" operator="in"/></filter>`;
    let bands = "";
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const top = h * (0.25 + (i / n) * 0.7) + (r() - 0.5) * 10 * s;
      bands += `<path d="${hillPath(r, x, y, w, h, top)}" fill="${ink}" opacity="${f(0.18 + i * 0.12)}"/>`;
    }
    bands += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.6}" fill="${ink}" opacity=".12"/>`;
    const mx = x + w * (0.3 + r() * 0.4), my = y + h * 0.28;
    bands += `<circle cx="${f(mx)}" cy="${f(my)}" r="${f(w * 0.09)}" fill="${SHEET}"/>`;
    out += `<g filter="url(#g${id})">${bands}</g>`;
    return out;
  }

  function linocut(r, x, y, w, h, ink, id) {
    const s = w / 200;
    let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ink}"/>`;
    const cx = x + w * (0.3 + r() * 0.4), cy = y + h * (0.3 + r() * 0.2);
    const R = Math.min(w, h) * (0.16 + r() * 0.06);
    out += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="${SHEET}"/>`;
    // rays of gouge marks around the circle
    let g = "";
    const rays = 60;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + r() * 0.05;
      const r0 = R * 1.25 + r() * 4 * s, r1 = r0 + (6 + r() * 14) * s;
      g += `M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)} L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)} `;
    }
    out += `<path d="${g}" stroke="${SHEET}" stroke-width="${f(1.6 * s)}" stroke-linecap="round"/>`;
    // water: carved wavy strokes with varying width
    const top = cy + R * 1.9;
    let wv = "";
    for (let yy = top; yy < y + h - 4 * s; yy += (4 + r() * 3) * s) {
      let xx = x + r() * 10 * s;
      while (xx < x + w - 6 * s) {
        const len = (14 + r() * 30) * s;
        const L = Math.min(len, x + w - 4 * s - xx);
        wv += `M${f(xx)} ${f(yy)} q${f(L / 2)} ${f(-(2 + r() * 2) * s)} ${f(L)} 0 `;
        xx += L + (4 + r() * 8) * s;
      }
    }
    out += `<path d="${wv}" fill="none" stroke="${SHEET}" stroke-width="${f(1.4 * s)}" stroke-linecap="round"/>`;
    // horizon line cut
    out += `<rect x="${x}" y="${f(top - 6 * s)}" width="${w}" height="${f(1.2 * s)}" fill="${SHEET}"/>`;
    // uneven inking texture
    out += `<filter id="t${id}"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="3" seed="${id}"/><feColorMatrix values="0 0 0 0 .98  0 0 0 0 .97  0 0 0 0 .94  0 0 0 -1.6 .9"/></filter>`;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#t${id})" opacity=".35"/>`;
    return out;
  }

  function woodcut(r, x, y, w, h, ink, id) {
    const s = w / 200;
    let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ink}"/>`;
    // wood grain
    let grain = "";
    for (let xx = x + 2 * s; xx < x + w; xx += (1.6 + r() * 2.2) * s) {
      let d = `M${f(xx)} ${f(y)}`;
      const n = 20, amp = (0.6 + r() * 1.4) * s, ph = r() * 6;
      for (let i = 1; i <= n; i++) d += ` L${f(xx + Math.sin(ph + i * 0.7) * amp)} ${f(y + (h * i) / n)}`;
      grain += d + " ";
    }
    out += `<path d="${grain}" fill="none" stroke="${SHEET}" stroke-width="${f(0.35 * s)}" opacity=".45"/>`;
    // tree / figure shapes carved out
    const trunks = 3 + Math.floor(r() * 3);
    for (let i = 0; i < trunks; i++) {
      const tx = x + w * ((i + 0.5) / trunks) + (r() - 0.5) * 12 * s;
      const tw = (5 + r() * 6) * s, ty = y + h * (0.15 + r() * 0.25);
      out += `<path d="M${f(tx - tw / 2)} ${f(y + h)} L${f(tx - tw * 0.3)} ${f(ty)} L${f(tx + tw * 0.3)} ${f(ty)} L${f(tx + tw / 2)} ${f(y + h)} Z" fill="${SHEET}"/>`;
      let br = "";
      for (let k = 0; k < 6; k++) {
        const by = ty + (h * 0.5 * k) / 6, dir = k % 2 ? 1 : -1;
        br += `M${f(tx)} ${f(by)} q${f(dir * 10 * s)} ${f(-6 * s)} ${f(dir * (18 + r() * 14) * s)} ${f(-(10 + r() * 8) * s)} `;
      }
      out += `<path d="${br}" fill="none" stroke="${SHEET}" stroke-width="${f(2.2 * s)}" stroke-linecap="round"/>`;
    }
    out += `<rect x="${x}" y="${f(y + h * 0.9)}" width="${w}" height="${f(h * 0.1)}" fill="${ink}"/>`;
    return out;
  }

  function monotype(r, x, y, w, h, ink, id) {
    const s = w / 200;
    let out = `<filter id="m${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="3" seed="${id}"/><feDisplacementMap in="SourceGraphic" scale="${f(26 * s)}"/><feGaussianBlur stdDeviation="${f(1.2 * s)}"/></filter>`;
    let blobs = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ink}" opacity=".12"/>`;
    for (let i = 0; i < 7; i++) {
      blobs += `<ellipse cx="${f(x + r() * w)}" cy="${f(y + r() * h)}" rx="${f(w * (0.1 + r() * 0.25))}" ry="${f(h * (0.06 + r() * 0.18))}" fill="${ink}" opacity="${f(0.25 + r() * 0.5)}"/>`;
    }
    blobs += `<ellipse cx="${f(x + w * 0.5)}" cy="${f(y + h * 0.4)}" rx="${f(w * 0.16)}" ry="${f(w * 0.16)}" fill="${SHEET}" opacity=".85"/>`;
    out += `<clipPath id="c${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#c${id})"><g filter="url(#m${id})">${blobs}</g></g>`;
    return out;
  }

  function painting(r, x, y, w, h, palette, id) {
    const c = PAINT[palette] || PAINT.earth;
    let out = `<filter id="p${id}"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="${id}"/><feDisplacementMap in="SourceGraphic" scale="${f(w * 0.05)}"/></filter>`;
    out += `<filter id="q${id}"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="${id}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .12 0"/></filter>`;
    let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c[4]}"/>`;
    let yy = y + h * 0.05;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const hh = h * (0.18 + r() * 0.2);
      g += `<rect x="${f(x + w * 0.07)}" y="${f(yy)}" width="${f(w * 0.86)}" height="${f(hh)}" fill="${c[i % 4]}" opacity=".92"/>`;
      yy += hh + h * 0.05;
    }
    g += `<circle cx="${f(x + w * (0.3 + r() * 0.4))}" cy="${f(y + h * (0.3 + r() * 0.4))}" r="${f(w * 0.08)}" fill="${c[3]}"/>`;
    out += `<g filter="url(#p${id})">${g}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#q${id})"/>`;
    return out;
  }

  const DRAW = { etching, drypoint, aquatint, linocut, woodcut, monotype };
  const INTAGLIO = { etching: 1, drypoint: 1, aquatint: 1 };

  function inscription(work) {
    if (work.category === "proof") return /artist/i.test(work.title) ? "A.P." : "T.P.";
    if (!work.edition) return "1/1";
    const n = Math.max(1, work.edition.size - work.edition.available + 1);
    return `${Math.min(n, work.edition.size)}/${work.edition.size}`;
  }

  function svg(work, opts) {
    opts = opts || {};
    const id = ++uid;
    const r = rng((work.art && work.art.seed) || 1);
    const label = esc(work.title);

    if (work.category === "painting") {
      const [W, H] = work.imageSize.map((v) => v * 10);
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${painting(r, 0, 0, W, H, work.art && work.art.palette, id)}</svg>`;
    }

    const [SW, SH] = (work.sheetSize || work.imageSize.map((v) => v * 1.4)).map((v) => v * 10);
    const [IW, IH] = work.imageSize.map((v) => v * 10);
    const ix = (SW - IW) / 2;
    const iy = Math.max((SH - IH) * 0.42, 10);
    const ink = INK[(work.art && work.art.palette) || "black"] || INK.black;
    let body = `<rect width="${SW}" height="${SH}" fill="${SHEET}"/>`;

    if (INTAGLIO[work.technique]) {
      const m = Math.min(IW, IH) * 0.035 + 4;
      body += `<rect x="${f(ix - m)}" y="${f(iy - m)}" width="${f(IW + m * 2)}" height="${f(IH + m * 2)}" fill="${ink}" opacity=".035"/>`;
      body += `<rect x="${f(ix - m + 0.6)}" y="${f(iy - m + 0.6)}" width="${f(IW + m * 2)}" height="${f(IH + m * 2)}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".9"/>`;
      body += `<rect x="${f(ix - m)}" y="${f(iy - m)}" width="${f(IW + m * 2)}" height="${f(IH + m * 2)}" fill="none" stroke="#b9b1a0" stroke-width=".9"/>`;
    }
    body += `<clipPath id="i${id}"><rect x="${f(ix)}" y="${f(iy)}" width="${f(IW)}" height="${f(IH)}"/></clipPath>`;
    body += `<g clip-path="url(#i${id})">${(DRAW[work.technique] || etching)(r, ix, iy, IW, IH, ink, id)}</g>`;

    if (opts.inscribe !== false) {
      const ty = iy + IH + Math.min(14, (SH - iy - IH) * 0.45) + 6;
      const fs = Math.max(6, Math.min(11, SW / 42));
      const pencil = `fill="${PENCIL}" font-size="${f(fs)}"`;
      body += `<text x="${f(ix)}" y="${f(ty)}" ${pencil} font-family="Georgia, serif">${inscription(work)}</text>`;
      body += `<text x="${f(SW / 2)}" y="${f(ty)}" ${pencil} font-family="Georgia, serif" font-style="italic" text-anchor="middle">${label}</text>`;
      body += `<path d="M${f(ix + IW - fs * 4.5)} ${f(ty - fs * 0.2)} c${f(fs * 0.6)} ${f(-fs * 1.2)} ${f(fs * 1)} ${f(-fs * 0.2)} ${f(fs * 0.9)} ${f(fs * 0.2)} s${f(fs * 0.4)} ${f(-fs * 0.9)} ${f(fs * 1)} ${f(-fs * 0.3)} s${f(fs * 0.3)} ${f(fs * 0.4)} ${f(fs * 0.8)} ${f(-fs * 0.2)} s${f(fs * 0.6)} ${f(-fs * 0.1)} ${f(fs * 1.6)} ${f(-fs * 0.6)}" fill="none" stroke="${PENCIL}" stroke-width="${f(fs * 0.09)}" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 ${f(SW)} ${f(SH)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${body}</svg>`;
  }

  // Returns the HTML for a work's visual, photo or placeholder.
  function media(work, opts) {
    opts = opts || {};
    const cls = work.category === "painting" ? "canvas-work" : "sheet";
    if (work.image) {
      return `<div class="${cls} photo"><img src="${esc(work.image)}" alt="${esc(work.title)}" loading="${opts.eager ? "eager" : "lazy"}" decoding="async"></div>`;
    }
    return `<div class="${cls}">${svg(work, opts)}</div>`;
  }

  // Aspect ratio of the full visual (sheet for prints, canvas for paintings).
  function ratio(work) {
    const s = work.category === "painting" || !work.sheetSize ? work.imageSize : work.sheetSize;
    return s[0] / s[1];
  }

  window.AP_ART = { svg, media, ratio, inscription };
})();
