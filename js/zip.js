/* zip.js: a tiny zip writer/reader, plus Export and Import of the whole site (data + photos + videos). */
"use strict";

const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
async function blobCrc(blob) {
  let crc = 0xFFFFFFFF;
  const r = blob.stream().getReader();
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    for (let i = 0; i < value.length; i++) crc = CRC_T[(crc ^ value[i]) & 255] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* entries: [{name, blob}] -> Blob (stored, not compressed: photos and videos are already compressed) */
async function makeZip(entries, onProgress) {
  const enc = new TextEncoder();
  const parts = [], cd = [];
  let offset = 0;
  const now = new Date();
  const dt = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const tm = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const name = enc.encode(e.name), size = e.blob.size, crc = await blobCrc(e.blob);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, crc, true);
    h.setUint32(18, size, true); h.setUint32(22, size, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(h.buffer, name, e.blob);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true); c.setUint32(16, crc, true);
    c.setUint32(20, size, true); c.setUint32(24, size, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    cd.push(c.buffer, name);
    offset += 30 + name.length + size;
    if (onProgress) onProgress(i + 1, entries.length);
  }
  const cdSize = cd.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...cd, end.buffer], { type: "application/zip" });
}

async function readZip(file) {
  const tail = await file.slice(Math.max(0, file.size - 66000)).arrayBuffer();
  const dv = new DataView(tail);
  let e = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error("not a zip");
  const count = dv.getUint16(e + 10, true), cdSize = dv.getUint32(e + 12, true), cdOff = dv.getUint32(e + 16, true);
  const cdBuf = await file.slice(cdOff, cdOff + cdSize).arrayBuffer();
  const cv = new DataView(cdBuf), dec = new TextDecoder();
  let p = 0;
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (cv.getUint32(p, true) !== 0x02014b50) break;
    const method = cv.getUint16(p + 10, true), csize = cv.getUint32(p + 20, true);
    const nlen = cv.getUint16(p + 28, true), xlen = cv.getUint16(p + 30, true), clen = cv.getUint16(p + 32, true);
    const lho = cv.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(cdBuf, p + 46, nlen));
    p += 46 + nlen + xlen + clen;
    entries.push({ name, method, csize, lho });
  }
  return {
    entries,
    async blob(en) {
      const lh = new DataView(await file.slice(en.lho, en.lho + 30).arrayBuffer());
      const start = en.lho + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
      const raw = file.slice(start, start + en.csize);
      if (en.method === 0) return raw;
      if (en.method === 8) return await new Response(raw.stream().pipeThrough(new DecompressionStream("deflate-raw"))).blob();
      throw new Error("unsupported zip method");
    }
  };
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/aac": "aac" };
const MIME = Object.fromEntries(Object.entries(EXT).map(([m, e]) => [e, m]));
const extFor = t => EXT[t] || "bin";
const mimeFor = name => MIME[(name.split(".").pop() || "").toLowerCase()] || "";

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

/* Bundle: the data (with media refs rewritten to media/<file>) plus the media blobs. Used by Export and Publish. */
async function buildBundle() {
  const st = JSON.parse(JSON.stringify(STATE, replacer));
  const media = [], seen = new Map();
  const pack = async src => {
    if (!src.startsWith("idb:")) return src;
    const id = src.slice(4);
    if (seen.has(id)) return seen.get(id);
    let blob = null;
    try { blob = await DB.get(id); } catch (e) { /* missing */ }
    if (!blob) { seen.set(id, ""); return ""; }
    const name = `media/${id}.${extFor(blob.type)}`;
    media.push({ name, blob });
    seen.set(id, name);
    return name;
  };
  const objs = [];
  walkMedia(st, o => objs.push(o));
  for (const o of objs) o.src = await pack(o.src);
  for (let i = 0; i < st.stickers.length; i++) {
    const s = st.stickers[i];
    if (s.startsWith("img:") && !s.startsWith("img:media/")) st.stickers[i] = "img:" + (await pack("idb:" + s.slice(4)));
  }
  st.publishedAt = new Date().toISOString();
  // every media file the data points to (published ones included), so Publish knows what to keep
  const used = new Set();
  walkMedia(st, o => { if (o.src.startsWith("media/")) used.add(o.src); });
  st.stickers.forEach(s => { if (s.startsWith("img:media/")) used.add(s.slice(4)); });
  return { st, media, used };
}

/* Export: one zip with content/data.json and content/media/*. Works as a backup AND as the thing you upload to your host. */
async function exportContent() {
  toast("Packing your garden…", true);
  const { st, media } = await buildBundle();
  const entries = media.map(m => ({ name: "content/" + m.name, blob: m.blob }));
  entries.unshift({ name: "content/data.json", blob: new Blob([JSON.stringify(st, null, 1)], { type: "application/json" }) });
  entries.push({ name: "README.txt", blob: new Blob(["Upload the 'content' folder next to index.html on your host (replace the old one) and everyone who opens the site will see this version.\nTo restore it into a browser: open the site with ?edit and use Import.\n"], { type: "text/plain" }) });
  const total = entries.reduce((n, e) => n + e.blob.size, 0);
  if (total > 3.8e9) { toast("That's over 3.8 GB, too big for one zip. Remove a few videos and try again."); return; }
  const zip = await makeZip(entries, (i, n) => toast(`Packing ${i} of ${n}…`, true));
  download(zip, `our-little-garden-${todayISO()}.zip`);
  toast(`Exported ${entries.length - 2} files. Upload the "content" folder to your host to publish.`);
}

/* Import: our zip, or the .json backup from the first version */
async function importContent() {
  const [file] = await pickFiles(false, ".zip,.json,application/zip,application/json");
  if (!file) return;
  try {
    let st, put;
    if (/\.json$/i.test(file.name)) {
      const obj = JSON.parse(await file.text());
      if (obj.app !== "our-little-garden" || !obj.state) throw new Error("bad file");
      st = obj.state;
      put = async () => { for (const [id, url] of Object.entries(obj.photos || {})) await DB.put(id, await (await fetch(url)).blob()); };
    } else {
      const z = await readZip(file);
      const dj = z.entries.find(e => /(^|\/)data\.json$/.test(e.name));
      if (!dj) throw new Error("no data");
      const prefix = dj.name.slice(0, -"data.json".length);
      st = JSON.parse(await (await z.blob(dj)).text());
      const media = new Map(z.entries.filter(e => e.name.startsWith(prefix + "media/") && !e.name.endsWith("/")).map(e => [e.name.slice(prefix.length), e]));
      const idMap = new Map();
      const unpack = async src => {
        if (!src.startsWith("media/")) return src;
        if (idMap.has(src)) return idMap.get(src);
        const en = media.get(src);
        if (!en) return "";
        const raw = await z.blob(en);
        const id = uid();
        await DB.put(id, raw.slice(0, raw.size, mimeFor(src)));
        idMap.set(src, "idb:" + id);
        return "idb:" + id;
      };
      put = async () => {
        const objs = [];
        walkMedia(st, o => objs.push(o));
        let n = 0;
        for (const o of objs) { o.src = await unpack(o.src); if (++n % 5 === 0) toast(`Restoring ${n} of ${objs.length}…`, true); }
        st.stickers = await Promise.all((st.stickers || []).map(async s => (s.startsWith("img:media/") ? "img:" + (await unpack(s.slice(4))).slice(4) : s)));
      };
    }
    if (!confirm("Replace everything in this browser with this file?")) return;
    toast("Restoring…", true);
    await DB.clear();
    await put();
    STATE = normalize(migrate(st));
    saveState();
    toast("Restored.");
    location.href = L("/");
  } catch (e) {
    console.error(e);
    toast("That doesn't look like a garden export.");
  }
}

async function resetAll() {
  if (!confirm("Erase all edits, photos and videos in this browser and go back to the starting version?")) return;
  try { localStorage.removeItem(KEY); await DB.clear(); } catch (e) { /* ignore */ }
  location.href = L("/");
}
