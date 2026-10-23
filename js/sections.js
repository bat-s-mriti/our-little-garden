/* sections.js: the optional, reorderable blocks that make up a day page. */
"use strict";

const SECTION_TYPES = {};
const SECTION_ORDER = ["note", "gallery", "polaroids", "places", "food", "spending", "outfit", "song", "movies", "quotes", "loved", "highlight", "bucket", "scorecard", "tickets", "voice"];
function defType(type, def) { SECTION_TYPES[type] = Object.assign({ type }, def); }
function fixSection(sec) {
  const T = SECTION_TYPES[sec.type];
  sec.data = Object.assign(T ? T.make() : {}, sec.data || {});
}
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);
/* Google Maps link for a pin, no key needed */
const gmapsUrl = r => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${(+r.lat).toFixed(6)},${(+r.lng).toFixed(6)}`);
const hasGeo = r => r && r.lat !== undefined && r.lat !== null && r.lat !== "" && !isNaN(+r.lat) && r.lng !== "" && r.lng !== undefined && !isNaN(+r.lng);

/* ---------- media (photos, videos) ---------- */
function mediaEl(it, i, alt, auto) {
  if (!it._url) return placeholder(i);
  if (it._kind === "video") return `<video src="${esc(it._url)}" muted loop playsinline preload="metadata"${auto ? " data-auto" : ""}></video><span class="vbadge">▶</span>`;
  return `<img src="${esc(it._url)}" alt="${esc(alt || "")}" loading="lazy">`;
}
function mediaView(s, cls) {
  const items = s.data.items;
  if (cls === "polaroids") return `<div class="polaroids">${items.map((it, i) => `<figure class="pol" style="--rot:${((i * 37) % 9) - 4}deg" data-lb="${i}">${mediaEl(it, i, it.caption, true)}<figcaption>${esc(it.caption || "")}</figcaption></figure>`).join("")}</div>`;
  if (cls === "tickets") return `<div class="tickets">${items.map((it, i) => `<figure class="ticket" data-lb="${i}"><span class="tape"></span>${mediaEl(it, i, it.caption, false)}<figcaption>${esc(it.caption || "")}</figcaption></figure>`).join("")}</div>`;
  return `<div class="gallery">${items.map((it, i) => `<figure data-lb="${i}">${mediaEl(it, i, it.caption, true)}${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ""}</figure>`).join("")}</div>`;
}
function mediaEditHTML(s, label) {
  const items = s.data.items;
  return `<div class="gallery editing-grid" data-drop>${items.map((it, i) => `<figure class="editing" data-i="${i}">
      <div class="tools"><button type="button" data-act="left" title="Move earlier" ${i === 0 ? "disabled" : ""}>◀</button><button type="button" data-act="right" title="Move later" ${i === items.length - 1 ? "disabled" : ""}>▶</button><button type="button" data-act="remove" title="Remove">✕</button></div>
      ${it._url ? `<span class="mwrap" data-lb="${i}">${mediaEl(it, i, it.caption, false)}</span>` : `<button type="button" class="fillslot" data-fill="${i}">${placeholder(i, "Tap to choose")}</button>`}
      <input class="capin" data-cap="${i}" value="${esc(it.caption || "")}" placeholder="Add a caption"></figure>`).join("")}
    <figure class="addtile"><button type="button" data-add>＋<span>${label}</span><small>or drop files here</small></button></figure></div>`;
}
function bindMediaEdit(body, s, ctx, kinds) {
  const items = s.data.items, accept = kinds.map(k => k + "/*").join(",");
  const add = async files => {
    files = files.filter(f => kinds.includes(fileKind(f)));
    if (!files.length) { toast("Those files aren't " + kinds.join(" or ") + "s."); return; }
    ensurePersist();
    for (let k = 0; k < files.length; k++) {
      toast(`Adding ${k + 1} of ${files.length}…`, true);
      try {
        const m = await storeFile(files[k]);
        const it = { src: m.src, kind: m.kind, caption: "" };
        await resolveMedia(it, ctx.day.slug);
        items.push(it);
      } catch (e) { toast("Couldn't store " + files[k].name + " in this browser (is it full, or in private mode?)."); break; }
    }
    saveState(); ctx.rerender(); toast("Added.");
  };
  body.addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.add !== undefined) { add(await pickFiles(true, accept)); return; }
    if (b.dataset.fill !== undefined) {
      const [f] = await pickFiles(false, accept);
      if (!f || !kinds.includes(fileKind(f))) return;
      try {
        const it = items[+b.dataset.fill], m = await storeFile(f);
        it.src = m.src; it.kind = m.kind;
        await resolveMedia(it, ctx.day.slug);
        saveState(); ctx.rerender();
      } catch (err) { toast("Couldn't store that file in this browser."); }
      return;
    }
    const act = b.dataset.act;
    if (!act) return;
    const i = +b.closest("[data-i]").dataset.i;
    if (act === "remove") {
      if (!confirm("Remove this one?")) return;
      const [it] = items.splice(i, 1);
      await dropMedia(it);
    } else {
      const j = act === "left" ? i - 1 : i + 1;
      if (j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
    }
    saveState(); ctx.rerender();
  });
  body.addEventListener("input", e => {
    if (e.target.dataset.cap === undefined) return;
    items[+e.target.dataset.cap].caption = e.target.value;
    ctx.save();
  });
  const drop = $("[data-drop]", body);
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("dragging")));
  drop.addEventListener("drop", e => { e.preventDefault(); add([...e.dataTransfer.files]); });
}
function bindLightbox(body, s) {
  body.addEventListener("click", e => {
    const f = e.target.closest("[data-lb]");
    if (!f || e.target.closest("button,input")) return;
    const items = s.data.items || [];
    const list = items.filter(x => x._url), idx = list.indexOf(items[+f.dataset.lb]);
    if (idx >= 0) openLightbox(list, idx);
  });
}

/* ---------- row-based sections ---------- */
function fieldHTML(f, r) {
  const v = r[f.k] ?? "";
  if (f.type === "rating") return `<select data-k="${f.k}" class="rate" title="Rating">${[0, 1, 2, 3, 4, 5].map(n => `<option value="${n}" ${+v === n ? "selected" : ""}>${n ? stars(n) : "No rating"}</option>`).join("")}</select>`;
  return `<input data-k="${f.k}" class="${f.cls || ""}" type="${f.type || "text"}" ${f.type === "number" ? 'inputmode="decimal" step="any"' : ""} value="${esc(v)}" placeholder="${esc(f.ph || "")}">`;
}
function rowsEditHTML(s, spec) {
  return `<div class="rowed">${s.data.rows.map((r, i) => `<div class="rowline" data-r="${i}">${spec.fields.map(f => fieldHTML(f, r)).join("")}${spec.extra ? spec.extra(r, i) : ""}<button type="button" class="x" data-del-row="${i}" title="Remove">✕</button></div>`).join("")}
    <button type="button" class="addrow" data-add-row>＋ ${spec.addLabel}</button></div>${spec.foot ? spec.foot(s) : ""}`;
}
function bindRows(body, s, ctx, spec) {
  body.addEventListener("input", e => {
    const t = e.target, k = t.dataset.k;
    if (!k) return;
    const f = spec.fields.find(x => x.k === k), i = +t.closest("[data-r]").dataset.r;
    let v = t.value;
    if (f.type === "number") v = v === "" ? "" : Number(v);
    if (f.type === "rating") v = Number(v);
    s.data.rows[i][k] = v;
    ctx.save();
    if (spec.onInput) spec.onInput(body, s);
  });
  body.addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.addRow !== undefined) {
      s.data.rows.push(spec.blank());
      ctx.rerender();
      const inputs = $$(".rowline:last-of-type input", ctx.el);
      if (inputs[0]) inputs[0].focus();
      saveState();
    } else if (b.dataset.delRow !== undefined) {
      s.data.rows.splice(+b.dataset.delRow, 1);
      saveState(); ctx.rerender();
    } else if (spec.onClick) spec.onClick(b, s, ctx);
  });
}
function rowsType(type, def) {
  const spec = { fields: def.fields, addLabel: def.addLabel, blank: def.blank, extra: def.extra, foot: def.foot, onInput: def.onInput, onClick: def.onClick };
  const blankish = r => def.fields.every(f => f.type === "rating" || String(r[f.k] ?? "").trim() === "");
  defType(type, {
    label: def.label, emoji: def.emoji, desc: def.desc,
    make: () => ({ rows: [] }),
    empty: s => s.data.rows.every(blankish),
    view: (s, day) => def.view(s.data.rows.filter(r => !blankish(r)), s, day),
    edit: s => rowsEditHTML(s, spec),
    bind: (body, s, ctx) => bindRows(body, s, ctx, spec),
    after: def.after
  });
}

/* ---------- places and the map ---------- */
function mountPlacesMap(box, rows, opts = {}) {
  const m = new TinyMap(box, { wheel: !!opts.wheel });
  const pts = rows.map(r => [+r.lat, +r.lng]);
  rows.forEach((r, i) => m.addMarker(pts[i][0], pts[i][1], `<div class="pin">${stickerHTML(opts.sticker || randSticker(), 24)}<b>${opts.numbers === false ? "" : i + 1}</b></div>`, { title: r.name || "", onClick: opts.onPin ? () => opts.onPin(r, i) : null }));
  m.setLine(opts.line === false || pts.length < 2 ? [] : pts);
  m.fitBounds(pts);
  onLeave(() => m.destroy());
  return m;
}
function pickPlace(initial) {
  return new Promise(res => {
    const dlg = openDialog(`<form method="dialog"><h3>Find the place</h3>
      <div class="pp-search"><input type="search" placeholder="Search for a place, e.g. Phewa Lake" data-q><button type="button" class="primary" data-go>Search</button></div>
      <ul class="pp-results" data-res></ul>
      <div class="pp-map" data-map></div>
      <p class="pp-hint">Search, or tap the map to drop the pin exactly where you want it.</p>
      <div class="mbtns"><button type="button" class="ghost" data-cancel>Cancel</button><button value="ok" class="primary" data-use disabled>Use this spot</button></div></form>`, "wide");
    let pt = hasGeo(initial) ? [+initial.lat, +initial.lng] : null, guess = "", marker = null;
    const use = $("[data-use]", dlg), resUl = $("[data-res]", dlg);
    const setPt = (la, ln, name) => {
      pt = [la, ln]; if (name) guess = name;
      if (marker) marker.set(la, ln); else marker = map.addMarker(la, ln, `<div class="pin"><span class="stk emo" style="--s:26px">📍</span></div>`);
      use.disabled = false;
    };
    const map = new TinyMap($("[data-map]", dlg), { wheel: true, onClick: (la, ln) => setPt(la, ln, "") });
    if (pt) { map.setView(pt[0], pt[1], 12); setPt(pt[0], pt[1], ""); }
    const search = async () => {
      const q = $("[data-q]", dlg).value.trim();
      if (!q) return;
      resUl.innerHTML = `<li class="muted">Searching…</li>`;
      try {
        const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=" + encodeURIComponent(q));
        const list = await r.json();
        resUl.innerHTML = list.length ? list.map((p, i) => `<li><button type="button" data-i="${i}">${esc(p.display_name)}</button></li>`).join("") : `<li class="muted">Nothing found, try the map instead.</li>`;
        resUl.onclick = e => {
          const b = e.target.closest("button[data-i]");
          if (!b) return;
          const p = list[+b.dataset.i];
          setPt(+p.lat, +p.lon, p.name || p.display_name.split(",")[0]);
          map.setView(+p.lat, +p.lon, 14);
        };
      } catch (e) { resUl.innerHTML = `<li class="muted">Search isn't available right now. Tap the map to place the pin.</li>`; }
    };
    $("[data-go]", dlg).onclick = search;
    $("[data-q]", dlg).addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); search(); } });
    $("[data-cancel]", dlg).onclick = () => dlg.close("cancel");
    dlg.addEventListener("close", () => {
      const ok = dlg.returnValue === "ok" && pt;
      map.destroy();
      res(ok ? { lat: +pt[0].toFixed(6), lng: +pt[1].toFixed(6), name: guess } : null);
    });
  });
}

/* ---------- song helpers ---------- */
function embedFor(url) {
  if (!url) return null;
  let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{11})/);
  if (m) return { kind: "yt", src: `https://www.youtube.com/embed/${m[1]}?autoplay=${EDIT ? 0 : 1}&loop=1&playlist=${m[1]}&playsinline=1` };
  m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/(\w+)/);
  if (m) return { kind: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
  return null;
}

/* ================= the section types ================= */

defType("note", {
  label: "Diary note", emoji: "📝", desc: "A few lines about the day, in your own words.",
  make: () => ({ text: "" }),
  empty: s => !s.data.text.trim(),
  view: s => `<div class="note">${esc(s.data.text)}</div>`,
  edit: s => `<textarea class="bigta" rows="5" placeholder="What happened today? What do you want to remember?">${esc(s.data.text)}</textarea>`,
  bind: (body, s, ctx) => $("textarea", body).addEventListener("input", e => { s.data.text = e.target.value; ctx.save(); })
});

[["gallery", "Photos & videos", "🖼️", "Photos and videos in a tidy gallery. Add lots at once.", "gallery", ["image", "video"], "Add photos & videos"],
 ["polaroids", "Polaroid wall", "📸", "Photos as tilted polaroids with little captions.", "polaroids", ["image", "video"], "Add photos"],
 ["tickets", "Tickets & receipts", "🎟️", "Snap the tickets, wristbands and receipts and tape them in.", "tickets", ["image"], "Add pictures"]
].forEach(([type, label, emoji, desc, cls, kinds, addLabel]) => defType(type, {
  label, emoji, desc, lightbox: true,
  make: () => ({ items: [] }),
  empty: s => !s.data.items.length,
  view: s => mediaView(s, cls),
  edit: s => mediaEditHTML(s, addLabel),
  bind: (body, s, ctx) => bindMediaEdit(body, s, ctx, kinds)
}));

rowsType("places", {
  label: "Places & map", emoji: "🗺️", desc: "Everywhere you went, pinned on a map with your route.",
  fields: [{ k: "name", ph: "Place name", cls: "grow" }, { k: "note", ph: "Note (optional)", cls: "grow" }],
  addLabel: "Add a place", blank: () => ({ name: "", note: "", lat: "", lng: "" }),
  extra: (r, i) => `<button type="button" class="findbtn${hasGeo(r) ? " set" : ""}" data-find="${i}">📍 ${hasGeo(r) ? "Move pin" : "Find on map"}</button>`,
  onClick: async (b, s, ctx) => {
    if (b.dataset.find === undefined) return;
    const r = s.data.rows[+b.dataset.find];
    const p = await pickPlace(r);
    if (!p) return;
    r.lat = p.lat; r.lng = p.lng;
    if (!r.name && p.name) r.name = p.name;
    saveState(); ctx.rerender();
  },
  view: (rows, s) => `${rows.some(hasGeo) ? `<div class="minimap" data-map></div>` : ""}<ol class="placelist">${rows.map(r => `<li><b>${esc(r.name || "Somewhere lovely")}</b>${r.note ? `<span>${esc(r.note)}</span>` : ""}${hasGeo(r) ? `<a class="gmap" href="${esc(gmapsUrl(r))}" target="_blank" rel="noopener">Open in Google Maps ↗</a>` : ""}</li>`).join("")}</ol>`,
  after: (el, s) => { const box = $("[data-map]", el); const g = s.data.rows.filter(hasGeo); if (box && g.length) mountPlacesMap(box, g); }
});
/* in edit mode the places section also shows a map preview */
{
  const T = SECTION_TYPES.places, edit = T.edit;
  T.edit = s => edit(s) + (s.data.rows.some(hasGeo) ? `<div class="minimap" data-map></div>` : "");
}

rowsType("food", {
  label: "What we ate", emoji: "🍜", desc: "Dishes, snacks and drinks, with a star rating.",
  fields: [{ k: "dish", ph: "What we ate", cls: "grow" }, { k: "where", ph: "Where", cls: "grow" }, { k: "rating", type: "rating" }],
  addLabel: "Add a dish", blank: () => ({ dish: "", where: "", rating: 0 }),
  view: rows => `<div class="foodgrid stagger">${rows.map(r => `<div class="foodcard"><span class="fc-e">${pick(["🍜", "🍰", "🍓", "🥐", "🍕", "🍡", "🥟", "🍦", "☕", "🍩"])}</span><b>${esc(r.dish || "Something yummy")}</b>${r.where ? `<small>${esc(r.where)}</small>` : ""}${+r.rating ? `<i class="stars">${stars(+r.rating)}</i>` : ""}</div>`).join("")}</div>`
});

rowsType("spending", {
  label: "Spending", emoji: "🧾", desc: "What the day cost, with the total added up for you.",
  fields: [{ k: "item", ph: "What for", cls: "grow" }, { k: "amount", type: "number", ph: "Amount", cls: "amt" }],
  addLabel: "Add an expense", blank: () => ({ item: "", amount: "" }),
  foot: s => `<div class="rc-total live"><span>Total</span><b data-total>${money(s.data.rows.reduce((n, r) => n + (Number(r.amount) || 0), 0))}</b></div>`,
  onInput: (body, s) => { const t = $("[data-total]", body); if (t) t.textContent = money(s.data.rows.reduce((n, r) => n + (Number(r.amount) || 0), 0)); },
  view: rows => {
    const total = rows.reduce((n, r) => n + (Number(r.amount) || 0), 0);
    return `<div class="receipt"><div class="rc-head">✿ our day ✿</div>${rows.map(r => `<div class="rc-row"><span>${esc(r.item || "…")}</span><i></i><b>${r.amount === "" || r.amount === undefined ? "" : money(r.amount)}</b></div>`).join("")}<div class="rc-total"><span>Total</span><b>${money(total)}</b></div></div>`;
  }
});

rowsType("movies", {
  label: "Movies & shows", emoji: "🎬", desc: "What you watched together, with ratings.",
  fields: [{ k: "title", ph: "Title", cls: "grow" }, { k: "note", ph: "Thoughts", cls: "grow" }, { k: "rating", type: "rating" }],
  addLabel: "Add a movie or show", blank: () => ({ title: "", note: "", rating: 0 }),
  view: rows => `<div class="moviegrid stagger">${rows.map(r => `<div class="moviecard"><b>${esc(r.title || "Untitled")}</b>${+r.rating ? `<i class="stars">${stars(+r.rating)}</i>` : ""}${r.note ? `<p>${esc(r.note)}</p>` : ""}</div>`).join("")}</div>`
});

rowsType("quotes", {
  label: "Quotes & funny things", emoji: "💬", desc: "Things said that you never want to forget.",
  fields: [{ k: "text", ph: "What was said", cls: "grow" }, { k: "who", ph: "Who said it", cls: "who" }],
  addLabel: "Add a quote", blank: () => ({ text: "", who: "" }),
  view: rows => `<div class="quotes">${rows.map((r, i) => `<blockquote class="bubble ${i % 2 ? "r" : "l"}">“${esc(r.text)}”${r.who ? `<cite>${esc(r.who)}</cite>` : ""}</blockquote>`).join("")}</div>`
});

rowsType("scorecard", {
  label: "Silly scorecard", emoji: "🏆", desc: "Steps walked, kisses, who paid. Whatever you like to count.",
  fields: [{ k: "emoji", ph: "😀", cls: "emo-in" }, { k: "label", ph: "What we counted", cls: "grow" }, { k: "value", ph: "How many", cls: "amt" }],
  addLabel: "Add a stat", blank: () => ({ emoji: "⭐", label: "", value: "" }),
  view: rows => `<div class="scoregrid stagger">${rows.map(r => `<div class="score"><span class="sc-e">${esc(r.emoji || "⭐")}</span><b>${esc(r.value)}</b><small>${esc(r.label)}</small></div>`).join("")}</div>`
});

defType("outfit", {
  label: "Mini-us outfits", emoji: "👗", desc: "What the little you two wore that day. Upload an outfit file, or pick from your outfit library.",
  make: () => ({ occasion: "", a: "", b: "", photo: null, caption: "" }),
  create: () => { const d = SECTION_TYPES.outfit.make(); d.a = currentOutfit("a"); d.b = currentOutfit("b"); return d; },
  empty: () => false,
  view: s => {
    const [na, nb] = names(), d = s.data;
    return `<div class="outfit-stage">${["a", "b"].map(w => `<div class="outfit-who">${avatarSVG(w, d[w] || currentOutfit(w), "bounce")}<span>${esc(w === "a" ? na : nb)}</span></div>`).join("")}</div>
      ${d.occasion ? `<p class="outfit-oc">${esc(d.occasion)}</p>` : ""}
      ${d.photo && d.photo._url ? `<figure class="outfit-photo"><img src="${esc(d.photo._url)}" alt="${esc(d.caption || "our outfits")}">${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ""}</figure>` : ""}`;
  },
  edit: s => {
    const [na, nb] = names(), d = s.data;
    return `<input class="wide-in" data-oc value="${esc(d.occasion)}" placeholder="What was the occasion? e.g. picnic outfits">
      <div class="outfit-pic"><button type="button" class="ghostb" data-upof>⬆ Upload an outfit file (.json) for both of us</button><p class="hint">The file is made from your outfit photo, with the outfit prompt. It also joins the outfit library on About us.</p></div>
      <div class="outfit-edit"><div><h4>${esc(na)}</h4><div data-ofp="a"></div></div><div><h4>${esc(nb)}</h4><div data-ofp="b"></div></div></div>
      <div class="outfit-pic">${d.photo && d.photo._url ? `<img src="${esc(d.photo._url)}" alt=""><button type="button" class="ghostb" data-rmphoto>Remove picture</button>` : `<button type="button" class="ghostb" data-photo>＋ Add a real photo of the outfits (optional)</button>`}
        <input class="wide-in" data-cap value="${esc(d.caption)}" placeholder="Caption for the picture"></div>`;
  },
  bind: (body, s, ctx) => {
    const d = s.data, paints = {};
    ["a", "b"].forEach(w => { paints[w] = outfitPicker($(`[data-ofp=${w}]`, body), w, {
      get: () => d[w] || currentOutfit(w),
      set: id => { d[w] = id; ctx.save(); },
      onRemove: id => { STATE.outfits = STATE.outfits.filter(o => o.id !== id); ["a", "b"].forEach(x => { if (d[x] === id) d[x] = ""; }); saveState(); ctx.rerender(); }
    }); });
    $("[data-upof]", body).onclick = async () => {
      const files = await pickFiles(true, ".json,application/json");
      if (!files.length) return;
      const r = await importOutfitFiles(files);
      if (r.bad.length) toast(`Couldn't read: ${r.bad.join(", ")}. Is it an outfit file?`);
      if (r.added.length) {
        const first = {}; r.added.forEach(o => { if (!first[o.who]) first[o.who] = o; });
        ["a", "b"].forEach(w => { if (first[w]) d[w] = first[w].id; });
        saveState(); toast("Outfit added."); ctx.rerender();
      }
    };
    $("[data-oc]", body).addEventListener("input", e => { d.occasion = e.target.value; ctx.save(); });
    $("[data-cap]", body).addEventListener("input", e => { d.caption = e.target.value; ctx.save(); });
    const ph = $("[data-photo]", body);
    if (ph) ph.onclick = async () => {
      const [f] = await pickFiles(false, "image/*");
      if (!f) return;
      try { d.photo = await storeFile(f); await resolveMedia(d.photo, ctx.day.slug); saveState(); ctx.rerender(); } catch (e) { toast("Couldn't store that picture."); }
    };
    const rm = $("[data-rmphoto]", body);
    if (rm) rm.onclick = async () => { await dropMedia(d.photo); d.photo = null; saveState(); ctx.rerender(); };
  },
  after: (el, s) => { const im = $(".outfit-photo img", el); if (im) im.addEventListener("click", () => openLightbox([s.data.photo], 0)); }
});

defType("song", {
  label: "Song of the day", emoji: "🎵", desc: "The song of the day. It plays in the background when the page opens.",
  make: () => ({ title: "", artist: "", url: "", audio: null, note: "" }),
  empty: s => !s.data.title && !s.data.url && !(s.data.audio && s.data.audio.src),
  view: s => {
    const d = s.data, em = embedFor(d.url), hasAudio = d.audio && d.audio._url;
    return `<div class="songcard"><div class="vinyl"><i></i></div><div class="sc-t"><b>${esc(d.title || "Our song")}</b>${d.artist ? `<span>${esc(d.artist)}</span>` : ""}${d.note ? `<p>${esc(d.note)}</p>` : ""}
      ${hasAudio ? `<button type="button" class="ghostb" data-playsong>▶ Play this song</button>` : ""}</div></div>
      ${em ? `<iframe class="embed ${em.kind}" src="${esc(em.src)}" allow="autoplay; encrypted-media; clipboard-write" loading="lazy" title="song player"></iframe>` : ""}`;
  },
  edit: s => {
    const d = s.data;
    return `<div class="rowline"><input class="grow" data-f="title" value="${esc(d.title)}" placeholder="Song title"><input class="grow" data-f="artist" value="${esc(d.artist)}" placeholder="Artist"></div>
      <input class="wide-in" data-f="url" value="${esc(d.url)}" placeholder="YouTube or Spotify link, or a direct .mp3 link (optional)">
      <div class="outfit-pic">${d.audio && d.audio.src ? `<span class="okpill">✓ song file added</span><button type="button" class="ghostb" data-rmaudio>Remove file</button>` : `<button type="button" class="ghostb" data-audio>＋ Upload a song file (mp3, m4a…)</button>`}</div>
      <textarea class="bigta" rows="2" data-f="note" placeholder="Why this song? (optional)">${esc(d.note)}</textarea>
      <p class="hint">A song file plays quietly in the background as soon as the page opens (after the first tap, a browser rule). YouTube and Spotify links show a player instead, because they don't allow background-only playback.</p>`;
  },
  bind: (body, s, ctx) => {
    const d = s.data;
    body.addEventListener("input", e => { const f = e.target.dataset.f; if (f) { d[f] = e.target.value; ctx.save(); } });
    const up = $("[data-audio]", body);
    if (up) up.onclick = async () => {
      const [f] = await pickFiles(false, "audio/*");
      if (!f) return;
      ensurePersist();
      try {
        d.audio = await storeFile(f);
        if (!d.title) d.title = f.name.replace(/\.[^.]+$/, "");
        await resolveMedia(d.audio, ctx.day.slug);
        saveState(); ctx.rerender();
        Music.forPage(Music.trackFrom(d));
      } catch (e) { toast("Couldn't store that file in this browser."); }
    };
    const rm = $("[data-rmaudio]", body);
    if (rm) rm.onclick = async () => { await dropMedia(d.audio); d.audio = null; saveState(); ctx.rerender(); };
  },
  after: (el, s) => {
    const b = $("[data-playsong]", el);
    if (b) b.onclick = () => { Music.forPage(Music.trackFrom(s.data)); Music.play(); };
  }
});

defType("loved", {
  label: "What we loved today", emoji: "💌", desc: "A little note from each of you about the day.",
  make: () => ({ a: "", b: "" }),
  empty: s => !s.data.a.trim() && !s.data.b.trim(),
  view: s => { const [na, nb] = names(); return `<div class="lovedgrid">${[["a", na], ["b", nb]].filter(([w]) => s.data[w].trim()).map(([w, n]) => `<div class="lovedcard"><small>${esc(n)} loved…</small><p>${esc(s.data[w])}</p></div>`).join("")}</div>`; },
  edit: s => { const [na, nb] = names(); return `<div class="lovedgrid">${[["a", na], ["b", nb]].map(([w, n]) => `<label class="lovedcard">${esc(n)} loved…<textarea data-w="${w}" rows="4" placeholder="Write something sweet">${esc(s.data[w])}</textarea></label>`).join("")}</div>`; },
  bind: (body, s, ctx) => body.addEventListener("input", e => { const w = e.target.dataset.w; if (w) { s.data[w] = e.target.value; ctx.save(); } })
});

defType("highlight", {
  label: "Highlight of the day", emoji: "✨", desc: "The one moment you'll remember most.",
  make: () => ({ emoji: "✨", text: "" }),
  empty: s => !s.data.text.trim(),
  view: s => `<div class="highlight"><span class="hl-e">${esc(s.data.emoji || "✨")}</span><p>${esc(s.data.text)}</p></div>`,
  edit: s => `<div class="rowline"><input class="emo-in" data-f="emoji" value="${esc(s.data.emoji)}" maxlength="8" aria-label="Emoji"><input class="grow" data-f="text" value="${esc(s.data.text)}" placeholder="The best moment was…"></div>`,
  bind: (body, s, ctx) => body.addEventListener("input", e => { const f = e.target.dataset.f; if (f) { s.data[f] = e.target.value; ctx.save(); } })
});

defType("bucket", {
  label: "Bucket-list ticks", emoji: "✅", desc: "Things from your bucket list that you ticked off today.",
  make: () => ({ ids: [] }),
  empty: s => !s.data.ids.some(id => STATE.bucket.find(b => b.id === id)),
  view: s => `<ul class="bk-view">${s.data.ids.map(id => STATE.bucket.find(b => b.id === id)).filter(Boolean).map(b => `<li><span class="tick">✓</span>${esc(b.text)}</li>`).join("")}</ul>`,
  edit: s => {
    const linked = s.data.ids.map(id => STATE.bucket.find(b => b.id === id)).filter(Boolean);
    const free = STATE.bucket.filter(b => !s.data.ids.includes(b.id));
    return `<ul class="bk-view">${linked.map(b => `<li><span class="tick">✓</span>${esc(b.text)}<button type="button" class="x" data-unlink="${b.id}">✕</button></li>`).join("")}</ul>
      <div class="bk-add"><select data-pick><option value="">Pick from our bucket list…</option>${free.map(b => `<option value="${b.id}">${esc(b.text)}${b.done ? " ✓" : ""}</option>`).join("")}</select><span>or</span><input data-new placeholder="Something new we ticked off"><button type="button" class="primary" data-addnew>Add</button></div>`;
  },
  bind: (body, s, ctx) => {
    const link = id => {
      if (!s.data.ids.includes(id)) s.data.ids.push(id);
      const b = STATE.bucket.find(x => x.id === id);
      if (b) { b.done = true; b.doneDate = b.doneDate || ctx.day.date; }
      saveState(); ctx.rerender();
    };
    $("[data-pick]", body).addEventListener("change", e => { if (e.target.value) link(e.target.value); });
    $("[data-addnew]", body).onclick = () => {
      const t = $("[data-new]", body).value.trim();
      if (!t) return;
      const b = { id: uid(), text: t, done: true, doneDate: ctx.day.date };
      STATE.bucket.push(b);
      link(b.id);
    };
    body.addEventListener("click", e => {
      const b = e.target.closest("[data-unlink]");
      if (!b) return;
      s.data.ids = s.data.ids.filter(x => x !== b.dataset.unlink);
      saveState(); ctx.rerender();
    });
  }
});

defType("voice", {
  label: "Voice notes", emoji: "🎙️", desc: "Little voice recordings from the day (upload audio files).",
  make: () => ({ items: [] }),
  empty: s => !s.data.items.length,
  view: s => `<div class="voicelist">${s.data.items.map(it => `<div class="voice"><span class="vo-e">🎙️</span><div><b>${esc(it.caption || "Voice note")}</b><audio controls preload="none" src="${esc(it._url)}"></audio></div></div>`).join("")}</div>`,
  edit: s => `<div class="voicelist">${s.data.items.map((it, i) => `<div class="voice" data-i="${i}"><span class="vo-e">🎙️</span><div><input class="capin" data-cap="${i}" value="${esc(it.caption || "")}" placeholder="Name this recording"><audio controls preload="none" src="${esc(it._url)}"></audio></div><button type="button" class="x" data-act="remove">✕</button></div>`).join("")}</div>
    <button type="button" class="addrow" data-add>＋ Add voice notes</button>`,
  bind: (body, s, ctx) => {
    const items = s.data.items;
    body.addEventListener("input", e => { if (e.target.dataset.cap !== undefined) { items[+e.target.dataset.cap].caption = e.target.value; ctx.save(); } });
    body.addEventListener("click", async e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.add !== undefined) {
        const files = (await pickFiles(true, "audio/*")).filter(f => fileKind(f) === "audio");
        ensurePersist();
        for (const f of files) {
          try { const m = await storeFile(f); const it = { src: m.src, kind: "audio", caption: f.name.replace(/\.[^.]+$/, "") }; await resolveMedia(it, ctx.day.slug); items.push(it); }
          catch (err) { toast("Couldn't store " + f.name + "."); break; }
        }
        saveState(); ctx.rerender();
      } else if (b.dataset.act === "remove") {
        const i = +b.closest("[data-i]").dataset.i;
        const [it] = items.splice(i, 1);
        await dropMedia(it);
        saveState(); ctx.rerender();
      }
    });
  }
});

/* ================= rendering the stack of sections on a day page ================= */

function paintSection(el, sec, day) {
  const T = SECTION_TYPES[sec.type];
  const idx = day.sections.indexOf(sec);
  const ctx = { day, sec, el, save: saveSoon, rerender: () => paintSection(el, sec, day) };
  if (!EDIT) {
    el.innerHTML = `<h3 class="sectitle"><span class="secic">${T.emoji}</span>${esc(sec.title || T.label)}</h3><div class="secbody">${T.view(sec, day)}</div>`;
  } else {
    el.innerHTML = `<header class="sechead"><span class="secic">${T.emoji}</span><input class="sectitle-in" value="${esc(sec.title)}" placeholder="${esc(T.label)}" aria-label="Section title">
      <div class="secctl"><button type="button" data-mv="-1" ${idx === 0 ? "disabled" : ""} title="Move up">▲</button><button type="button" data-mv="1" ${idx === day.sections.length - 1 ? "disabled" : ""} title="Move down">▼</button><button type="button" data-del class="danger" title="Delete this section">🗑</button></div></header>
      <div class="secbody">${T.edit(sec, day)}</div>`;
    $(".sectitle-in", el).addEventListener("input", e => { sec.title = e.target.value; saveSoon(); });
    $(".secctl", el).addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.del !== undefined) {
        if (!confirm("Delete this section and everything in it?")) return;
        walkMedia(sec.data, o => dropMedia(o));
        day.sections.splice(day.sections.indexOf(sec), 1);
        saveState(); renderSections(day);
      } else {
        const i = day.sections.indexOf(sec), j = i + Number(b.dataset.mv);
        if (j < 0 || j >= day.sections.length) return;
        [day.sections[i], day.sections[j]] = [day.sections[j], day.sections[i]];
        saveState(); renderSections(day);
        const moved = $(`[data-sid="${sec.id}"]`);
        if (moved) moved.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }
  const body = $(".secbody", el);
  if (EDIT && T.bind) T.bind(body, sec, ctx);
  if (T.lightbox) bindLightbox(body, sec);
  if (T.after) T.after(el, sec, ctx);
}

function renderSections(day) {
  const host = $("#sections");
  if (!host) return;
  host.innerHTML = "";
  day.sections.forEach(sec => {
    const T = SECTION_TYPES[sec.type];
    if (!T) return;
    if (!EDIT && T.empty && T.empty(sec, day)) return;
    if (!EDIT && host.children.length) {
      const dv = document.createElement("div");
      dv.className = "divider reveal"; dv.innerHTML = stickerRow(3, 22);
      host.appendChild(dv);
    }
    const el = document.createElement("article");
    el.className = `sec sec-${sec.type} reveal`;
    el.dataset.sid = sec.id;
    host.appendChild(el);
    paintSection(el, sec, day);
  });
  if (EDIT && !day.sections.length) host.innerHTML = `<p class="empty">Nothing here yet. Add your first section below.</p>`;
  revealInit(host);
  if (!EDIT) autoplayVideos(host);
}

function addSectionDialog(day) {
  const dlg = openDialog(`<form method="dialog"><h3>Add a section</h3><div class="typegrid">${SECTION_ORDER.map(t => { const T = SECTION_TYPES[t]; return `<button type="button" class="typebtn" data-t="${t}"><span>${T.emoji}</span><b>${esc(T.label)}</b><small>${esc(T.desc)}</small></button>`; }).join("")}</div>
    <div class="mbtns"><button type="button" class="ghost" data-cancel>Close</button></div></form>`, "wide");
  $("[data-cancel]", dlg).onclick = () => dlg.close("cancel");
  $(".typegrid", dlg).addEventListener("click", e => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    const T = SECTION_TYPES[b.dataset.t];
    const sec = { id: uid(), type: T.type, title: "", data: T.create ? T.create(day) : T.make() };
    day.sections.push(sec);
    saveState(); dlg.close("done");
    renderSections(day);
    const el = $(`[data-sid="${sec.id}"]`);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}
