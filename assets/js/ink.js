/*
  "Ink the block" — WebGL hero.
  The featured relief print is shown as its woodblock: mirrored, carved, lit in relief
  by a light that follows the pointer. Moving across it rolls ink onto the uncut surface.
  "Pull a print" peels the block away to show the impression you inked.
  Plain WebGL 1, no libraries. Falls back to the static press if WebGL is missing.
*/
(function () {
  const host = document.getElementById("press");
  const W = window.AP_WORKS || [];
  const work = W.find((w) => w.featured && (w.images || w.image)) || W.find((w) => w.images || w.image);
  if (!host || !work) return;
  const canvas0 = document.createElement("canvas");
  const gl = canvas0.getContext("webgl", { antialias: true, premultipliedAlpha: false }) || canvas0.getContext("experimental-webgl");
  if (!gl) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const srcs = work.images || [work.image];
  const RATIO = work.ratio || 1.5;
  const touch = matchMedia("(pointer: coarse)").matches;
  // the stage size comes from CSS; the image is cropped to cover it (see crop())
  let DISP = RATIO, SX = 1, OX = 0, SY = 1, OY = 0;

  // ---------- markup ----------
  host.classList.add("go");
  host.innerHTML = `
    <div class="press-bed ink-bed">
      <span class="corner tl reg"><i></i></span><span class="corner tr reg"><i></i></span><span class="corner bl reg"><i></i></span><span class="corner br reg"><i></i></span>
      <div class="ink-stage" data-cursor="ink" style="--ar:${RATIO}">
        <div class="ink-hud top">
          <span class="mono" id="ink-mode">The block · mirrored</span>
          <span class="mono">Ink <b id="ink-pct">0</b>%</span>
        </div>
        <div class="ink-hint mono" id="ink-hint">${touch ? "Drag sideways to ink the block" : "Move across the block to roll ink onto it"}</div>
      </div>
      <div class="ink-actions">
        <button class="btn" type="button" id="ink-pull">Pull a print</button>
        <button class="btn ghost" type="button" id="ink-reset">Clean the block</button>
      </div>
    </div>
    <figcaption class="press-meta">
      <strong>${work.title}</strong>
      <span class="mono">${(window.AP_TECHNIQUES[work.technique] || {}).name || ""}, ${work.year}</span>
      <span class="mono">${work.edition ? `Edition of ${work.edition.size}` : "Unique"}</span>
      <a class="link-arrow" href="work.html?id=${encodeURIComponent(work.id)}">View the print</a>
    </figcaption>`;
  const stage = host.querySelector(".ink-stage");
  const cv = canvas0;
  cv.className = "ink-canvas";
  cv.setAttribute("role", "img");
  cv.setAttribute("aria-label", `${work.title}: the woodblock, which you can ink with the pointer`);
  stage.prepend(cv);
  const pctEl = host.querySelector("#ink-pct"), hint = host.querySelector("#ink-hint"), modeEl = host.querySelector("#ink-mode");
  const pullBtn = host.querySelector("#ink-pull"), resetBtn = host.querySelector("#ink-reset");

  // ---------- ink mask (2D canvas, uploaded as a texture) ----------
  {
    const r0 = stage.getBoundingClientRect();
    if (r0.width && r0.height) DISP = r0.width / r0.height;
  }
  const MW = 1024, MH = Math.round(MW / DISP);
  const mask = document.createElement("canvas");
  mask.width = MW; mask.height = MH;
  const mx = mask.getContext("2d");
  mx.fillStyle = "#000"; mx.fillRect(0, 0, MW, MH);
  let maskDirty = true;
  function roll(x0, y0, x1, y1, strength) {
    // a brayer: wide, soft-edged band, laid down a little at a time
    const w = MH * 0.26;
    mx.save();
    mx.lineCap = "round";
    mx.globalCompositeOperation = "lighter";
    mx.strokeStyle = `rgba(255,255,255,${strength || 0.16})`;
    mx.lineWidth = w;
    mx.filter = "blur(6px)";
    mx.beginPath(); mx.moveTo(x0 * MW, y0 * MH); mx.lineTo(x1 * MW, y1 * MH); mx.stroke();
    mx.restore();
    maskDirty = true;
  }
  const probe = document.createElement("canvas"); probe.width = 64; probe.height = Math.max(8, Math.round(64 / DISP));
  const px = probe.getContext("2d", { willReadFrequently: true });
  function coverage() {
    px.drawImage(mask, 0, 0, probe.width, probe.height);
    const d = px.getImageData(0, 0, probe.width, probe.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += Math.min(1, d[i] / 200);
    return Math.round((s / (d.length / 4)) * 100);
  }

  // ---------- GL setup ----------
  const vs = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; v.y = 1.0 - v.y; gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `
    precision mediump float;
    varying vec2 v;
    uniform sampler2D uImg, uInk;
    uniform vec2 uTx;
    uniform vec2 uLight;
    uniform float uPeel, uAspect, uTime;
    uniform vec4 uView;
    float lum(vec2 uv){ vec3 c = texture2D(uImg, uv).rgb; return dot(c, vec3(.299,.587,.114)); }
    float hgt(vec2 uv){ return smoothstep(.30, .70, 1.0 - lum(vec2(uView.x + uv.x * uView.y, uView.z + uv.y * uView.w))); }
    float hb(vec2 s){ return hgt(vec2(1.0 - s.x, s.y)); }           // block is the mirror of the print
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
    void main(){
      vec2 s = v;
      float h = hb(s);
      float hx = hb(s + vec2(uTx.x, 0.0)) - hb(s - vec2(uTx.x, 0.0));
      float hy = hb(s + vec2(0.0, uTx.y)) - hb(s - vec2(0.0, uTx.y));
      vec3 n = normalize(vec3(-hx * 2.2, -hy * 2.2, 1.0));
      vec2 d = (uLight - s) * vec2(uAspect, 1.0);
      vec3 L = normalize(vec3(d, 0.55));
      float diff = max(dot(n, L), 0.0);
      // wood
      float gr = noise(vec2(s.x * 3.0, s.y * 60.0 + noise(s * vec2(4.0, 8.0)) * 6.0));
      float fine = noise(vec2(s.x * 40.0, s.y * 400.0));
      vec3 wood = mix(vec3(.80,.62,.43), vec3(.62,.43,.27), gr * .8 + fine * .2);
      wood *= mix(.62, 1.0, h);                                       // carved areas sit lower and darker
      float ink = clamp(texture2D(uInk, s).r * 1.25, 0.0, 1.0) * smoothstep(.35, .75, h);
      vec3 col = mix(wood, vec3(.055, .05, .048), ink);
      vec3 R = reflect(-L, n);
      float spec = pow(max(R.z, 0.0), 28.0) * (.08 + .7 * ink);
      vec3 block = col * (.5 + .65 * diff) + spec;
      // print: paper takes ink only where the block was inked (mirrored back)
      float pin = clamp(texture2D(uInk, vec2(1.0 - s.x, s.y)).r * 1.25, 0.0, 1.0) * smoothstep(.35, .75, hgt(s));
      float paperTex = noise(s * vec2(900.0 * uAspect, 900.0)) * .03;
      vec3 paper = vec3(.976, .968, .947) - paperTex;
      vec3 print = mix(paper, vec3(.07, .065, .06), pin * .96);
      print *= .975 + .035 * diff;                                    // a whisper of embossing under the light
      // peel from the left
      vec3 outc = block;
      if (s.x < uPeel) {
        outc = print;
      } else if (uPeel > 0.0 && uPeel < 1.0) {
        float k = s.x - uPeel;
        outc *= 1.0 - .45 * exp(-k * 55.0);
      }
      float lip = (uPeel > 0.0 && uPeel < 1.0) ? exp(-abs(s.x - uPeel) * 260.0) : 0.0;
      outc = mix(outc, vec3(1.0), lip * .55);
      gl_FragColor = vec4(outc, 1.0);
    }`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn("ink hero disabled:", e); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uView = U("uView"), uImg = U("uImg"), uInk = U("uInk"), uTx = U("uTx"), uLight = U("uLight"), uPeel = U("uPeel"), uAspect = U("uAspect"), uTime = U("uTime");
  function tex(unit) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  const tImg = tex(0), tInk = tex(1);
  gl.uniform1i(uImg, 0); gl.uniform1i(uInk, 1);

  // stitch the parts into one image
  const art = document.createElement("canvas");
  let ready = false;
  Promise.all(srcs.map((src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; })))
    .then((imgs) => {
      const h = imgs[0].naturalHeight, w = imgs.reduce((a, i) => a + i.naturalWidth * (h / i.naturalHeight), 0);
      art.width = Math.round(w); art.height = h;
      const c = art.getContext("2d");
      let x = 0;
      imgs.forEach((i) => { const iw = i.naturalWidth * (h / i.naturalHeight); c.drawImage(i, x, 0, iw, h); x += iw; });
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tImg);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
      crop();
      ready = true;
      intro();
    })
    .catch(() => {});

  // ---------- sizing ----------
  let aspect = RATIO;
  function crop() {
    const a = aspect;
    if (a < RATIO) { SX = a / RATIO; OX = (1 - SX) / 2; SY = 1; OY = 0; }
    else { SY = RATIO / a; OY = (1 - SY) / 2; SX = 1; OX = 0; }
    if (typeof art === "undefined" || !art.width) return;
    gl.uniform2f(uTx, 1.2 / art.width / SX, 1.2 / art.height / SY);
    gl.uniform4f(uView, OX, SX, OY, SY);
  }
  function size() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(2, Math.round(r.width * dpr));
    cv.height = Math.max(2, Math.round(r.height * dpr));
    aspect = r.width / r.height;
    gl.viewport(0, 0, cv.width, cv.height);
    crop();
  }
  size();
  new ResizeObserver(size).observe(stage);

  // ---------- interaction ----------
  const light = { x: 0.3, y: 0.3, tx: 0.3, ty: 0.3 };
  let last = null, hovering = false, peel = 0, peelTarget = 0, pulled = false, autoRolling = false;
  function local(e) { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }
  stage.addEventListener("pointermove", (e) => {
    const p = local(e);
    light.tx = p.x; light.ty = p.y; hovering = true;
    if (pulled || autoRolling) { last = p; return; }
    if (e.pointerType === "mouse" || e.buttons) {
      if (last) roll(last.x, last.y, p.x, p.y);
      hint.classList.add("off");
    }
    last = p;
  });
  stage.addEventListener("pointerdown", (e) => { last = local(e); });
  // keyboard: arrows roll the brayer, Enter or P pulls a print
  stage.tabIndex = 0;
  stage.setAttribute("aria-label", "Woodblock. Use the arrow keys to roll ink, Enter to pull a print.");
  const kb = { x: 0.5, y: 0.5 };
  stage.addEventListener("keydown", (e) => {
    const d = { ArrowLeft: [-0.06, 0], ArrowRight: [0.06, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[e.key];
    if (d) {
      e.preventDefault();
      const nx = Math.max(0, Math.min(1, kb.x + d[0])), ny = Math.max(0, Math.min(1, kb.y + d[1]));
      if (!pulled) roll(kb.x, kb.y, nx, ny, 0.35);
      kb.x = nx; kb.y = ny; light.tx = nx; light.ty = ny; hovering = true;
      hint.classList.add("off");
    } else if (e.key === "Enter" || e.key.toLowerCase() === "p") { e.preventDefault(); pullBtn.click(); }
  });
  stage.addEventListener("blur", () => { hovering = false; });
  stage.addEventListener("pointerleave", () => { hovering = false; last = null; });

  function setPulled(on) {
    pulled = on;
    peelTarget = on ? 1 : 0;
    modeEl.textContent = on ? "Your impression · 1/1" : "The block · mirrored";
    pullBtn.textContent = on ? "Back to the block" : "Pull a print";
    hint.textContent = on ? "Roll more ink for a fuller impression" : touch ? "Drag sideways to ink the block" : "Move across the block to roll ink onto it";
    hint.classList.toggle("off", !on && !!last);
    if (on) setTimeout(() => hint.classList.add("off"), 2600);
  }
  pullBtn.addEventListener("click", () => setPulled(!pulled));
  resetBtn.addEventListener("click", () => {
    mx.globalCompositeOperation = "source-over"; mx.fillStyle = "#000"; mx.fillRect(0, 0, MW, MH); maskDirty = true;
    setPulled(false); hint.classList.remove("off");
  });

  // an automatic first pass of the brayer, so there is something to see
  function intro() {
    if (reduce) { roll(0, 0.5, 1, 0.5, 0.9); roll(0, 0.3, 1, 0.3, 0.6); return; }
    autoRolling = true;
    const t0 = performance.now(), dur = 2200;
    let prev = { x: -0.05, y: 0.52 };
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const p = { x: -0.05 + e * 1.1, y: 0.52 + Math.sin(e * Math.PI * 2) * 0.08 };
      roll(prev.x, prev.y, p.x, p.y, 0.5);
      if (!hovering) { light.tx = p.x; light.ty = 0.25; }
      prev = p;
      if (t < 1) requestAnimationFrame(step); else autoRolling = false;
    };
    requestAnimationFrame(step);
  }

  // ---------- render loop (only while visible) ----------
  let visible = true, raf = 0, lastPct = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(stage);
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (!hovering && !autoRolling && !reduce) { light.tx = 0.5 + Math.cos(now / 2600) * 0.38; light.ty = 0.35 + Math.sin(now / 3100) * 0.25; }
    light.x += (light.tx - light.x) * 0.12;
    light.y += (light.ty - light.y) * 0.12;
    peel += (peelTarget - peel) * (reduce ? 1 : 0.06);
    if (Math.abs(peelTarget - peel) < 0.001) peel = peelTarget;
    if (maskDirty) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tInk);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      maskDirty = false;
      if (now - lastPct > 250) { pctEl.textContent = coverage(); lastPct = now; }
    }
    if (ready) {
      gl.uniform2f(uLight, light.x, light.y);
      gl.uniform1f(uPeel, peel);
      gl.uniform1f(uAspect, aspect);
      gl.uniform1f(uTime, now / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame); });
  raf = requestAnimationFrame(frame);
})();
