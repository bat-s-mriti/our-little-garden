/* ui.js: toast, dialogs, lightbox, animations, background, stickers fx */
"use strict";

let toastTimer;
function toast(msg, sticky) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  if (!sticky) toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

function openDialog(html, cls = "") {
  const dlg = document.createElement("dialog");
  dlg.className = "modal " + cls;
  dlg.innerHTML = html;
  document.body.appendChild(dlg);
  dlg.addEventListener("close", () => setTimeout(() => dlg.remove(), 0));
  dlg.showModal();
  return dlg;
}

function modal(title, fieldsHtml, onSubmit, cls = "") {
  const dlg = openDialog(`<form method="dialog"><h3>${title}</h3>${fieldsHtml}
    <div class="mbtns"><button type="button" class="ghost" data-cancel>Cancel</button><button value="ok" class="primary">Save</button></div></form>`, cls);
  dlg.querySelector("[data-cancel]").onclick = () => dlg.close("cancel");
  dlg.addEventListener("close", () => { if (dlg.returnValue === "ok") onSubmit(new FormData(dlg.querySelector("form")), dlg); });
  return dlg;
}

function pickFiles(multiple, accept = "image/*") {
  return new Promise(res => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = accept; inp.multiple = !!multiple;
    inp.onchange = () => res([...inp.files]);
    inp.oncancel = () => res([]);
    inp.click();
  });
}

/* ---------- Lightbox (photos and videos) ---------- */
const LB = { el: null, items: [], i: 0 };
function lbBuild() {
  if (LB.el) return;
  const el = document.createElement("div");
  el.className = "lightbox";
  el.innerHTML = `<button class="lb-close" aria-label="Close">✕</button>
    <button class="lb-prev" aria-label="Previous">‹</button>
    <div class="lb-stage"></div><p class="lb-cap"></p>
    <button class="lb-next" aria-label="Next">›</button>`;
  document.body.appendChild(el);
  LB.el = el;
  $(".lb-close", el).onclick = closeLightbox;
  $(".lb-prev", el).onclick = () => lbShow(LB.i - 1);
  $(".lb-next", el).onclick = () => lbShow(LB.i + 1);
  el.addEventListener("click", e => { if (e.target === el || e.target.classList.contains("lb-stage")) closeLightbox(); });
  let sx = 0;
  el.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) lbShow(LB.i + (dx < 0 ? 1 : -1));
  });
  document.addEventListener("keydown", e => {
    if (!el.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lbShow(LB.i - 1);
    if (e.key === "ArrowRight") lbShow(LB.i + 1);
  });
}
function lbShow(i) {
  const n = LB.items.length;
  LB.i = (i + n) % n;
  const it = LB.items[LB.i];
  $(".lb-stage", LB.el).innerHTML = it._kind === "video"
    ? `<video src="${esc(it._url)}" controls autoplay playsinline loop></video>`
    : `<img src="${esc(it._url)}" alt="${esc(it.caption || "")}">`;
  $(".lb-cap", LB.el).textContent = it.caption || "";
  LB.el.classList.toggle("single", n < 2);
}
function openLightbox(items, i) {
  if (!items.length) return;
  lbBuild();
  LB.items = items;
  lbShow(i);
  LB.el.classList.add("open");
  document.body.classList.add("noscroll");
}
function closeLightbox() {
  if (!LB.el) return;
  $(".lb-stage", LB.el).innerHTML = "";
  LB.el.classList.remove("open");
  document.body.classList.remove("noscroll");
}

/* ---------- Animations ---------- */
let revealObs;
function revealInit(root = document) {
  $$(".stagger", root).forEach(p => [...p.children].forEach((c, i) => c.style.setProperty("--i", Math.min(i, 14))));
  if (!("IntersectionObserver" in window)) { $$(".reveal", root).forEach(e => e.classList.add("in")); return; }
  if (!revealObs) {
    revealObs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
  }
  $$(".reveal:not(.in)", root).forEach(e => revealObs.observe(e));
}

function burst(x, y, n = 9) {
  for (let i = 0; i < n; i++) {
    const b = document.createElement("span");
    b.className = "burst";
    const a = rand(0, Math.PI * 2), d = rand(50, 130);
    b.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 40}px;--rot:${rand(-90, 90)}deg;--s:${rand(22, 40)}px`;
    b.innerHTML = stickerHTML(randSticker());
    document.body.appendChild(b);
    b.addEventListener("animationend", () => b.remove());
  }
}

function countUp(el, to, fmt) {
  const f = fmt || (v => Math.round(v).toLocaleString());
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || to === 0) { el.textContent = f(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = f(to * e);
    if (p < 1) requestAnimationFrame(step); else el.textContent = f(to);
  };
  requestAnimationFrame(step);
}

/* only one video plays at a time: the one most in view */
function autoplayVideos(root) {
  const vids = $$("video[data-auto]", root);
  if (!vids.length || !("IntersectionObserver" in window)) return;
  const ratios = new Map();
  const choose = () => {
    let best = null, br = 0.35;
    ratios.forEach((r, v) => { if (r > br) { br = r; best = v; } });
    vids.forEach(v => {
      if (v === best) { v.muted = true; v.play().catch(() => {}); } else v.pause();
    });
  };
  const io = new IntersectionObserver(es => {
    es.forEach(e => ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
    choose();
  }, { threshold: [0, 0.25, 0.35, 0.5, 0.75, 1] });
  vids.forEach(v => io.observe(v));
  onLeave(() => io.disconnect());
}

/* ---------- Background of floating stickers ---------- */
function initBackground() {
  const bg = $("#bg");
  if (!bg) return;
  const n = innerWidth < 700 ? 8 : 14;
  let h = "";
  const ids = stickerDeck(n);
  for (let i = 0; i < n; i++) {
    const size = Math.round(rand(34, 86));
    h += `<span class="float" style="left:${rand(0, 94).toFixed(1)}%;top:${rand(0, 92).toFixed(1)}%;--d:${rand(6, 12).toFixed(1)}s;--r:${Math.round(rand(-25, 25))}deg;animation-delay:${(-rand(0, 8)).toFixed(1)}s">${stickerHTML(ids[i], size)}</span>`;
  }
  h += `<span class="ivy l"></span><span class="ivy r"></span>`;
  for (let i = 0; i < 3; i++) h += `<span class="cloud" style="--y:${Math.round(rand(3, 48))}%;--s:${Math.round(rand(110, 200))}px;--t:${Math.round(rand(90, 150))}s;--dl:${(-rand(0, 120)).toFixed(0)}s">${CLOUD_SVG}</span>`;
  // daytime butterflies, night-time fireflies
  for (let i = 0; i < 3; i++) h += `<span class="bf" style="--y:${Math.round(rand(8, 70))}%;--t:${Math.round(rand(26, 44))}s;--dl:${(-rand(0, 30)).toFixed(1)}s;--s:${Math.round(rand(22, 34))}px">${BUTTERFLY_SVG}</span>`;
  for (let i = 0; i < (innerWidth < 700 ? 9 : 16); i++) h += `<span class="ff" style="left:${rand(2, 98).toFixed(1)}%;top:${rand(6, 96).toFixed(1)}%;--t:${rand(5, 11).toFixed(1)}s;animation-delay:${(-rand(0, 10)).toFixed(1)}s"></span>`;
  bg.innerHTML = h;
}

function stickerRow(n = 3, size = 40) {
  return stickerDeck(n).map(id => stickerHTML(id, size)).join("");
}
function placeholder(i, text = "Photo goes here") {
  return `<div class="ph v${(i % 3) + 1}">${stickerHTML(randSticker(), 44)}<span>${esc(text)}</span></div>`;
}
function footerHTML() {
  const who = STATE.names.filter(Boolean).map(esc).join(" &amp; ");
  return `<footer class="foot"><div class="row">${stickerRow(5, 30)}</div><div>Made with love${who ? " by " + who : ""}</div></footer>`;
}


/* ---------- Day / night ---------- */
const MODE_KEY = "garden.mode";
const CLOUD_SVG = `<svg viewBox="0 0 120 56" aria-hidden="true"><g fill="#fff" stroke="#cfdde0" stroke-width="2"><ellipse cx="30" cy="38" rx="26" ry="14"/><ellipse cx="62" cy="28" rx="26" ry="20"/><ellipse cx="92" cy="38" rx="24" ry="14"/><rect x="30" y="34" width="62" height="18" stroke="none"/></g></svg>`;
const BUTTERFLY_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><g class="bw l"><path d="M20 19 C12 4 2 6 3 16 C4 24 14 25 20 21Z" fill="#cdb7f0" stroke="#8d6fc4" stroke-width="1.2"/></g><g class="bw r"><path d="M20 19 C28 4 38 6 37 16 C36 24 26 25 20 21Z" fill="#cdb7f0" stroke="#8d6fc4" stroke-width="1.2"/></g><path d="M20 22 C14 24 9 28 12 34 C16 37 19 30 20 26Z M20 22 C26 24 31 28 28 34 C24 37 21 30 20 26Z" fill="#f9c6d4" stroke="#d6577f" stroke-width="1.2"/><rect x="19" y="14" width="2.4" height="18" rx="1.2" fill="#5b3a29"/></svg>`;
const SUN_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><g class="rays" stroke="#e0a400" stroke-width="2.6" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => `<path d="M20 4 V9" transform="rotate(${i * 45} 20 20)"/>`).join("")}</g><circle cx="20" cy="20" r="9" fill="#f7c531" stroke="#e0a400" stroke-width="2"/><circle cx="17" cy="19" r="1.3" fill="#5b3a29"/><circle cx="23" cy="19" r="1.3" fill="#5b3a29"/><path d="M17 23 Q20 26 23 23" fill="none" stroke="#5b3a29" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const MOON_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M26 6 A15 15 0 1 0 34 26 A12 12 0 0 1 26 6Z" fill="#fde9a6" stroke="#d9b24c" stroke-width="2" stroke-linejoin="round"/><circle cx="17" cy="22" r="1.3" fill="#5b3a29"/><path d="M14 26 Q17 29 20 26" fill="none" stroke="#5b3a29" stroke-width="1.4" stroke-linecap="round"/><path class="twk" d="M31 8 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2Z" fill="#fde9a6"/></svg>`;

function applyMode(m, save) {
  document.documentElement.dataset.mode = m;
  if (save) { try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* ignore */ } }
  const b = $("#modeBtn");
  if (b) {
    b.innerHTML = m === "night" ? MOON_SVG : SUN_SVG;
    b.title = m === "night" ? "Night mode (tap for day)" : "Day mode (tap for night)";
    b.setAttribute("aria-label", b.title);
  }
}
function initMode() {
  let m = document.documentElement.dataset.mode;
  if (m !== "day" && m !== "night") m = matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  const b = document.createElement("button");
  b.id = "modeBtn"; b.type = "button";
  b.onclick = e => {
    const next = document.documentElement.dataset.mode === "night" ? "day" : "night";
    b.classList.remove("flip"); void b.offsetWidth; b.classList.add("flip");
    applyMode(next, true);
    const r = b.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 8);
  };
  document.body.appendChild(b);
  applyMode(m, false);
}
