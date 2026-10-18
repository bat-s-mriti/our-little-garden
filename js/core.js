/* core.js: helpers, state, storage, media. Loaded first. */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));

/* callbacks that run when we leave the current page */
const LEAVE = [];
const onLeave = f => LEAVE.push(f);
function runLeave() { while (LEAVE.length) { try { LEAVE.pop()(); } catch (e) { /* ignore */ } } }

/* ---------- State ---------- */
const SCHEMA = 2;
const KEY = "garden.v1";          // same key as the first version, so existing data carries over
const EDIT_KEY = "garden.edit";
const BUILTIN_STICKERS = ["sunflower", "lily", "mushroom", "heart", "daisy", "tulip", "strawberry", "butterfly", "cherry", "bee"];
const NEW_STICKERS = ["daisy", "tulip", "strawberry", "butterfly", "cherry", "bee"];
let STATE = null;
let EDIT = false;
let dirty = false;

const replacer = (k, v) => (k.startsWith("_") ? undefined : v);   // runtime-only fields are never saved

const FAV_KEYS = ["songs", "foods", "films", "places"];
const profileBlank = () => ({ full: "", nick: "", birth: "", addr: "", lat: "", lng: "", phone: "", email: "", extra: [], favs: { songs: [], foods: [], films: [], places: [] }, hide: ["addr", "phone", "email"] });

function blankState() {
  return {
    schema: SCHEMA, title: "Our Little Garden", subtitle: "", since: "", names: ["", ""],
    currency: "$",
    stickers: ["sunflower", "lily", "mushroom", ...NEW_STICKERS], stkv: 2,
    music: { title: "", url: "", src: "", kind: "" },
    days: [], bucket: [], jar: [], letters: [],
    about: { story: "", facts: [], a: {}, b: {}, p: { a: {}, b: {} }, route: null }
  };
}

/* v1 days had note + photos; v2 days are a list of sections */
function migrate(s) {
  if ((s.schema || 1) >= 2) return s;
  (s.days || []).forEach(d => {
    const secs = [];
    if (d.note) secs.push({ id: uid(), type: "note", title: "", data: { text: d.note } });
    const items = (d.photos || []).map(p => ({ src: p.src || "", kind: "image", caption: p.caption || "" }));
    secs.push({ id: uid(), type: "gallery", title: "", data: { items } });
    d.sections = secs;
    delete d.note; delete d.photos;
  });
  s.schema = SCHEMA;
  return s;
}

function normalize(s) {
  // one-time: older sites get the new drawn stickers added (they can still be removed on the Stickers page)
  if (!s.stkv && Array.isArray(s.stickers)) { NEW_STICKERS.forEach(id => { if (!s.stickers.includes(id)) s.stickers.push(id); }); s.stkv = 2; }
  const b = blankState();
  for (const k in b) if (s[k] === undefined || s[k] === null) s[k] = b[k];
  s.names = Array.isArray(s.names) ? s.names.slice(0, 2) : ["", ""];
  while (s.names.length < 2) s.names.push("");
  // each of you now has your own profile (names, birthday, contact, home, favorites). The old shared favorites go to both of you.
  const oldFav = s.favorites; delete s.favorites;
  s.about = Object.assign(blankState().about, s.about || {});
  s.about.a = s.about.a || {}; s.about.b = s.about.b || {};
  s.about.p = s.about.p || {};
  ["a", "b"].forEach(w => {
    const p = Object.assign(profileBlank(), s.about.p[w] || {});
    p.favs = Object.assign(profileBlank().favs, p.favs || {});
    FAV_KEYS.forEach(k => { if (!Array.isArray(p.favs[k])) p.favs[k] = []; });
    if (!Array.isArray(p.extra)) p.extra = [];
    if (!Array.isArray(p.hide)) p.hide = ["addr", "phone", "email"];
    if (oldFav && typeof oldFav === "object") FAV_KEYS.forEach(k => (Array.isArray(oldFav[k]) ? oldFav[k] : []).forEach(it => { if (it && it.text && !p.favs[k].some(x => x.text === it.text)) p.favs[k].push({ id: uid(), text: it.text }); }));
    s.about.p[w] = p;
  });
  s.music = Object.assign(blankState().music, s.music || {});
  delete s.theme;   // one look only now: cottagecore, with a day and a night mode
  if (!Array.isArray(s.stickers) || !s.stickers.length) s.stickers = ["sunflower", "lily", "mushroom", ...NEW_STICKERS];
  ["days", "bucket", "jar", "letters"].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  s.days.forEach(d => {
    d.slug = d.slug || uid();
    d.date = d.date || "";
    d.title = d.title || "";
    d.badge = d.badge || "sunflower";
    d.mood = d.mood || ""; d.weather = d.weather || ""; d.place = d.place || "";
    d.sections = Array.isArray(d.sections) ? d.sections : [];
    d.sections.forEach(sec => {
      sec.id = sec.id || uid();
      sec.title = sec.title || "";
      if (typeof fixSection === "function") fixSection(sec);
      else sec.data = sec.data || {};
    });
  });
  return s;
}

async function loadState() {
  let local = null, wasOld = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { local = JSON.parse(raw); wasOld = (local.schema || 1) < SCHEMA; }
  } catch (e) { local = null; }
  if (local) {
    const st = normalize(migrate(local));
    if (wasOld) { STATE = st; saveState(); }
    return st;
  }
  let pub = null;
  try {
    const r = await fetch("/content/data.json", { cache: "no-cache" });
    if (r.ok) pub = await r.json();
  } catch (e) { pub = null; }
  const base = pub || window.SITE || {};
  return normalize(migrate(JSON.parse(JSON.stringify(base))));
}

function saveState() {
  try { localStorage.setItem(KEY, JSON.stringify(STATE, replacer)); dirty = false; }
  catch (e) { toast("Couldn't save, this browser's storage is blocked or full."); }
}
let saveTimer;
function saveSoon() { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(saveState, 250); }
addEventListener("pagehide", () => { if (dirty) saveState(); });

/* ---------- Edit mode flag (?edit) and URL helpers ---------- */
function initEditFlag() {
  const q = new URLSearchParams(location.search);
  try {
    if (q.has("edit")) {
      if (q.get("edit") === "off") sessionStorage.removeItem(EDIT_KEY);
      else sessionStorage.setItem(EDIT_KEY, "1");
    }
    EDIT = sessionStorage.getItem(EDIT_KEY) === "1";
  } catch (e) { EDIT = q.has("edit") && q.get("edit") !== "off"; }
  if (q.get("edit") === "off") history.replaceState({}, "", location.pathname);
  if (EDIT && !$("#editCss")) {
    const l = document.createElement("link");
    l.id = "editCss"; l.rel = "stylesheet"; l.href = "/css/edit.css";
    document.head.appendChild(l);
  }
}
const L = path => (EDIT && !path.includes("?") ? path + "?edit" : path);

/* ---------- Small helpers ---------- */
const names = () => [STATE.names[0] || "Me", STATE.names[1] || "My love"];
const sortedDays = () => [...STATE.days].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
const dayById = slug => STATE.days.find(d => d.slug === slug);

function prettyDate(iso, short) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", short
    ? { month: "short", day: "numeric", year: "numeric" }
    : { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
function money(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return (STATE.currency || "") + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function daysTogether() {
  if (!STATE.since) return -1;
  const s = new Date(STATE.since + "T00:00:00");
  return isNaN(s) ? -1 : Math.floor((Date.now() - s) / 86400000);
}

/* ---------- Media storage (IndexedDB), same db/store as v1 so old photos keep working ---------- */
const DB = {
  open() {
    if (!this._p) {
      this._p = new Promise((res, rej) => {
        const r = indexedDB.open("garden", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("photos");
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return this._p;
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction("photos", mode);
      const req = fn(t.objectStore("photos"));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  },
  put(id, blob) { return this.tx("readwrite", s => s.put(blob, id)); },
  get(id) { return this.tx("readonly", s => s.get(id)); },
  del(id) { return this.tx("readwrite", s => s.delete(id)); },
  clear() { return this.tx("readwrite", s => s.clear()); }
};
const URLS = {};   // idb id -> object URL

function ensurePersist() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ignore */ } }

function guessKind(name) {
  const n = (name || "").toLowerCase().split("?")[0];
  if (/\.(mp4|mov|m4v|webm|ogv)$/.test(n)) return "video";
  if (/\.(mp3|m4a|wav|ogg|oga|aac|flac|opus)$/.test(n)) return "audio";
  return "image";
}
function fileKind(f) {
  if (f.type.startsWith("video/")) return "video";
  if (f.type.startsWith("audio/")) return "audio";
  if (f.type.startsWith("image/")) return "image";
  return /\.(mp4|mov|m4v|webm|mp3|m4a|wav|ogg|aac|jpe?g|png|gif|webp|heic)$/i.test(f.name) ? guessKind(f.name) : "other";
}

async function srcUrl(src, slug) {
  if (!src) return "";
  if (src.startsWith("idb:")) {
    const id = src.slice(4);
    if (URLS[id] === undefined) {
      try { const b = await DB.get(id); URLS[id] = b ? URL.createObjectURL(b) : ""; }
      catch (e) { URLS[id] = ""; }
    }
    return URLS[id];
  }
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  if (src.startsWith("media/")) return "/content/" + src;
  if (src.startsWith("/")) return src;
  if (src.startsWith("photos/")) return "/" + src;
  return slug ? `/photos/${slug}/${src}` : "/" + src;
}

/* any object with a string "src" is a media reference */
function walkMedia(o, fn) {
  if (Array.isArray(o)) o.forEach(x => walkMedia(x, fn));
  else if (o && typeof o === "object") {
    if (typeof o.src === "string") fn(o);
    for (const k in o) if (k[0] !== "_") walkMedia(o[k], fn);
  }
}
async function resolveMedia(root, slug) {
  const list = [];
  walkMedia(root, o => list.push(o));
  await Promise.all(list.map(async o => {
    o._url = await srcUrl(o.src, slug);
    o._kind = o.kind || guessKind(o.src);
  }));
}

async function shrink(file, max = 1600) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    if (blob) return blob;
  } catch (e) { /* keep the original file */ }
  return file;
}

/* store one picked file, returns a media reference */
async function storeFile(file, opts = {}) {
  const kind = fileKind(file);
  let blob = file;
  if (kind === "image" && !/gif|svg/.test(file.type)) blob = await shrink(file, opts.max || 1600);
  if (!blob.type) blob = file.slice(0, file.size, { image: "image/jpeg", video: "video/mp4", audio: "audio/mpeg" }[kind] || "");
  const id = uid();
  await DB.put(id, blob);
  return { src: "idb:" + id, kind };
}
async function dropMedia(o) {
  if (o && o.src && o.src.startsWith("idb:")) { try { await DB.del(o.src.slice(4)); } catch (e) { /* ignore */ } }
}

/* ---------- Stickers ---------- */
function stickerList() { return STATE.stickers.length ? STATE.stickers : ["heart"]; }
const randSticker = () => pick(stickerList());
/* n stickers that are all different (cycling through a shuffled pool if you ask for more than you own), never the same twice in a row */
function stickerDeck(n) {
  const pool = stickerList().slice(), out = [];
  let last = null;
  while (out.length < n) {
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    if (pool.length > 1 && pool[0] === last) pool.push(pool.shift());
    for (const id of pool) { if (out.length < n) { out.push(id); last = id; } }
  }
  return out;
}

function stickerURL(id) {
  const rest = id.slice(4);
  if (rest.startsWith("media/")) return "/content/" + rest;
  return URLS[rest] || "";
}
function stickerHTML(id, size) {
  const style = size ? ` style="--s:${size}px"` : "";
  if (!id) id = "heart";
  if (id.startsWith("e:")) return `<span class="stk emo"${style}>${esc(id.slice(2))}</span>`;
  if (id.startsWith("img:")) return `<span class="stk"${style}><img src="${esc(stickerURL(id))}" alt=""></span>`;
  return `<span class="stk"${style}>${ICONS[id] || ICONS.heart}</span>`;
}
async function preloadStickers() {
  for (const id of STATE.stickers) {
    if (id.startsWith("img:") && !id.startsWith("img:media/")) await srcUrl("idb:" + id.slice(4));
  }
}
