/*
  Languages: English (source), Greek, Swedish.
  The site is written in English. This file translates what is on the page using
  the dictionaries in i18n-dict.js, keyed by the English text:
  - whole elements (with their inline markup) for static copy,
  - single text nodes and attributes for everything the scripts render,
  - patterns with {placeholders} for text that contains numbers or names.
  New content is translated as it appears (MutationObserver), so app code stays in English.
*/
(function () {
  const LANGS = { en: { name: "English", short: "EN", locale: "en-IE" }, el: { name: "Ελληνικά", short: "EL", locale: "el-GR" }, sv: { name: "Svenska", short: "SV", locale: "sv-SE" } };
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang");
  try { if (lang && LANGS[lang]) localStorage.setItem("ap-lang", lang); else lang = localStorage.getItem("ap-lang"); } catch (e) {}
  if (!lang || !LANGS[lang]) {
    const nav = (navigator.languages || [navigator.language || "en"]).map((l) => l.slice(0, 2).toLowerCase());
    lang = nav.find((l) => LANGS[l]) || "en";
  }
  document.documentElement.lang = lang;
  if (window.AP_CONFIG) window.AP_CONFIG.locale = LANGS[lang].locale;

  const DICT = (window.AP_I18N && window.AP_I18N[lang]) || {};
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const exact = new Map();
  const patterns = [];
  Object.keys(DICT).forEach((k) => {
    const nk = norm(k);
    if (/\{[a-z0-9]+\}/i.test(nk)) {
      const names = [];
      // {n}, {n1}, {n2}... match numbers; any other {name} matches text
      const re = new RegExp("^" + nk.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{([a-z0-9]+)\}/gi, (_, n) => { names.push(n); return /^n\d*$/.test(n) ? "(\\d+(?:[.,]\\d+)?)" : "(.+?)"; }) + "$");
      patterns.push({ re, names, value: DICT[k] });
    } else {
      exact.set(nk, DICT[k]);
      // plain-text form of keys written with entities, for text nodes
      if (/&amp;|&lt;|&gt;/.test(nk) && !/<[a-z]/i.test(nk)) exact.set(nk.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"), DICT[k].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
    }
  });

  function t(s) {
    if (lang === "en" || s == null) return s;
    const n = norm(String(s));
    if (!n) return s;
    if (exact.has(n)) return exact.get(n);
    for (const p of patterns) {
      const m = n.match(p.re);
      if (m) return p.value.replace(/\{([a-z0-9]+)\}/gi, (_, name) => { const v = m[p.names.indexOf(name) + 1]; return v == null ? "" : t(v); });
    }
    return s;
  }

  const INLINE = new Set(["BR", "EM", "B", "STRONG", "SPAN", "I", "A", "ABBR", "SMALL"]);
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE"]);
  const ATTRS = ["aria-label", "placeholder", "title", "alt", "data-t"];
  const done = new WeakSet();

  function translateAttrs(el) {
    ATTRS.forEach((a) => {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) { const tv = t(v); if (tv !== v) el.setAttribute(a, tv); }
    });
  }
  function translateElement(el) {
    if (lang === "en" || !el || el.nodeType !== 1 || SKIP.has(el.tagName) || el.closest("[data-noi18n]")) return;
    translateAttrs(el);
    // whole element with inline markup
    if (!done.has(el) && el.children.length && Array.from(el.querySelectorAll("*")).every((d) => INLINE.has(d.tagName))) {
      const key = norm(el.innerHTML);
      if (exact.has(key)) { el.innerHTML = exact.get(key); done.add(el); el.querySelectorAll("*").forEach(translateAttrs); return; }
    }
    for (const c of Array.from(el.childNodes)) {
      if (c.nodeType === 3) translateText(c);
      else if (c.nodeType === 1) translateElement(c);
    }
  }
  function translateText(node) {
    const v = node.nodeValue;
    if (!v || !/[A-Za-z]/.test(v)) return;
    const tv = t(v);
    if (tv !== v) {
      const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
      node.nodeValue = lead + tv + trail;
    }
  }
  function translateTitle() {
    const tt = t(document.title);
    if (tt !== document.title) document.title = tt;
    const md = document.querySelector('meta[name="description"]');
    if (md) { const d = t(md.content); if (d !== md.content) md.content = d; }
  }

  // ---------- language switch in the header ----------
  function switcher() {
    const host = document.querySelector(".header-actions");
    if (!host || host.querySelector(".lang")) return;
    const box = document.createElement("div");
    box.className = "lang";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Language");
    box.setAttribute("data-noi18n", "");
    box.innerHTML = Object.entries(LANGS).map(([k, v]) => `<button type="button" data-lang="${k}" lang="${k}" aria-pressed="${k === lang}" title="${v.name}">${v.short}</button>`).join("");
    host.prepend(box);
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lang]");
      if (!b || b.dataset.lang === lang) return;
      try { localStorage.setItem("ap-lang", b.dataset.lang); sessionStorage.setItem("ap-pt", "1"); } catch (err) {}
      const u = new URL(location.href); u.searchParams.delete("lang");
      document.documentElement.classList.add("leaving");
      setTimeout(() => location.replace(u.href), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520);
    });
  }

  // ---------- run ----------
  if (lang !== "en") translateElement(document.body);
  translateTitle();
  let pending = false;
  new MutationObserver((muts) => {
    switcher();
    if (lang === "en") return;
    for (const m of muts) {
      if (m.type === "characterData") translateText(m.target);
      else m.addedNodes.forEach((n) => (n.nodeType === 3 ? translateText(n) : translateElement(n)));
    }
    if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; translateTitle(); }); }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  document.addEventListener("DOMContentLoaded", () => { switcher(); translateTitle(); });

  window.I18N = { lang, t, langs: LANGS };
})();
