/* app.js: router, edit toolbar, settings, boot. Loaded last. */
"use strict";

const ROUTES = [
  [/^\/$/, pageHome],
  [/^\/day\/([^/]+)$/, pageDay],
  [/^\/timeline$/, pageTimeline],
  [/^\/map$/, pageMap],
  [/^\/calendar(?:\/(\d{4})-(\d{2}))?$/, pageCalendar],
  [/^\/stats$/, pageStats],
  [/^\/bucket-list$/, pageBucket],
  [/^\/date-jar$/, pageJar],
  [/^\/letters$/, pageLetters],
  [/^\/about-us$/, pageAbout],
  [/^\/stickers$/, pageStickers],
  [/^\/random$/, pageRandom]
];

let renderChain = Promise.resolve();
function render() {
  renderChain = renderChain.then(doRender).catch(e => console.error(e));
  return renderChain;
}
async function doRender() {
  runLeave();
  closeLightbox();
  initEditFlag();
  let path = (location.pathname.replace(/\/+$/, "") || "/");
  // old links: favorites now live in About us; the stickers page only exists while editing
  const ALIAS = { "/favorites": "/about-us" };
  if (ALIAS[path]) { path = ALIAS[path]; history.replaceState({}, "", EDIT ? path + "?edit" : path); }
  if (path === "/stickers" && !EDIT) { path = "/"; history.replaceState({}, "", "/"); }
  let handler = pageNotFound, m = null;
  for (const [re, fn] of ROUTES) { const r = path.match(re); if (r) { handler = fn; m = r; break; } }
  const el = app();
  try {
    if (handler !== pageDay && handler !== pageRandom) Music.forPage(null);
    await handler(m);
  } catch (err) {
    console.error(err);
    el.innerHTML = `<main class="wrap"><p class="empty">Something went wrong drawing this page. 🍄</p></main>`;
  }
  el.classList.remove("page-in"); void el.offsetWidth; el.classList.add("page-in");
  mountToolbar();
  scrollTo(0, 0);
}

function go(path, replace) {
  const url = EDIT && !path.includes("?") ? path + "?edit" : path;
  history[replace ? "replaceState" : "pushState"]({}, "", url);
  return render();
}

document.addEventListener("click", e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest("a[href]");
  if (!a || a.hasAttribute("download") || a.target === "_blank") return;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin || /\.[a-z0-9]{2,5}$/i.test(u.pathname)) return;
  e.preventDefault();
  if (a.dataset.egg !== undefined) { eggPop(a); return; }
  go(u.pathname + (u.search.includes("edit=off") ? "?edit=off" : ""));
});
addEventListener("popstate", () => render());

/* the surprise egg: wobble, crack, burst, then go somewhere */
function eggPop(a) {
  if (a.classList.contains("crack")) return;
  a.classList.add("crack");
  const r = a.getBoundingClientRect();
  setTimeout(() => burst(r.left + r.width / 2, r.top + r.height / 2, 14), 520);
  setTimeout(() => { a.classList.remove("crack"); go("/random"); }, 900);
}

/* ---------- Edit toolbar ---------- */
function mountToolbar() {
  const have = $(".toolbar");
  document.body.classList.toggle("editing", EDIT);
  if (!EDIT) { if (have) have.remove(); return; }
  if (have) return;
  const bar = document.createElement("div");
  bar.className = "toolbar";
  bar.innerHTML = `<span class="tb-label">✏️ Editing <small>saved in this browser</small></span>
    <button data-a="settings">Settings</button>
    <a class="tbl" href="/stickers">Stickers</a>
    <button data-a="publish" class="pubb">Publish</button>
    <button data-a="pubset" title="Publish settings">⚙︎</button>
    <button data-a="export">Export</button>
    <button data-a="import">Import</button>
    <button data-a="reset">Reset</button>
    <a class="done" href="/?edit=off">Done</a>`;
  bar.addEventListener("click", e => {
    const a = e.target.dataset && e.target.dataset.a;
    if (a === "settings") openSettings();
    if (a === "publish") publish();
    if (a === "pubset") publishSetup();
    if (a === "export") exportContent();
    if (a === "import") importContent();
    if (a === "reset") resetAll();
  });
  document.body.appendChild(bar);
}

function openSettings() {
  const m = STATE.music;
  const dlg = modal("Site settings", `
    <label>Site title<input name="title" value="${esc(STATE.title)}"></label>
    <label>Subtitle<input name="subtitle" value="${esc(STATE.subtitle)}"></label>
    <div class="two"><label>Your name<input name="n0" value="${esc(STATE.names[0])}"></label><label>Her name<input name="n1" value="${esc(STATE.names[1])}"></label></div>
    <div class="two"><label>Together since<input type="date" name="since" value="${esc(STATE.since)}"></label><label>Currency symbol<input name="currency" value="${esc(STATE.currency)}" maxlength="4"></label></div>
    <fieldset class="themes"><legend>Our song (plays on the homepage and pages without their own song)</legend>
      <label>Title<input name="mtitle" value="${esc(m.title)}" placeholder="Song title"></label>
      <div class="songrow"><span id="mstatus">${m.src ? "✓ song file added" : "No song file yet"}</span><button type="button" class="ghostb" id="mup">${m.src ? "Replace file" : "Upload song file"}</button>${m.src ? `<button type="button" class="ghostb" id="mrm">Remove</button>` : ""}</div></fieldset>`,
  async fd => {
    STATE.title = fd.get("title").trim() || "Our Little Garden";
    STATE.subtitle = fd.get("subtitle").trim();
    STATE.names = [fd.get("n0").trim(), fd.get("n1").trim()];
    STATE.since = fd.get("since") || "";
    STATE.currency = fd.get("currency");
    STATE.music.title = fd.get("mtitle").trim();
    saveState();
    await resolveMedia(STATE.music);
    render();
  }, "wide");
  $("#mup", dlg).onclick = async () => {
    const [f] = await pickFiles(false, "audio/*");
    if (!f) return;
    try {
      ensurePersist();
      await dropMedia(STATE.music);
      const r = await storeFile(f);
      STATE.music.src = r.src; STATE.music.kind = "audio";
      if (!STATE.music.title) STATE.music.title = f.name.replace(/\.[^.]+$/, "");
      $("#mstatus", dlg).textContent = "✓ " + f.name;
      saveState();
    } catch (e) { toast("Couldn't store that file."); }
  };
  const rm = $("#mrm", dlg);
  if (rm) rm.onclick = async () => { await dropMedia(STATE.music); STATE.music.src = ""; STATE.music.kind = ""; saveState(); $("#mstatus", dlg).textContent = "Removed"; };
}

/* ---------- Boot ---------- */
async function boot() {
  initEditFlag();
  STATE = await loadState();
  initMode();
  await resolveMedia(STATE.music);
  await preloadStickers();
  initBackground();
  if (EDIT) ensurePersist();
  await render();
}
boot();
