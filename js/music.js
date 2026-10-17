/* music.js: background music. Uses an uploaded audio file or a direct audio link.
   Browsers block sound until the first tap, so we try to start immediately and, if blocked, start on the first tap. */
"use strict";

const Music = (() => {
  let cur = null, audio = null, playing = false, waiting = false, dock = null;
  let paused = false;
  try { paused = localStorage.getItem("garden.musicOff") === "1"; } catch (e) { /* ignore */ }
  const GEST = ["pointerdown", "keydown", "touchend"];

  function trackFrom(m) {
    if (!m) return null;
    if (m.audio && m.audio._url) return { key: m.audio.src, src: m.audio._url, title: m.title || "" };
    if (m._url) return { key: m.src, src: m._url, title: m.title || "" };
    if (m.url && /\.(mp3|m4a|wav|ogg|aac|opus)(\?|$)/i.test(m.url)) return { key: m.url, src: m.url, title: m.title || "" };
    return null;
  }

  function ui() {
    if (!cur) { if (dock) { dock.remove(); dock = null; } return; }
    if (!dock) {
      dock = document.createElement("div");
      dock.className = "musicdock";
      dock.innerHTML = `<button type="button" class="md-btn" aria-label="Play or pause the music"><span class="eq"><i></i><i></i><i></i></span><span class="md-t"></span></button><div class="md-tip">Tap anywhere to start our song</div>`;
      $(".md-btn", dock).onclick = toggle;
      document.body.appendChild(dock);
    }
    $(".md-t", dock).textContent = cur.title || "our song";
    dock.classList.toggle("playing", playing);
    dock.classList.toggle("waiting", waiting);
    dock.classList.toggle("off", paused && !playing);
  }

  function start() {
    if (!cur || paused) { ui(); return; }
    if (!audio) { audio = new Audio(); audio.loop = true; audio.volume = 0.6; audio.preload = "auto"; }
    if (audio.dataset.key !== cur.key) { audio.src = cur.src; audio.dataset.key = cur.key; }
    const p = audio.play();
    if (p && p.then) {
      p.then(() => { playing = true; waiting = false; unarm(); ui(); })
        .catch(() => { playing = false; waiting = true; arm(); ui(); });
    }
  }
  function gesture() { unarm(); waiting = false; start(); }
  function arm() { GEST.forEach(t => document.addEventListener(t, gesture, { once: true, capture: true })); }
  function unarm() { GEST.forEach(t => document.removeEventListener(t, gesture, { capture: true })); }

  function stop() { unarm(); waiting = false; playing = false; if (audio) audio.pause(); }

  function toggle() {
    if (playing) { paused = true; try { localStorage.setItem("garden.musicOff", "1"); } catch (e) { /* ignore */ } stop(); }
    else { paused = false; try { localStorage.removeItem("garden.musicOff"); } catch (e) { /* ignore */ } start(); }
    ui();
  }

  return {
    trackFrom,
    /* called on every page: a track from this page, or null to use "our song" */
    forPage(tr, opts = {}) {
      if (opts.embed) { stop(); cur = null; ui(); return; }
      const t = tr || trackFrom(STATE.music);
      if (!t) { ui(); return; }
      if (cur && cur.key === t.key) { ui(); return; }
      stop();
      cur = t;
      ui();
      start();
    },
    /* a deliberate tap on a Play button */
    play() { paused = false; try { localStorage.removeItem("garden.musicOff"); } catch (e) { /* ignore */ } start(); },
    get state() { return { playing, waiting, paused, key: cur && cur.key }; }
  };
})();
