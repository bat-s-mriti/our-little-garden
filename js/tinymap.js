/* tinymap.js: a small dependency-free map (OpenStreetMap tiles): drag, zoom, markers, a route line, click-to-pick. */
"use strict";

class TinyMap {
  constructor(el, opts = {}) {
    this.el = el;
    this.z = opts.zoom || 2;
    this.onClick = opts.onClick || null;
    this.wheel = !!opts.wheel;
    this.markers = [];
    this.line = null;
    this.tiles = new Map();
    el.classList.add("tm");
    el.innerHTML = `<div class="tm-tiles"></div><svg class="tm-svg"><polyline class="tm-line" points=""/></svg><div class="tm-over"></div>
      <div class="tm-zoom"><button type="button" data-z="1" aria-label="Zoom in">+</button><button type="button" data-z="-1" aria-label="Zoom out">−</button></div>
      <a class="tm-attr" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>`;
    this.tilesEl = $(".tm-tiles", el); this.overEl = $(".tm-over", el); this.poly = $(".tm-line", el);
    const c = opts.center || [20, 0];
    this.cx = this.lng2x(c[1], this.z); this.cy = this.lat2y(c[0], this.z);
    this._bind();
    this.ro = new ResizeObserver(() => this.render());
    this.ro.observe(el);
    this.render();
  }
  get size() { return 256 * Math.pow(2, this.z); }
  lng2x(lng, z) { return (lng + 180) / 360 * 256 * Math.pow(2, z); }
  lat2y(lat, z) {
    lat = Math.max(-85, Math.min(85, lat));
    const r = lat * Math.PI / 180;
    return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 256 * Math.pow(2, z);
  }
  x2lng(x, z) { return x / (256 * Math.pow(2, z)) * 360 - 180; }
  y2lat(y, z) { const n = Math.PI * (1 - 2 * y / (256 * Math.pow(2, z))); return Math.atan(Math.sinh(n)) * 180 / Math.PI; }

  _bind() {
    const el = this.el;
    let down = null;
    el.addEventListener("pointerdown", e => {
      if (e.target.closest(".tm-zoom,.tm-attr")) return;
      down = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", e => {
      if (!down) return;
      if (Math.abs(e.clientX - down.sx) + Math.abs(e.clientY - down.sy) > 4) down.moved = true;
      this.cx -= e.clientX - down.x; this.cy -= e.clientY - down.y;
      down.x = e.clientX; down.y = e.clientY;
      this._clamp();
      if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this.render(); });
    });
    const up = e => {
      if (!down) return;
      const d = down; down = null;
      if (!d.moved && this.onClick && !e.target.closest(".tm-zoom,.tm-attr")) {
        const r = el.getBoundingClientRect();
        const x = this.cx - r.width / 2 + (e.clientX - r.left), y = this.cy - r.height / 2 + (e.clientY - r.top);
        this.onClick(this.y2lat(y, this.z), this.x2lng(x, this.z));
      }
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", () => { down = null; });
    $(".tm-zoom", el).addEventListener("click", e => {
      const b = e.target.closest("button");
      if (b) this.zoomBy(Number(b.dataset.z));
    });
    el.addEventListener("dblclick", e => {
      const r = el.getBoundingClientRect();
      this.zoomBy(1, e.clientX - r.left, e.clientY - r.top);
    });
    if (this.wheel) {
      let lock = 0;
      el.addEventListener("wheel", e => {
        e.preventDefault();
        const t = Date.now();
        if (t - lock < 250) return;
        lock = t;
        const r = el.getBoundingClientRect();
        this.zoomBy(e.deltaY < 0 ? 1 : -1, e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });
    }
  }
  _clamp() { const s = this.size; this.cy = Math.max(0, Math.min(s, this.cy)); }

  zoomBy(dz, px, py) {
    const nz = Math.max(1, Math.min(18, this.z + dz));
    if (nz === this.z) return;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (px === undefined) { px = w / 2; py = h / 2; }
    const lat = this.y2lat(this.cy - h / 2 + py, this.z), lng = this.x2lng(this.cx - w / 2 + px, this.z);
    this.z = nz;
    this.cx = this.lng2x(lng, nz) - px + w / 2;
    this.cy = this.lat2y(lat, nz) - py + h / 2;
    this._clamp();
    this.render();
  }
  setView(lat, lng, z) {
    this.z = z; this.cx = this.lng2x(lng, z); this.cy = this.lat2y(lat, z); this.render();
  }
  fitBounds(pts, pad = 40) {
    if (!pts.length) return;
    if (pts.length === 1) { this.setView(pts[0][0], pts[0][1], 13); return; }
    const w = Math.max(100, this.el.clientWidth) - pad * 2, h = Math.max(100, this.el.clientHeight) - pad * 2;
    const lats = pts.map(p => p[0]), lngs = pts.map(p => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    let z = 16;
    while (z > 1) {
      const pw = this.lng2x(maxLng, z) - this.lng2x(minLng, z), ph = this.lat2y(minLat, z) - this.lat2y(maxLat, z);
      if (pw <= w && ph <= h) break;
      z--;
    }
    this.setView((minLat + maxLat) / 2, (minLng + maxLng) / 2, z);
  }

  addMarker(lat, lng, html, opts = {}) {
    const el = document.createElement("div");
    el.className = "tm-marker";
    el.innerHTML = html;
    if (opts.title) el.title = opts.title;
    if (opts.onClick) el.addEventListener("click", e => { e.stopPropagation(); opts.onClick(); });
    el.addEventListener("pointerdown", e => e.stopPropagation());
    this.overEl.appendChild(el);
    const m = { el, lat, lng, remove: () => { el.remove(); this.markers = this.markers.filter(x => x !== m); }, set: (a, b) => { m.lat = a; m.lng = b; this.render(); } };
    this.markers.push(m);
    this.render();
    return m;
  }
  clearMarkers() { this.markers.forEach(m => m.el.remove()); this.markers = []; this.setLine([]); }
  setLine(pts) { this.line = pts; this.render(); }

  render() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    const z = this.z, n = Math.pow(2, z);
    const tlx = this.cx - w / 2, tly = this.cy - h / 2;
    const want = new Set();
    for (let ty = Math.floor(tly / 256); ty <= Math.floor((tly + h) / 256); ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = Math.floor(tlx / 256); tx <= Math.floor((tlx + w) / 256); tx++) {
        const wx = ((tx % n) + n) % n, key = `${z}/${wx}/${ty}/${tx}`;
        want.add(key);
        let img = this.tiles.get(key);
        if (!img) {
          img = document.createElement("img");
          img.className = "tm-tile"; img.alt = ""; img.draggable = false;
          img.src = `https://tile.openstreetmap.org/${z}/${wx}/${ty}.png`;
          this.tilesEl.appendChild(img);
          this.tiles.set(key, img);
        }
        img.style.transform = `translate(${Math.round(tx * 256 - tlx)}px,${Math.round(ty * 256 - tly)}px)`;
      }
    }
    this.tiles.forEach((img, k) => { if (!want.has(k)) { img.remove(); this.tiles.delete(k); } });
    this.markers.forEach(m => {
      m.el.style.transform = `translate(${Math.round(this.lng2x(m.lng, z) - tlx)}px,${Math.round(this.lat2y(m.lat, z) - tly)}px)`;
    });
    this.poly.setAttribute("points", (this.line || []).map(p => `${(this.lng2x(p[1], z) - tlx).toFixed(1)},${(this.lat2y(p[0], z) - tly).toFixed(1)}`).join(" "));
  }
  destroy() { this.ro.disconnect(); this.el.innerHTML = ""; }
}
