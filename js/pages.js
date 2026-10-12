/* pages.js: every page of the site. Each page function paints into #app. */
"use strict";

const app = () => $("#app");
const crumb = () => `<a class="back" href="${L("/")}">← Home</a>`;
const ordinal = n => n + (["th", "st", "nd", "rd"][(n % 100 >> 3) ^ 1 && n % 10 < 4 ? n % 10 : 0]);

/* ---------- shared bits ---------- */
async function dayCover(d) {
  for (const s of d.sections) {
    if (s.type !== "gallery" && s.type !== "polaroids") continue;
    const it = (s.data.items || []).find(x => x.src && (x.kind || guessKind(x.src)) === "image");
    if (it) { await resolveMedia(it, d.slug); return it._url; }
  }
  return "";
}
function dayStats(d) {
  const o = { photos: 0, videos: 0, places: 0, meals: 0, movies: 0, spent: 0, outfits: 0, songs: 0, quotes: 0, ticks: 0 };
  d.sections.forEach(s => {
    const dt = s.data || {};
    if (["gallery", "polaroids", "tickets"].includes(s.type)) (dt.items || []).forEach(it => { if (!it.src) return; if ((it.kind || guessKind(it.src)) === "video") o.videos++; else o.photos++; });
    if (s.type === "places") o.places += (dt.rows || []).filter(r => r.name || hasGeo(r)).length;
    if (s.type === "food") o.meals += (dt.rows || []).filter(r => r.dish).length;
    if (s.type === "movies") o.movies += (dt.rows || []).filter(r => r.title).length;
    if (s.type === "quotes") o.quotes += (dt.rows || []).filter(r => r.text).length;
    if (s.type === "spending") o.spent += (dt.rows || []).reduce((n, r) => n + (Number(r.amount) || 0), 0);
    if (s.type === "outfit") o.outfits++;
    if (s.type === "song" && !SECTION_TYPES.song.empty(s)) o.songs++;
    if (s.type === "bucket") o.ticks += (dt.ids || []).length;
  });
  return o;
}
function stickerPickerRadios(name, checked) {
  const list = stickerList();
  const def = checked || list[Math.floor(Math.random() * list.length)];
  return `<div class="stkpick-row">${list.map(id => `<label class="stkpick"><input type="radio" name="${name}" value="${esc(id)}" ${id === def ? "checked" : ""}><span>${stickerHTML(id, 30)}</span></label>`).join("")}</div>`;
}
function pageTitle(title, sub) {
  return `<div class="ptitle">${stickerHTML(randSticker(), 54)}<h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ""}</div>`;
}
function emptyMsg(text) { return `<p class="empty">${stickerHTML(randSticker(), 56)}<br>${text}</p>`; }
function done(html, after) {
  app().innerHTML = html;
  revealInit(app());
  if (after) after();
}

/* ---------- Home ---------- */
const TILES = [["/timeline", "snail", "Timeline"], ["/map", "map", "Our map"], ["/calendar", "calendar", "Calendar"], ["/stats", "bee", "Our stats"], ["/random", "egg", "Surprise me!"], ["/favorites", "heart", "Favorites"], ["/bucket-list", "balloon", "Bucket list"], ["/date-jar", "jar", "Date jar"], ["/letters", "letter", "Open when…"], ["/about-us", "us", "About us"]];

function nextAnniv() {
  if (!STATE.since) return null;
  const s = new Date(STATE.since + "T00:00:00");
  if (isNaN(s)) return null;
  const n = new Date(), t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  let a = new Date(t0.getFullYear(), s.getMonth(), s.getDate());
  if (a < t0) a = new Date(t0.getFullYear() + 1, s.getMonth(), s.getDate());
  let m = new Date(t0.getFullYear(), t0.getMonth(), s.getDate());
  if (m < t0) m = new Date(t0.getFullYear(), t0.getMonth() + 1, s.getDate());
  return { years: a.getFullYear() - s.getFullYear(), days: Math.round((a - t0) / 86400000), mdays: Math.round((m - t0) / 86400000) };
}

async function pageHome() {
  document.title = STATE.title;
  const days = sortedDays();
  const covers = await Promise.all(days.map(dayCover));
  const dt = daysTogether(), an = nextAnniv();
  const withCover = days.map((d, i) => [d, covers[i]]).filter(x => x[1]);
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const mem = withCover.length ? withCover[doy % withCover.length] : null;

  const cards = days.map((d, i) => {
    const st = dayStats(d);
    return `<a class="card reveal" href="${L("/day/" + encodeURIComponent(d.slug))}">
      <div class="cover">${covers[i] ? `<img src="${esc(covers[i])}" alt="${esc(d.title)}" loading="lazy">` : placeholder(i, "Cover photo")}<span class="badge">${stickerHTML(d.badge, 30)}</span></div>
      <div class="info"><div class="date">${esc(prettyDate(d.date))}</div><h3>${esc(d.title || "Untitled day")}</h3>
      <div class="count">${st.photos} photo${st.photos === 1 ? "" : "s"}${st.videos ? ` · ${st.videos} video${st.videos === 1 ? "" : "s"}` : ""}</div></div></a>`;
  });
  if (EDIT) cards.push(`<button class="card newcard" id="newDay" type="button"><span class="plus">＋</span><span>New day</span></button>`);

  done(`
    <header class="hero">
      <div class="row sticker-row" id="heroRow" title="Poke the flowers">${stickerRow(3, 60)}</div>
      <h1 class="site-title">${esc(STATE.title)}</h1>
      ${STATE.subtitle ? `<p class="subtitle">${esc(STATE.subtitle)}</p>` : ""}
      ${dt >= 0 ? `<span class="counter">${dt.toLocaleString()} day${dt === 1 ? "" : "s"} together</span>` : ""}
      ${an && an.years > 0 ? `<div class="anniv">🎂 ${an.days === 0 ? "Happy anniversary!" : `${an.days} day${an.days === 1 ? "" : "s"} to our ${ordinal(an.years)} anniversary`}<small> · monthsary ${an.mdays === 0 ? "is today" : `in ${an.mdays} day${an.mdays === 1 ? "" : "s"}`}</small></div>` : ""}
    </header>
    <main class="wrap">
      <section class="tiles stagger reveal">${TILES.map(([p, t, label]) => `<a class="tile toy-${t}" href="${L(p)}"${t === "egg" ? " data-egg" : ""}><span class="toy">${toySVG(t)}</span><span class="tl">${label}</span></a>`).join("")}</section>
      ${mem ? `<a class="memory reveal" href="${L("/day/" + encodeURIComponent(mem[0].slug))}"><img src="${esc(mem[1])}" alt=""><div><small>✨ Memory of the day</small><b>${esc(mem[0].title || "A lovely day")}</b><span>${esc(prettyDate(mem[0].date))}</span></div></a>` : ""}
      <h2 class="sech reveal">Our days</h2>
      ${cards.length ? `<section class="grid stagger">${cards.join("")}</section>` : emptyMsg("No days yet. Open the edit link to add the first one.")}
    </main>${footerHTML()}`, () => {
    $("#heroRow").addEventListener("click", e => burst(e.clientX, e.clientY));
    const nd = $("#newDay");
    if (nd) nd.onclick = () => newDayDialog();
  });
}

function newDayDialog(date) {
  modal("A new day", `
    <label>Title<input name="title" placeholder="Our first picnic" autofocus></label>
    <label>Date<input type="date" name="date" value="${date || todayISO()}"></label>
    <label>Sticker</label>${stickerPickerRadios("badge")}`,
  fd => {
    const dt = fd.get("date") || todayISO();
    let slug = dt, n = 2;
    while (STATE.days.some(d => d.slug === slug)) slug = `${dt}-${n++}`;
    STATE.days.push({
      slug, date: dt, title: (fd.get("title") || "").trim() || "A new day", badge: fd.get("badge") || randSticker(),
      mood: "", weather: "", place: "",
      sections: [{ id: uid(), type: "note", title: "", data: SECTION_TYPES.note.make() }, { id: uid(), type: "gallery", title: "", data: SECTION_TYPES.gallery.make() }]
    });
    saveState();
    go("/day/" + encodeURIComponent(slug));
  });
}

/* ---------- A day ---------- */
function paintHead(d) {
  const el = $("#head");
  if (!el) return;
  const chips = [["Mood", d.mood], ["Weather", d.weather], ["Place", d.place]].filter(([, v]) => v).map(([k, v]) => `<span class="chip"><b>${k}</b>${esc(v)}</span>`).join("");
  el.innerHTML = `<span class="head-stk">${stickerHTML(d.badge, 76)}</span><h2>${esc(d.title || "Untitled day")}</h2><div class="date">${esc(prettyDate(d.date))}</div><div class="chips">${chips}</div>`;
  document.title = `${d.title || "Our day"} · ${STATE.title}`;
}
function dayEditPanel(d) {
  const list = stickerList().includes(d.badge) ? stickerList() : [d.badge, ...stickerList()];
  const f = (k, label, ph = "") => `<label>${label}<input data-f="${k}" value="${esc(d[k])}" placeholder="${ph}"></label>`;
  return `<section class="editpanel"><h3>✏️ This day</h3><div class="fields">
    ${f("title", "Title")}<label>Date<input type="date" data-f="date" value="${esc(d.date)}"></label>
    ${f("mood", "Mood", "Happy, cozy…")}${f("weather", "Weather", "Sunny, rainy…")}${f("place", "Place", "Where were we?")}
    <div class="wide"><span class="lab">Sticker</span><div class="stkpick-row">${list.map(id => `<button type="button" class="stkbtn${id === d.badge ? " on" : ""}" data-badge="${esc(id)}">${stickerHTML(id, 30)}</button>`).join("")}</div></div>
    </div><button type="button" class="danger" id="delDay">Delete this day</button></section>`;
}

async function pageDay(m) {
  const slug = decodeURIComponent(m[1]);
  const d = dayById(slug);
  if (!d) return pageNotFound();
  await resolveMedia(d.sections, d.slug);
  const list = sortedDays(), idx = list.indexOf(d), prev = list[idx - 1], next = list[idx + 1];
  done(`<main class="wrap day">${crumb()}
      <div class="day-head" id="head"></div>
      ${EDIT ? dayEditPanel(d) : ""}
      <div id="sections"></div>
      ${EDIT ? `<button type="button" class="addsec" id="addSec">＋ Add a section</button>` : ""}
      <nav class="pager">
        ${prev ? `<a href="${L("/day/" + encodeURIComponent(prev.slug))}">← ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a href="${L("/day/" + encodeURIComponent(next.slug))}">${esc(next.title)} →</a>` : "<span></span>"}
      </nav></main>${footerHTML()}`, () => {
    paintHead(d);
    renderSections(d);
    if (EDIT) {
      const panel = $(".editpanel");
      panel.addEventListener("input", e => { const f = e.target.dataset.f; if (f) { d[f] = e.target.value; saveSoon(); paintHead(d); } });
      panel.addEventListener("click", e => {
        const b = e.target.closest("[data-badge]");
        if (!b) return;
        d.badge = b.dataset.badge; saveState();
        $$(".stkbtn", panel).forEach(x => x.classList.toggle("on", x === b));
        paintHead(d);
      });
      $("#delDay").onclick = () => {
        if (!confirm(`Delete "${d.title || "this day"}" and everything in it?`)) return;
        walkMedia(d.sections, o => dropMedia(o));
        STATE.days = STATE.days.filter(x => x !== d);
        saveState(); go("/");
      };
      $("#addSec").onclick = () => addSectionDialog(d);
    }
  });
  const song = d.sections.find(s => s.type === "song" && !SECTION_TYPES.song.empty(s));
  const tr = song ? Music.trackFrom(song.data) : null;
  Music.forPage(tr, { embed: !!(song && !tr && embedFor(song.data.url)) });
}

/* ---------- Timeline ---------- */
async function pageTimeline() {
  document.title = "Timeline · " + STATE.title;
  const days = sortedDays();
  const covers = await Promise.all(days.map(dayCover));
  done(`<main class="wrap">${crumb()}${pageTitle("Our timeline", "Every day, in order.")}
    ${days.length ? `<ol class="timeline">${days.map((d, i) => {
      const st = dayStats(d), note = d.sections.find(s => s.type === "note" && s.data.text.trim());
      const chips = [st.photos && `📷 ${st.photos}`, st.videos && `🎬 ${st.videos}`, st.places && `📍 ${st.places}`, st.meals && `🍜 ${st.meals}`, st.spent && `🧾 ${money(st.spent)}`].filter(Boolean);
      return `<li class="tl-item ${i % 2 ? "r" : "l"} reveal"><span class="tl-dot">${stickerHTML(d.badge, 34)}</span>
        <a class="tl-card" href="${L("/day/" + encodeURIComponent(d.slug))}">${covers[i] ? `<img src="${esc(covers[i])}" alt="" loading="lazy">` : ""}
        <div><small>${esc(prettyDate(d.date, true))}</small><b>${esc(d.title || "Untitled day")}</b>${note ? `<p>${esc(note.data.text.slice(0, 110))}${note.data.text.length > 110 ? "…" : ""}</p>` : ""}
        ${chips.length ? `<span class="tl-chips">${chips.map(c => `<i>${esc(c)}</i>`).join("")}</span>` : ""}</div></a></li>`;
    }).join("")}</ol>` : emptyMsg("Nothing on the timeline yet.")}</main>${footerHTML()}`);
}

/* ---------- Map of every place ---------- */
async function pageMap() {
  document.title = "Our map · " + STATE.title;
  const pts = [];
  sortedDays().forEach(d => d.sections.forEach(s => { if (s.type === "places") s.data.rows.filter(hasGeo).forEach(r => pts.push({ r, d })); }));
  done(`<main class="wrap">${crumb()}${pageTitle("Our map", pts.length ? `${pts.length} place${pts.length === 1 ? "" : "s"} we've been to together.` : "")}
    ${pts.length ? `<div class="bigmap" id="bigmap"></div>
      <div class="maplist">${[...new Set(pts.map(p => p.d))].map(d => `<div class="ml-day"><a href="${L("/day/" + encodeURIComponent(d.slug))}">${stickerHTML(d.badge, 22)} ${esc(d.title)} <small>${esc(prettyDate(d.date, true))}</small></a>
        <ul>${pts.filter(p => p.d === d).map(p => `<li><button type="button" data-fly="${pts.indexOf(p)}">📍 ${esc(p.r.name || "Somewhere lovely")}</button></li>`).join("")}</ul></div>`).join("")}</div>`
      : emptyMsg("No places yet. Add a “Places &amp; map” section to a day and pin where you went.")}
    </main>${footerHTML()}`, () => {
    if (!pts.length) return;
    const m = new TinyMap($("#bigmap"), { wheel: true });
    pts.forEach(p => m.addMarker(+p.r.lat, +p.r.lng, `<div class="pin">${stickerHTML(p.d.badge, 26)}</div>`, { title: `${p.r.name || ""} (${p.d.title})`, onClick: () => go("/day/" + encodeURIComponent(p.d.slug)) }));
    m.fitBounds(pts.map(p => [+p.r.lat, +p.r.lng]), 50);
    onLeave(() => m.destroy());
    $(".maplist").addEventListener("click", e => {
      const b = e.target.closest("[data-fly]");
      if (!b) return;
      const p = pts[+b.dataset.fly];
      m.setView(+p.r.lat, +p.r.lng, 13);
      $("#bigmap").scrollIntoView({ block: "center", behavior: "smooth" });
    });
  });
}

/* ---------- Calendar ---------- */
async function pageCalendar(m) {
  const now = new Date();
  const y = m && m[1] ? +m[1] : now.getFullYear(), mo = m && m[2] ? +m[2] - 1 : now.getMonth();
  const first = new Date(y, mo, 1), n = new Date(y, mo + 1, 0).getDate();
  const byDate = {};
  STATE.days.forEach(d => { (byDate[d.date] = byDate[d.date] || []).push(d); });
  const ym = (yy, mm) => { const dd = new Date(yy, mm, 1); return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`; };
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(`<div class="cal-day blank"></div>`);
  for (let k = 1; k <= n; k++) {
    const iso = `${y}-${String(mo + 1).padStart(2, "0")}-${String(k).padStart(2, "0")}`;
    const list = byDate[iso], isToday = iso === todayISO();
    if (list) cells.push(`<a class="cal-day has${isToday ? " today" : ""}" href="${L("/day/" + encodeURIComponent(list[0].slug))}" title="${esc(list.map(d => d.title).join(", "))}"><span>${k}</span>${stickerHTML(list[0].badge, 26)}</a>`);
    else if (EDIT) cells.push(`<button type="button" class="cal-day free${isToday ? " today" : ""}" data-new="${iso}" title="Add a day here"><span>${k}</span><i>＋</i></button>`);
    else cells.push(`<div class="cal-day${isToday ? " today" : ""}"><span>${k}</span></div>`);
  }
  const label = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  document.title = "Calendar · " + STATE.title;
  done(`<main class="wrap">${crumb()}${pageTitle("Calendar")}
    <div class="cal"><div class="cal-nav"><a href="${L("/calendar/" + ym(y, mo - 1))}" aria-label="Previous month">‹</a><b>${label}</b><a href="${L("/calendar/" + ym(y, mo + 1))}" aria-label="Next month">›</a></div>
    <div class="cal-grid">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(w => `<div class="cal-w">${w}</div>`).join("")}${cells.join("")}</div></div></main>${footerHTML()}`, () => {
    $(".cal-grid").addEventListener("click", e => { const b = e.target.closest("[data-new]"); if (b) newDayDialog(b.dataset.new); });
  });
}

/* ---------- Stats ---------- */
async function pageStats() {
  document.title = "Our stats · " + STATE.title;
  const t = { photos: 0, videos: 0, places: 0, meals: 0, movies: 0, spent: 0, outfits: 0, songs: 0, quotes: 0, ticks: 0 };
  STATE.days.forEach(d => { const s = dayStats(d); for (const k in t) t[k] += s[k]; });
  const moods = {};
  STATE.days.forEach(d => { const k = (d.mood || "").trim().toLowerCase(); if (k) moods[k] = (moods[k] || 0) + 1; });
  const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];
  const bdone = STATE.bucket.filter(b => b.done).length;
  const dt = daysTogether();
  const stats = [
    dt >= 0 && ["days together", dt], ["days remembered", STATE.days.length], ["photos", t.photos], ["videos", t.videos],
    ["places visited", t.places], ["things we ate", t.meals], ["movies & shows", t.movies], ["songs of the day", t.songs],
    ["quotes saved", t.quotes], ["outfit days", t.outfits], ["bucket list ticks", bdone], ["love letters", STATE.letters.length],
    t.spent > 0 && ["spent together", t.spent, true]
  ].filter(Boolean);
  done(`<main class="wrap">${crumb()}${pageTitle("Our stats", "Our little numbers.")}
    <section class="statgrid stagger">${stats.map(([l, v, mny]) => `<div class="stat reveal"><span class="st-i">${stickerHTML(randSticker(), 34)}</span><b data-n="${v}"${mny ? " data-money" : ""}>0</b><small>${l}</small></div>`).join("")}</section>
    ${topMood ? `<p class="statnote">Our most common mood: <b>${esc(topMood[0])}</b> (${topMood[1]} day${topMood[1] === 1 ? "" : "s"})</p>` : ""}
    ${STATE.bucket.length ? `<p class="statnote">Bucket list: ${bdone} of ${STATE.bucket.length} done</p>` : ""}</main>${footerHTML()}`, () => {
    $$("[data-n]").forEach(el => countUp(el, +el.dataset.n, el.hasAttribute("data-money") ? money : undefined));
  });
}

/* ---------- Favorites ---------- */
const FAV = [["songs", "🎵", "Our songs"], ["foods", "🍜", "Our foods"], ["films", "🎬", "Our films & shows"], ["places", "📍", "Our places"]];
async function pageFavorites() {
  document.title = "Favorites · " + STATE.title;
  const paint = () => {
    done(`<main class="wrap">${crumb()}${pageTitle("Our favorites")}
      <section class="favgrid stagger">${FAV.map(([k, e, label]) => `<div class="favcard reveal"><h3><span>${e}</span>${label}</h3>
        <ul>${STATE.favorites[k].map(it => `<li>${esc(it.text)}${EDIT ? `<button type="button" class="x" data-del="${k}:${it.id}">✕</button>` : ""}</li>`).join("") || `<li class="muted">${EDIT ? "Add the first one below" : "Nothing yet"}</li>`}</ul>
        ${EDIT ? `<form class="addline" data-k="${k}"><input placeholder="Add one…" required><button class="primary">Add</button></form>` : ""}</div>`).join("")}</section></main>${footerHTML()}`, () => {
      $$(".addline").forEach(f => f.addEventListener("submit", e => {
        e.preventDefault();
        const v = $("input", f).value.trim();
        if (!v) return;
        STATE.favorites[f.dataset.k].push({ id: uid(), text: v });
        saveState(); paint();
      }));
      $$("[data-del]").forEach(b => b.onclick = () => {
        const [k, id] = b.dataset.del.split(":");
        STATE.favorites[k] = STATE.favorites[k].filter(x => x.id !== id);
        saveState(); paint();
      });
    });
  };
  paint();
}

/* ---------- Bucket list ---------- */
async function pageBucket() {
  document.title = "Bucket list · " + STATE.title;
  const paint = () => {
    const done_ = STATE.bucket.filter(b => b.done).length, total = STATE.bucket.length, pct = total ? Math.round(done_ / total * 100) : 0;
    done(`<main class="wrap narrow">${crumb()}${pageTitle("Our bucket list", total ? `${done_} of ${total} done` : "")}
      ${total ? `<div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>` : ""}
      <ul class="bucket stagger">${STATE.bucket.map(b => `<li class="reveal${b.done ? " done" : ""}">
        ${EDIT ? `<button type="button" class="chk" data-tog="${b.id}" aria-label="Tick off">${b.done ? "✓" : ""}</button>` : `<span class="chk">${b.done ? "✓" : ""}</span>`}
        <span class="bt">${esc(b.text)}${b.done && b.doneDate ? `<small>${esc(prettyDate(b.doneDate, true))}</small>` : ""}</span>
        ${EDIT ? `<button type="button" class="x" data-del="${b.id}">✕</button>` : ""}</li>`).join("") || `<li class="muted">${EDIT ? "Add your first dream below." : "Nothing on the list yet."}</li>`}</ul>
      ${EDIT ? `<form class="addline" id="bkForm"><input placeholder="Something we want to do together…" required><button class="primary">Add</button></form>` : ""}</main>${footerHTML()}`, () => {
      const f = $("#bkForm");
      if (f) f.addEventListener("submit", e => {
        e.preventDefault();
        const v = $("input", f).value.trim();
        if (!v) return;
        STATE.bucket.push({ id: uid(), text: v, done: false, doneDate: "" });
        saveState(); paint();
      });
      $$("[data-tog]").forEach(b => b.onclick = e => {
        const it = STATE.bucket.find(x => x.id === b.dataset.tog);
        it.done = !it.done; it.doneDate = it.done ? todayISO() : "";
        saveState();
        if (it.done) burst(e.clientX, e.clientY, 7);
        paint();
      });
      $$("[data-del]").forEach(b => b.onclick = () => {
        STATE.bucket = STATE.bucket.filter(x => x.id !== b.dataset.del);
        saveState(); paint();
      });
    });
  };
  paint();
}

/* ---------- Date jar ---------- */
async function pageJar() {
  document.title = "Date jar · " + STATE.title;
  const paint = () => {
    done(`<main class="wrap narrow">${crumb()}${pageTitle("The date jar", "Shake it and see what we're doing next.")}
      <div class="jarstage"><button type="button" class="jarbtn" id="jarBtn" aria-label="Shake the jar">${toySVG("jar")}</button>
        <div class="slip" id="slip" aria-live="polite">${STATE.jar.length ? "Tap the jar!" : "The jar is empty."}</div></div>
      ${EDIT ? `<ul class="jarlist">${STATE.jar.map(j => `<li>${esc(j.text)}<button type="button" class="x" data-del="${j.id}">✕</button></li>`).join("")}</ul>
        <form class="addline" id="jarForm"><input placeholder="A date idea to pop in the jar…" required><button class="primary">Add</button></form>` : ""}</main>${footerHTML()}`, () => {
      let last = -1;
      $("#jarBtn").onclick = e => {
        if (!STATE.jar.length) return;
        const btn = e.currentTarget, slip = $("#slip");
        btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
        slip.classList.remove("pop");
        const x = e.clientX, y = e.clientY;
        setTimeout(() => {
          let i; do { i = Math.floor(Math.random() * STATE.jar.length); } while (STATE.jar.length > 1 && i === last);
          last = i;
          slip.textContent = STATE.jar[i].text;
          void slip.offsetWidth; slip.classList.add("pop");
          burst(x, y, 8);
        }, 700);
      };
      const f = $("#jarForm");
      if (f) f.addEventListener("submit", e => {
        e.preventDefault();
        const v = $("input", f).value.trim();
        if (!v) return;
        STATE.jar.push({ id: uid(), text: v });
        saveState(); paint();
      });
      $$("[data-del]").forEach(b => b.onclick = () => { STATE.jar = STATE.jar.filter(x => x.id !== b.dataset.del); saveState(); paint(); });
    });
  };
  paint();
}

/* ---------- Letters ---------- */
function openLetter(l) {
  const [na, nb] = names();
  const dlg = openDialog(`<div class="letter-open"><div class="lt-env"><i class="lt-flap"></i></div>
    <article class="lt-paper"><small>${esc(l.when || "Open when…")}</small><div class="lt-body">${esc(l.body)}</div><p class="lt-sig">— ${esc(l.from === "b" ? nb : na)}</p></article>
    <button type="button" class="ghostb" data-close>Close</button></div>`, "letter");
  $("[data-close]", dlg).onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
}
function letterForm(l) {
  const [na, nb] = names();
  modal(l ? "Edit letter" : "Write a letter", `
    <label>Open when…<input name="when" value="${esc(l ? l.when : "Open when you miss me")}" required></label>
    <label>From<select name="from"><option value="a"${l && l.from === "a" ? " selected" : ""}>${esc(na)}</option><option value="b"${!l || l.from === "b" ? (l ? " selected" : "") : ""}>${esc(nb)}</option></select></label>
    <label>Locked until (optional)<input type="date" name="unlock" value="${esc(l ? l.unlock : "")}"></label>
    <label>Letter<textarea name="body" rows="7" required>${esc(l ? l.body : "")}</textarea></label>`,
  fd => {
    const v = { when: fd.get("when").trim(), from: fd.get("from"), unlock: fd.get("unlock") || "", body: fd.get("body") };
    if (l) Object.assign(l, v); else STATE.letters.push(Object.assign({ id: uid() }, v));
    saveState(); pageLetters();
  });
}
async function pageLetters() {
  document.title = "Letters · " + STATE.title;
  done(`<main class="wrap">${crumb()}${pageTitle("Open when…", "Little letters, saved for the right moment.")}
    <section class="lettergrid stagger">${STATE.letters.map(l => {
      const locked = l.unlock && l.unlock > todayISO() && !EDIT;
      return `<div class="lcard reveal${locked ? " locked" : ""}"><button type="button" class="lbtn" data-open="${l.id}"><span class="lenv">${toySVG("letter")}</span><b>${esc(l.when)}</b>${locked ? `<small>🔒 opens ${esc(prettyDate(l.unlock, true))}</small>` : ""}</button>
        ${EDIT ? `<div class="lctl"><button type="button" data-edit="${l.id}">✏️</button><button type="button" data-del="${l.id}">🗑</button></div>` : ""}</div>`;
    }).join("") || ""}${EDIT ? `<button type="button" class="lcard newcard" id="newLetter"><span class="plus">＋</span><span>Write a letter</span></button>` : ""}</section>
    ${!STATE.letters.length && !EDIT ? emptyMsg("No letters yet.") : ""}</main>${footerHTML()}`, () => {
    $$("[data-open]").forEach(b => b.onclick = () => {
      const l = STATE.letters.find(x => x.id === b.dataset.open);
      if (l.unlock && l.unlock > todayISO() && !EDIT) { b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); toast(`This one opens on ${prettyDate(l.unlock, true)} 💌`); return; }
      openLetter(l);
    });
    $$("[data-edit]").forEach(b => b.onclick = () => letterForm(STATE.letters.find(x => x.id === b.dataset.edit)));
    $$("[data-del]").forEach(b => b.onclick = () => { if (confirm("Delete this letter?")) { STATE.letters = STATE.letters.filter(x => x.id !== b.dataset.del); saveState(); pageLetters(); } });
    const nl = $("#newLetter");
    if (nl) nl.onclick = () => letterForm(null);
  });
}

/* ---------- About us ---------- */
async function pageAbout() {
  document.title = "About us · " + STATE.title;
  const [na, nb] = names(), dt = daysTogether();
  const paint = () => done(`<main class="wrap">${crumb()}${pageTitle("About us")}
    <section class="aboutpair reveal"><div class="ab-who">${avatarSVG(avatarFor("a"), "bounce")}<b>${esc(na)}</b></div><span class="ab-heart">${stickerHTML("heart", 44)}</span><div class="ab-who">${avatarSVG(avatarFor("b"), "bounce d2")}<b>${esc(nb)}</b></div></section>
    ${STATE.since ? `<p class="statnote">Together since <b>${esc(prettyDate(STATE.since))}</b>${dt >= 0 ? ` · ${dt.toLocaleString()} days` : ""}</p>` : ""}
    ${EDIT ? `<textarea class="bigta" id="story" rows="6" placeholder="How did we meet? Tell our story…">${esc(STATE.about.story)}</textarea>`
      : STATE.about.story.trim() ? `<div class="note">${esc(STATE.about.story)}</div>` : ""}
    ${EDIT || STATE.about.facts.length ? `<section class="facts"><h3>Little facts</h3><ul>${STATE.about.facts.map((f, i) => EDIT
      ? `<li class="rowline" data-i="${i}"><input class="grow" data-k="k" value="${esc(f.k)}" placeholder="Favorite…"><input class="grow" data-k="v" value="${esc(f.v)}" placeholder="…is"><button type="button" class="x" data-delfact="${i}">✕</button></li>`
      : `<li><span>${esc(f.k)}</span><b>${esc(f.v)}</b></li>`).join("")}</ul>${EDIT ? `<button type="button" class="addrow" id="addFact">＋ Add a fact</button>` : ""}</section>` : ""}
    ${EDIT ? `<section class="looks"><h3>Dress up the mini us</h3><p class="hint">Their looks here are the base. Each day's outfit section only changes the clothes.</p><div class="outfit-edit"><div><h4>${esc(na)}</h4><div data-av="a"></div></div><div><h4>${esc(nb)}</h4><div data-av="b"></div></div></div></section>` : ""}
    </main>${footerHTML()}`, () => {
    if (!EDIT) return;
    $("#story").addEventListener("input", e => { STATE.about.story = e.target.value; saveSoon(); });
    $("#addFact").onclick = () => { STATE.about.facts.push({ k: "", v: "" }); saveState(); paint(); };
    $(".facts").addEventListener("input", e => { const li = e.target.closest("[data-i]"); if (li && e.target.dataset.k) { STATE.about.facts[+li.dataset.i][e.target.dataset.k] = e.target.value; saveSoon(); } });
    $$("[data-delfact]").forEach(b => b.onclick = () => { STATE.about.facts.splice(+b.dataset.delfact, 1); saveState(); paint(); });
    ["a", "b"].forEach(w => avatarBuilder($(`[data-av=${w}]`), {
      get: () => avatarFor(w), groups: BASE_GROUPS,
      set: (k, v) => { STATE.about[w][k] = v; saveSoon(); }
    }));
  });
  paint();
}

/* ---------- Stickers (edit mode) ---------- */
async function pageStickers() {
  if (!EDIT) return go("/", true);
  document.title = "Stickers · " + STATE.title;
  const paint = () => done(`<main class="wrap">${crumb()}${pageTitle("Our stickers", "These pop up randomly across the site: the background, headers, day badges and more.")}
    <section class="stk-sec"><h3>In the garden now</h3><div class="stk-grid">${STATE.stickers.map(id => `<div class="stk-item">${stickerHTML(id, 44)}<button type="button" class="x" data-rm="${esc(id)}" title="Remove">✕</button></div>`).join("")}</div>
      <p class="hint">${STATE.stickers.length} sticker${STATE.stickers.length === 1 ? "" : "s"}. The more you add, the more varied it looks.</p></section>
    <section class="stk-sec"><h3>Add emoji</h3><form class="addline" id="emoForm"><input id="emoIn" placeholder="Paste or type emoji, e.g. 🐝🦋🍓" required><button class="primary">Add</button></form></section>
    <section class="stk-sec"><h3>Add your own pictures</h3><button type="button" class="ghostb" id="upStk">＋ Upload small images (png, jpg, gif, webp)</button><p class="hint">Transparent PNGs look best.</p></section>
    <section class="stk-sec"><h3>Ideas</h3><div class="stk-grid sugg">${SUGGESTED.map(id => { const on = STATE.stickers.includes(id); return `<button type="button" class="stk-item sg${on ? " on" : ""}" data-sg="${esc(id)}" title="${on ? "Added" : "Add"}">${stickerHTML(id, 38)}</button>`; }).join("")}</div></section>
    <section class="stk-sec"><h3>Preview</h3><div class="stk-prev" id="stkPrev">${stickerRow(8, 44)}</div><button type="button" class="ghostb" id="shuffle">Shuffle</button> <button type="button" class="ghostb" id="stkReset">Back to the first three</button></section></main>${footerHTML()}`, () => {
    const refresh = () => { saveState(); initBackground(); paint(); };
    $$("[data-rm]").forEach(b => b.onclick = () => {
      if (STATE.stickers.length <= 1) { toast("Keep at least one sticker."); return; }
      STATE.stickers = STATE.stickers.filter(x => x !== b.dataset.rm);
      refresh();
    });
    $$("[data-sg]").forEach(b => b.onclick = () => {
      const id = b.dataset.sg;
      if (STATE.stickers.includes(id)) { if (STATE.stickers.length > 1) STATE.stickers = STATE.stickers.filter(x => x !== id); }
      else STATE.stickers.push(id);
      refresh();
    });
    $("#emoForm").addEventListener("submit", e => {
      e.preventDefault();
      const txt = $("#emoIn").value;
      const parts = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(txt)].map(x => x.segment) : [...txt];
      let added = 0;
      parts.filter(p => p.trim() && !/^[\w\s.,;:!?'"()-]+$/.test(p)).forEach(p => { const id = "e:" + p; if (!STATE.stickers.includes(id)) { STATE.stickers.push(id); added++; } });
      if (!added) { toast("I couldn't find any new emoji in that."); return; }
      refresh();
    });
    $("#upStk").onclick = async () => {
      const files = (await pickFiles(true, "image/*")).filter(f => fileKind(f) === "image");
      if (!files.length) return;
      for (const f of files) {
        try { const m = await storeFile(f, { max: 160 }); await srcUrl(m.src); STATE.stickers.push("img:" + m.src.slice(4)); } catch (e) { toast("Couldn't store " + f.name); }
      }
      refresh();
    };
    $("#shuffle").onclick = () => { $("#stkPrev").innerHTML = stickerRow(8, 44); initBackground(); };
    $("#stkReset").onclick = () => { if (confirm("Go back to just the sunflower, lily and mushroom?")) { STATE.stickers = ["sunflower", "lily", "mushroom"]; refresh(); } };
  });
  paint();
}

/* ---------- Surprise me, and not found ---------- */
async function pageRandom() {
  const days = STATE.days;
  if (!days.length) return go("/", true);
  const d = pick(days);
  history.replaceState({}, "", L("/day/" + encodeURIComponent(d.slug)));
  return pageDay([null, encodeURIComponent(d.slug)]);
}
async function pageNotFound() {
  document.title = "Lost · " + STATE.title;
  done(`<main class="wrap">${crumb()}<div class="notfound">${emptyMsg("Hmm, we couldn't find that page.")}</div></main>${footerHTML()}`);
}
