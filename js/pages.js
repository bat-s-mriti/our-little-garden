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
const HOOK = `<svg class="hook" viewBox="0 0 100 26" aria-hidden="true"><circle cx="50" cy="4" r="3.6" fill="#8a6a4a"/><path d="M50 5 L16 26 M50 5 L84 26" stroke="#b08a5a" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>`;
// [path, toy, label, classes]: things on the walls first, then things on the tables
const ROOM = [
  ["/calendar", "calendar", "Calendar", "cal hang"], ["/map", "map", "Our map", "map hang"], ["/stats", "bee", "Our stats", "bee"],
  ["/timeline", "window", "Timeline", "win"], ["/about-us", "frame", "About us", "frm hang"],
  ["/date-jar", "jar", "Date jar", "jar t"], ["/bucket-list", "pail", "Bucket list", "pail t"], ["/letters", "letter", "Open when…", "let t"], ["/random", "eggnest", "Surprise me!", "egg t"]
];
const roomHTML = () => `<nav class="room" aria-label="Pages"><i class="wallp l"></i><i class="wallp r"></i>${ROOM.map(([p, t, label, cls], i) =>
  `<a class="it ${cls}" style="--i:${i}" href="${L(p)}" aria-label="${label}"${t === "eggnest" ? " data-egg" : ""}>${cls.includes("hang") ? HOOK : ""}<span class="toy">${toySVG(t)}</span><span class="tag">${label}</span></a>`
  + (cls.includes("pail") ? `<i class="plank l"></i>` : i === ROOM.length - 1 ? `<i class="plank r"></i>` : "")).join("")}</nav>`;

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
    ${roomHTML()}
    <main class="wrap home">
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
function homePins() {
  return ["a", "b"].map(w => ({ w, p: STATE.about.p[w] })).filter(h => hasPin(h.p) && canSee(h.p, "addr"));
}
async function pageMap() {
  document.title = "Our map · " + STATE.title;
  const pts = [], homes = homePins();
  sortedDays().forEach(d => d.sections.forEach(s => { if (s.type === "places") s.data.rows.filter(hasGeo).forEach(r => pts.push({ r, d })); }));
  const sub = [pts.length ? `${pts.length} place${pts.length === 1 ? "" : "s"} we've been to together` : "", homes.length ? `${homes.length === 2 ? "both our homes" : "a home"} pinned` : ""].filter(Boolean).join(" · ");
  done(`<main class="wrap">${crumb()}${pageTitle("Our map", sub ? sub + "." : "")}
    ${pts.length || homes.length ? `<div class="bigmap" id="bigmap"></div>
      <div class="maplist">${homes.length ? `<div class="ml-day"><a href="${L("/about-us")}">${stickerHTML("e:🏡", 22)} Our homes</a>
        <ul>${homes.map((h, i) => `<li><button type="button" data-flyh="${i}">🏡 ${esc(names()[h.w === "a" ? 0 : 1])}${h.p.addr ? " · " + esc(h.p.addr) : ""}</button></li>`).join("")}</ul></div>` : ""}
      ${[...new Set(pts.map(p => p.d))].map(d => `<div class="ml-day"><a href="${L("/day/" + encodeURIComponent(d.slug))}">${stickerHTML(d.badge, 22)} ${esc(d.title)} <small>${esc(prettyDate(d.date, true))}</small></a>
        <ul>${pts.filter(p => p.d === d).map(p => `<li><button type="button" data-fly="${pts.indexOf(p)}">📍 ${esc(p.r.name || "Somewhere lovely")}</button></li>`).join("")}</ul></div>`).join("")}</div>`
      : emptyMsg("No places yet. Add a “Places &amp; map” section to a day and pin where you went, or pin your homes in About us.")}
    </main>${footerHTML()}`, () => {
    if (!pts.length && !homes.length) return;
    const m = new TinyMap($("#bigmap"), { wheel: true });
    pts.forEach(p => m.addMarker(+p.r.lat, +p.r.lng, `<div class="pin">${stickerHTML(p.d.badge, 26)}</div>`, { title: `${p.r.name || ""} (${p.d.title})`, onClick: () => go("/day/" + encodeURIComponent(p.d.slug)) }));
    homes.forEach(h => m.addMarker(+h.p.lat, +h.p.lng, `<div class="pin">${stickerHTML("e:🏡", 30)}</div>`, { title: `${names()[h.w === "a" ? 0 : 1]}'s home`, onClick: () => go("/about-us") }));
    if (homes.length === 2) m.setLine(homes.map(h => [+h.p.lat, +h.p.lng]));
    m.fitBounds([...pts.map(p => [+p.r.lat, +p.r.lng]), ...homes.map(h => [+h.p.lat, +h.p.lng])], 50);
    onLeave(() => m.destroy());
    $(".maplist").addEventListener("click", e => {
      const b = e.target.closest("[data-fly],[data-flyh]");
      if (!b) return;
      const q = b.dataset.flyh !== undefined ? homes[+b.dataset.flyh].p : pts[+b.dataset.fly].r;
      m.setView(+q.lat, +q.lng, 13);
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
const FAV = [["songs", "🎵", "Songs"], ["foods", "🍜", "Foods"], ["films", "🎬", "Films & shows"], ["places", "📍", "Places"]];
const FIELD_LABELS = { full: "Full name", nick: "Also called", birth: "Birthday", addr: "Home", phone: "Phone", email: "Email" };
const EXTRA_IDEAS = ["Hometown", "Works or studies", "Height", "Blood group", "Languages", "Favourite colour", "Hobbies", "Dream job", "Love language"];
const ZODIAC = [["Capricorn", "♑", 1, 19], ["Aquarius", "♒", 2, 18], ["Pisces", "♓", 3, 20], ["Aries", "♈", 4, 19], ["Taurus", "♉", 5, 20], ["Gemini", "♊", 6, 20], ["Cancer", "♋", 7, 22], ["Leo", "♌", 8, 22], ["Virgo", "♍", 9, 22], ["Libra", "♎", 10, 22], ["Scorpio", "♏", 11, 21], ["Sagittarius", "♐", 12, 21], ["Capricorn", "♑", 12, 31]];

const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseISO = iso => { const d = new Date(iso + "T00:00:00"); return isNaN(d) ? null : d; };
function addMonthsClamped(b, n) {
  const y = b.getFullYear() + Math.floor((b.getMonth() + n) / 12), mo = ((b.getMonth() + n) % 12 + 12) % 12;
  return new Date(y, mo, Math.min(b.getDate(), new Date(y, mo + 1, 0).getDate()));
}
/* age as whole years, months and days; { y, m, d, days } or null */
function ageParts(iso, now = new Date()) {
  const b = parseISO(iso), t = dateOnly(now);
  if (!b || b > t) return null;
  let months = (t.getFullYear() - b.getFullYear()) * 12 + t.getMonth() - b.getMonth();
  let anchor = addMonthsClamped(b, months);
  if (anchor > t) { months--; anchor = addMonthsClamped(b, months); }
  return { y: Math.floor(months / 12), m: months % 12, d: Math.round((t - anchor) / 86400000), days: Math.round((t - b) / 86400000) };
}
/* next birthday: { days (0 = today), turning }; 29 Feb falls on 28 Feb in other years */
function nextBirthday(iso, now = new Date()) {
  const b = parseISO(iso), t = dateOnly(now);
  if (!b) return null;
  const on = y => new Date(y, b.getMonth(), Math.min(b.getDate(), new Date(y, b.getMonth() + 1, 0).getDate()));
  let n = on(t.getFullYear());
  if (n < t) n = on(t.getFullYear() + 1);
  return { days: Math.round((n - t) / 86400000), turning: n.getFullYear() - b.getFullYear() };
}
function zodiacOf(iso) {
  const b = parseISO(iso);
  if (!b) return null;
  const m = b.getMonth() + 1, d = b.getDate();
  return ZODIAC.find(z => m < z[2] || (m === z[2] && d <= z[3])) || ZODIAC[0];
}
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const ageText = a => a ? [a.y ? plural(a.y, "year") : "", a.m ? plural(a.m, "month") : "", plural(a.d, "day")].filter(Boolean).join(", ") : "";

/* distances */
const hasPin = p => p && hasGeo({ lat: p.lat, lng: p.lng });
function haversineKm(a, b) {
  const R = 6371.0088, r = x => x * Math.PI / 180;
  const dLa = r(b[0] - a[0]), dLn = r(b[1] - a[1]);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLn / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function bearingDeg(a, b) {
  const r = x => x * Math.PI / 180, dLn = r(b[1] - a[1]);
  const y = Math.sin(dLn) * Math.cos(r(b[0])), x = Math.cos(r(a[0])) * Math.sin(r(b[0])) - Math.sin(r(a[0])) * Math.cos(r(b[0])) * Math.cos(dLn);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
const COMPASS = ["north", "north-north-east", "north-east", "east-north-east", "east", "east-south-east", "south-east", "south-south-east", "south", "south-south-west", "south-west", "west-south-west", "west", "west-north-west", "north-west", "north-north-west"];
const compassOf = deg => COMPASS[Math.round(deg / 22.5) % 16];
function fmtKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 100 ? km.toFixed(1) : Math.round(km).toLocaleString()} km`;
}
function fmtDur(min) {
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h >= 48 ? `${Math.floor(h / 24)} days ${h % 24} h` : `${h} h ${m} min`;
}
/* by-road distance from the free OSRM demo server; the answer is remembered in the data so visitors do not need it */
const routeKey = (a, b) => [a, b].map(p => (+p[0]).toFixed(4) + "," + (+p[1]).toFixed(4)).join("|");
async function roadRoute(a, b) {
  const k = routeKey(a, b), c = STATE.about.route;
  if (c && c.k === k) return c;
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`);
    const j = await r.json();
    const res = j.code === "Ok" && j.routes && j.routes[0]
      ? { k, km: j.routes[0].distance / 1000, min: j.routes[0].duration / 60 }
      : { k, km: null, min: null };   // no road between them (an ocean, say)
    if (EDIT) { STATE.about.route = res; saveSoon(); }
    return res;
  } catch (e) { return null; }
}

const canSee = (p, k) => EDIT || !(p.hide || []).includes(k);
const lockMark = (p, k) => (EDIT && (p.hide || []).includes(k) ? ` <span class="lockmark" title="Only you can see this">🔒</span>` : "");

function bdayLines(p) {
  const a = ageParts(p.birth), nb = nextBirthday(p.birth), z = zodiacOf(p.birth);
  if (!nb) return "";
  const cd = nb.days === 0 ? `🎉 Happy birthday! Turning ${nb.turning} today` : `🎂 ${plural(nb.days, "day")} to go · turning ${nb.turning}`;
  return `${a ? `<div class="agebig">${esc(ageText(a))}</div>` : ""}<div class="bd-count${nb.days === 0 ? " today" : ""}">${cd}</div>${z ? `<small>${z[1]} ${z[0]}</small>` : ""}`;
}

function profileView(w) {
  const p = STATE.about.p[w], nm = names()[w === "a" ? 0 : 1];
  const rows = [];
  if (p.full && canSee(p, "full")) rows.push(["Full name", esc(p.full) + lockMark(p, "full")]);
  if (p.nick && canSee(p, "nick")) rows.push(["Also called", esc(p.nick) + lockMark(p, "nick")]);
  if (p.birth && canSee(p, "birth")) rows.push(["Birthday", `${esc(prettyDate(p.birth))}${lockMark(p, "birth")}<div class="bd">${bdayLines(p)}</div>`]);
  if (p.addr && canSee(p, "addr")) rows.push(["Home", `${esc(p.addr)}${lockMark(p, "addr")}${hasPin(p) ? ` · <a href="${L("/map")}">on our map</a>` : ""}`]);
  if (p.phone && canSee(p, "phone")) rows.push(["Phone", `<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a>${lockMark(p, "phone")}`]);
  if (p.email && canSee(p, "email")) rows.push(["Email", `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>${lockMark(p, "email")}`]);
  p.extra.filter(r => r.k && r.v && (EDIT || !r.priv)).forEach(r => rows.push([esc(r.k), esc(r.v) + (EDIT && r.priv ? ` <span class="lockmark" title="Only you can see this">🔒</span>` : "")]));
  const favs = FAV.filter(([k]) => p.favs[k].length).map(([k, e, label]) => `<div class="pfav"><h4>${e} ${label}</h4><ul>${p.favs[k].map(it => `<li>${esc(it.text)}</li>`).join("")}</ul></div>`).join("");
  return `<article class="prof reveal"><h3>${esc(nm)}</h3>
    ${rows.length ? `<dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : `<p class="muted">Nothing here yet.</p>`}
    ${favs ? `<div class="pfavs">${favs}</div>` : ""}</article>`;
}

function profileEdit(w) {
  const p = STATE.about.p[w], nm = names()[w === "a" ? 0 : 1];
  const f = (k, type = "text", ph = "") => `<div class="pf"><label>${FIELD_LABELS[k]}</label><input type="${type}" data-f="${k}" value="${esc(p[k])}" placeholder="${esc(ph)}" autocomplete="off"><label class="lockt" title="Tick to hide this from visitors"><input type="checkbox" data-lock="${k}" ${p.hide.includes(k) ? "checked" : ""}><span>🔒</span></label></div>`;
  return `<article class="prof editing" data-w="${w}"><h3>${esc(nm)}</h3>
    ${f("full", "text", "Full name")}${f("nick", "text", "Nicknames, separated by commas")}${f("birth", "date")}<p class="calc" data-calc></p>
    ${f("addr", "text", "Street, city, country")}
    <div class="pf pinrow"><label></label><button type="button" class="ghostb" data-pin>📍 ${hasPin(p) ? "Move the pin" : "Pin the home on the map"}</button>${hasPin(p) ? `<span class="muted">pinned</span><button type="button" class="x" data-unpin title="Remove pin">✕</button>` : ""}</div>
    ${f("phone", "tel", "+977 …")}${f("email", "email", "name@example.com")}
    <div class="pxtra">${p.extra.map((r, i) => `<div class="pf" data-x="${i}"><input class="xk" data-xk="k" value="${esc(r.k)}" placeholder="e.g. Hometown"><input data-xk="v" value="${esc(r.v)}" placeholder="…is"><label class="lockt" title="Tick to hide this from visitors"><input type="checkbox" data-xlock ${r.priv ? "checked" : ""}><span>🔒</span></label><button type="button" class="x" data-xdel="${i}">✕</button></div>`).join("")}
      <div class="ideas"><button type="button" class="addrow" data-xadd>＋ Add a detail</button>${EXTRA_IDEAS.filter(x => !p.extra.some(r => r.k === x)).slice(0, 6).map(x => `<button type="button" class="chipb" data-xidea="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
    <div class="pfavs">${FAV.map(([k, e, label]) => `<div class="pfav"><h4>${e} ${label}</h4><ul>${p.favs[k].map(it => `<li>${esc(it.text)}<button type="button" class="x" data-fdel="${k}:${it.id}">✕</button></li>`).join("") || `<li class="muted">None yet</li>`}</ul>
      <form class="addline" data-fadd="${k}"><input placeholder="Add one…" required><button class="primary">Add</button></form></div>`).join("")}</div></article>`;
}

function betweenHTML() {
  const [A, B] = [STATE.about.p.a, STATE.about.p.b];
  const ok = p => hasPin(p) && canSee(p, "addr");
  if (!(ok(A) && ok(B))) return EDIT ? `<section class="between"><h3>Between our homes</h3><p class="hint">Pin both homes (📍 above) to see the map and how far apart you are. The pins stay hidden from visitors while 🔒 is ticked on the home.</p></section>` : "";
  const a = [+A.lat, +A.lng], b = [+B.lat, +B.lng], km = haversineKm(a, b), br = bearingDeg(a, b);
  const [na, nb] = names();
  return `<section class="between reveal"><h3>Between our homes</h3>
    <div class="homesmap" id="homesmap"></div>
    <div class="dist">
      <div><b>${fmtKm(km)}</b><span>Displacement</span><small>${km < 0.05 ? "the very same spot 🏡" : `in a straight line, ${esc(na || "A")} → ${esc(nb || "B")}: ${esc(compassOf(br))} (${Math.round(br)}°)`}</small></div>
      <div><b id="roadkm">…</b><span>Distance</span><small id="roadnote">by road</small></div>
    </div></section>`;
}
async function mountBetween() {
  const [A, B] = [STATE.about.p.a, STATE.about.p.b];
  if (!$("#homesmap")) return;
  const a = [+A.lat, +A.lng], b = [+B.lat, +B.lng];
  const m = new TinyMap($("#homesmap"), { wheel: false });
  [["a", a], ["b", b]].forEach(([w, pt]) => m.addMarker(pt[0], pt[1], `<div class="pin">${stickerHTML("e:🏡", 28)}</div>`, { title: `${names()[w === "a" ? 0 : 1]}'s home` }));
  m.setLine([a, b]);
  m.fitBounds([a, b], 50);
  onLeave(() => m.destroy());
  const r = await roadRoute(a, b);
  const km = $("#roadkm"), note = $("#roadnote");
  if (!km) return;
  if (r && r.km) { km.textContent = fmtKm(r.km); note.textContent = `by road, about ${fmtDur(r.min)} driving`; }
  else if (r) { km.textContent = "no road"; note.textContent = "there is no driving route between these two homes"; }
  else { km.textContent = "—"; note.textContent = "by road (couldn't check just now)"; }
}

async function pageAbout() {
  document.title = "About us · " + STATE.title;
  const [na, nb] = names(), dt = daysTogether();
  const paint = () => done(`<main class="wrap">${crumb()}${pageTitle("About us")}
    <section class="aboutpair reveal"><div class="ab-who">${avatarSVG(avatarFor("a"), "bounce")}<b>${esc(na)}</b></div><span class="ab-heart">${stickerHTML("heart", 44)}</span><div class="ab-who">${avatarSVG(avatarFor("b"), "bounce d2")}<b>${esc(nb)}</b></div></section>
    ${STATE.since ? `<p class="statnote">Together since <b>${esc(prettyDate(STATE.since))}</b>${dt >= 0 ? ` · ${dt.toLocaleString()} days` : ""}</p>` : ""}
    ${EDIT ? `<p class="hint pnote">🔒 Tick the lock next to anything you don't want visitors to see. Locked details stay on your device, and Publish leaves them out. Everything else is visible to anyone who has the link.</p>` : ""}
    <section class="profiles">${EDIT ? profileEdit("a") + profileEdit("b") : profileView("a") + profileView("b")}</section>
    ${betweenHTML()}
    ${EDIT ? `<textarea class="bigta" id="story" rows="6" placeholder="How did we meet? Tell our story…">${esc(STATE.about.story)}</textarea>`
      : STATE.about.story.trim() ? `<div class="note">${esc(STATE.about.story)}</div>` : ""}
    ${EDIT || STATE.about.facts.length ? `<section class="facts"><h3>Little facts</h3><ul>${STATE.about.facts.map((f, i) => EDIT
      ? `<li class="rowline" data-i="${i}"><input class="grow" data-k="k" value="${esc(f.k)}" placeholder="Favorite…"><input class="grow" data-k="v" value="${esc(f.v)}" placeholder="…is"><button type="button" class="x" data-delfact="${i}">✕</button></li>`
      : `<li><span>${esc(f.k)}</span><b>${esc(f.v)}</b></li>`).join("")}</ul>${EDIT ? `<button type="button" class="addrow" id="addFact">＋ Add a fact</button>` : ""}</section>` : ""}
    ${EDIT ? `<section class="looks"><h3>Dress up the mini us</h3><p class="hint">Their looks here are the base. Each day's outfit section only changes the clothes.</p><div class="outfit-edit"><div><h4>${esc(na)}</h4><div data-av="a"></div></div><div><h4>${esc(nb)}</h4><div data-av="b"></div></div></div></section>` : ""}
    </main>${footerHTML()}`, () => {
    mountBetween();
    if (!EDIT) return;
    $("#story").addEventListener("input", e => { STATE.about.story = e.target.value; saveSoon(); });
    $("#addFact").onclick = () => { STATE.about.facts.push({ k: "", v: "" }); saveState(); paint(); };
    $(".facts").addEventListener("input", e => { const li = e.target.closest("[data-i]"); if (li && e.target.dataset.k) { STATE.about.facts[+li.dataset.i][e.target.dataset.k] = e.target.value; saveSoon(); } });
    $$("[data-delfact]").forEach(b => b.onclick = () => { STATE.about.facts.splice(+b.dataset.delfact, 1); saveState(); paint(); });
    ["a", "b"].forEach(w => avatarBuilder($(`[data-av=${w}]`), {
      get: () => avatarFor(w), groups: BASE_GROUPS,
      set: (k, v) => { STATE.about[w][k] = v; saveSoon(); }
    }));
    $$(".prof.editing").forEach(card => {
      const w = card.dataset.w, p = STATE.about.p[w];
      const calc = () => { $("[data-calc]", card).innerHTML = p.birth ? bdayLines(p) : ""; };
      calc();
      card.addEventListener("input", e => {
        const t = e.target;
        if (t.dataset.f) { p[t.dataset.f] = t.value; saveSoon(); if (t.dataset.f === "birth") calc(); }
        const x = t.closest("[data-x]");
        if (x && t.dataset.xk) { p.extra[+x.dataset.x][t.dataset.xk] = t.value; saveSoon(); }
      });
      card.addEventListener("change", e => {
        const t = e.target;
        if (t.dataset.lock) { p.hide = p.hide.filter(k => k !== t.dataset.lock); if (t.checked) p.hide.push(t.dataset.lock); saveState(); }
        if (t.dataset.xlock !== undefined) { p.extra[+t.closest("[data-x]").dataset.x].priv = t.checked; saveState(); }
      });
      card.addEventListener("click", async e => {
        const b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.pin !== undefined) {
          const r = await pickPlace(p);
          if (!r) return;
          p.lat = r.lat; p.lng = r.lng;
          if (!p.addr && r.name) p.addr = r.name;
          STATE.about.route = null; saveState(); paint();
        }
        if (b.dataset.unpin !== undefined) { p.lat = ""; p.lng = ""; STATE.about.route = null; saveState(); paint(); }
        if (b.dataset.xadd !== undefined) { p.extra.push({ k: "", v: "", priv: false }); saveState(); paint(); }
        if (b.dataset.xidea) { p.extra.push({ k: b.dataset.xidea, v: "", priv: false }); saveState(); paint(); }
        if (b.dataset.xdel !== undefined) { p.extra.splice(+b.dataset.xdel, 1); saveState(); paint(); }
        if (b.dataset.fdel) { const [k, id] = b.dataset.fdel.split(":"); p.favs[k] = p.favs[k].filter(x => x.id !== id); saveState(); paint(); }
      });
      card.addEventListener("submit", e => {
        const f = e.target.closest("[data-fadd]");
        if (!f) return;
        e.preventDefault();
        const v = $("input", f).value.trim();
        if (!v) return;
        p.favs[f.dataset.fadd].push({ id: uid(), text: v });
        saveState(); paint();
      });
    });
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
