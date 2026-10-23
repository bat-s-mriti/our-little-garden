/* avatar.js: the "mini us". Fixed heads (heads.js) + an outfit from the library. Outfits are not editable, they come from outfit files.

   OUTFIT FILE (.json), one per outfit day, made from a photo (see the outfit prompt):
   { "format":"mini-us-outfit", "v":1, "id":"2026-10-11-picnic", "name":"Picnic day", "date":"2026-10-11", "occasion":"",
     "a": { "body":"<svg shapes>", "over":"<svg shapes>" }, "b": { ... } }          (a = first person, b = second; either may be left out)
   `body` is drawn under the head, `over` on top of it (hat, glasses, scarf, hair clips). Shapes live in a fixed 100 x 140 space (head slot: circle centre 50,38 radius 25). */
"use strict";

const OUTFIT_FORMAT = "mini-us-outfit", OUTFIT_MAX = 30000;
const OF_TAGS = new Set(["g", "path", "circle", "ellipse", "rect", "line", "polygon", "polyline"]);
const OF_ATTRS = new Set(["d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "opacity", "fill-opacity", "stroke-opacity", "transform", "stroke-dasharray", "fill-rule"]);

/* flat shapes only; anything else is dropped */
function cleanShapes(str) {
  str = String(str || "");
  if (!str.trim() || str.length > OUTFIT_MAX) return "";
  let doc;
  try { doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${str}</svg>`, "image/svg+xml"); } catch (e) { return ""; }
  if (doc.querySelector("parsererror")) return "";
  const walk = n => {
    let out = "";
    for (const el of n.children) {
      const t = el.localName.toLowerCase();
      if (!OF_TAGS.has(t)) continue;
      let at = "";
      for (const a of el.attributes) {
        const k = a.name.toLowerCase(), v = a.value;
        if (!OF_ATTRS.has(k) || /url\s*\(|javascript:|<|"/i.test(v)) continue;
        at += ` ${k}="${v}"`;
      }
      out += `<${t}${at}>${walk(el)}</${t}>`;
    }
    return out;
  };
  return walk(doc.documentElement);
}

/* the built-in outfits (plain drawings, fixed) */
function plainBody(c) {
  const o = "#6b4a3a", S = c.skin || "#e3b48d", T = c.top, B = c.bottom, SH = c.shoes || "#ffffff";
  const st = `stroke="${o}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`, sl = c.sleeves ? T : S;
  // base body: short round arms with mitten hands, stubby legs, round shoes
  let s = `<ellipse cx="26.5" cy="82" rx="5.6" ry="12.5" transform="rotate(7 26.5 82)" fill="${sl}" ${st}/><ellipse cx="73.5" cy="82" rx="5.6" ry="12.5" transform="rotate(-7 73.5 82)" fill="${sl}" ${st}/>`;
  s += `<circle cx="24.5" cy="95" r="5" fill="${S}" ${st}/><circle cx="75.5" cy="95" r="5" fill="${S}" ${st}/>`;
  s += `<rect x="37.5" y="100" width="10.5" height="23" rx="5.2" fill="${S}" ${st}/><rect x="52" y="100" width="10.5" height="23" rx="5.2" fill="${S}" ${st}/>`;
  if (c.kind === "dress") s += `<path d="M36 66 Q50 62.5 64 66 Q69 74 72 92 Q75 106 76 112 Q50 120 24 112 Q25 106 28 92 Q31 74 36 66Z" fill="${T}" ${st}/>`;
  else {
    if (c.kind === "skirt") s += `<path d="M33 98 Q50 94 67 98 Q74 106 76 113 Q50 120 24 113 Q26 106 33 98Z" fill="${B}" ${st}/>`;
    else s += `<rect x="36" y="98" width="12.5" height="25" rx="5.5" fill="${B}" ${st}/><rect x="51.5" y="98" width="12.5" height="25" rx="5.5" fill="${B}" ${st}/><path d="M36 100 Q50 95 64 100 L64 106 L36 106Z" fill="${B}"/>`;
    s += `<path d="M36 66 Q50 62.5 64 66 Q71 72 70 90 Q69 104 60 105 L40 105 Q31 104 30 90 Q29 72 36 66Z" fill="${T}" ${st}/>`;
    if (c.sleeves) s += `<ellipse cx="26.5" cy="80" rx="5.6" ry="10" transform="rotate(7 26.5 80)" fill="${T}" ${st}/><ellipse cx="73.5" cy="80" rx="5.6" ry="10" transform="rotate(-7 73.5 80)" fill="${T}" ${st}/>`;
  }
  s += `<ellipse cx="42.5" cy="127" rx="8.5" ry="5" fill="${SH}" ${st}/><ellipse cx="57.5" cy="127" rx="8.5" ry="5" fill="${SH}" ${st}/>`;
  return s;
}
const BUILTIN_OUTFITS = [
  { id: "b:tee", name: "Tee & jeans", body: plainBody({ kind: "pants", top: "#7bab6e", bottom: "#5d6d8a" }), over: "" },
  { id: "b:dress", name: "Pink dress", body: plainBody({ kind: "dress", top: "#f9a8c0" }), over: "" },
  { id: "b:sweater", name: "Cosy sweater", body: plainBody({ kind: "pants", top: "#f4a259", bottom: "#3b2a20", sleeves: 1 }), over: "" },
  { id: "b:skirt", name: "Skirt & top", body: plainBody({ kind: "skirt", top: "#ffffff", bottom: "#9b7bc2", shoes: "#e0534a" }), over: "" },
  { id: "b:sun", name: "Sunny day", body: plainBody({ kind: "dress", top: "#f7c531" }), over: "" }
];
const DEFAULT_OUTFIT = { a: "b:tee", b: "b:dress" };

/* the library: built-ins + uploaded (STATE.outfits, each belongs to one person: who = "a" or "b") */
const outfitsFor = w => [...BUILTIN_OUTFITS.map(o => Object.assign({ who: w }, o)), ...(STATE.outfits || []).filter(o => o.who === w)];
function outfitById(w, id) {
  return outfitsFor(w).find(o => o.id === id) || BUILTIN_OUTFITS.find(o => o.id === DEFAULT_OUTFIT[w]);
}
/* what they wear on the About us page right now */
const currentOutfit = w => (STATE.about.outfit && STATE.about.outfit[w]) || DEFAULT_OUTFIT[w];

function avatarInner(w, outfitId) {
  const of = outfitById(w, outfitId || currentOutfit(w));
  const head = g => `<g transform="translate(50 66) scale(1.16) translate(-50 -66)">${g}</g>`;
  return `${head(HEADS[w].back)}${of.body}${head(HEADS[w].front)}${of.over || ""}`;
}
function avatarSVG(w, outfitId, cls = "") {
  return `<svg class="avatar ${cls}" viewBox="0 -12 100 152" role="img" aria-label="mini character">${avatarInner(w, outfitId)}</svg>`;
}

/* read outfit files; returns the outfits added. They are stored per person and selected by the caller. */
async function importOutfitFiles(files) {
  const added = [], bad = [];
  for (const f of files) {
    try {
      const j = JSON.parse(await f.text());
      if (j.format !== OUTFIT_FORMAT) throw new Error("format");
      const fid = String(j.id || f.name.replace(/\.[^.]+$/, "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "outfit";
      let n = 0;
      for (const w of ["a", "b"]) {
        if (!j[w]) continue;
        const body = cleanShapes(j[w].body), over = cleanShapes(j[w].over);
        if (!body) continue;
        const o = { id: `${fid}.${w}`, who: w, name: String(j.name || fid).slice(0, 60), occasion: String(j.occasion || "").slice(0, 80), date: /^\d{4}-\d{2}-\d{2}$/.test(j.date || "") ? j.date : "", body, over };
        STATE.outfits = (STATE.outfits || []).filter(x => x.id !== o.id); STATE.outfits.push(o);
        added.push(o); n++;
      }
      if (!n) throw new Error("empty");
    } catch (e) { bad.push(f.name); }
  }
  if (added.length) saveState();
  return { added, bad };
}

/* a sideways row of outfits to scroll through and pick from */
function outfitPicker(mount, w, { get, set, onRemove }) {
  let first = true;
  const paint = () => {
    const cur = get(), keep = first ? 0 : ($(".ofrow", mount) || {}).scrollLeft || 0;
    const list = outfitsFor(w);
    mount.innerHTML = `<div class="ofrow" role="listbox">${list.map(o => `<div class="ofcard${o.id === cur ? " on" : ""}" data-id="${esc(o.id)}"><button type="button" class="ofpick" data-pick="${esc(o.id)}" aria-label="${esc(o.name)}"><svg viewBox="14 -12 72 150" aria-hidden="true">${avatarInner(w, o.id)}</svg></button><small>${esc(o.name)}${o.date ? `<br><i>${esc(prettyDate(o.date, true))}</i>` : ""}</small>${o.id.startsWith("b:") ? "" : `<button type="button" class="x ofdel" data-del="${esc(o.id)}" title="Remove this outfit from the library">✕</button>`}</div>`).join("")}</div>`;
    const r = $(".ofrow", mount), on = $(".ofcard.on", mount);
    if (first && on) r.scrollLeft = on.offsetLeft - r.clientWidth / 2 + on.clientWidth / 2; else r.scrollLeft = keep;
    first = false;
  };
  mount.addEventListener("click", e => {
    const p = e.target.closest("[data-pick]"), d = e.target.closest("[data-del]");
    if (p) { set(p.dataset.pick); paint(); }
    else if (d && confirm("Remove this outfit from the library?")) { onRemove(d.dataset.del); paint(); }
  });
  paint();
  return paint;
}
