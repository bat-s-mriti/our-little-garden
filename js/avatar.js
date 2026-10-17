/* avatar.js: the "mini us" characters, drawn from parts, plus the builder UI. */
"use strict";

const AV = {
  skins: ["#fde0c8", "#f1c9a5", "#e0ac82", "#c68863", "#9a6644", "#6f4a33"],
  hairColors: ["#2b1d16", "#5b3a29", "#8a5a36", "#c68a4b", "#e8c26a", "#d8d2c8", "#c2527a", "#4f7d4a", "#5b7cc2"],
  clothColors: ["#ffffff", "#f7c531", "#f9a8c0", "#e0534a", "#f4a259", "#7bab6e", "#6fb7c9", "#5b7cc2", "#9b7bc2", "#5d6d8a", "#3b2a20"],
  hair: [["short", "Short"], ["bob", "Bob"], ["long", "Long"], ["curly", "Curly"], ["bun", "Bun"], ["ponytail", "Ponytail"], ["buzz", "Buzz"], ["bald", "None"]],
  tops: [["tee", "T-shirt"], ["hoodie", "Hoodie"], ["sweater", "Sweater"], ["tank", "Tank"], ["dress", "Dress"]],
  bottoms: [["pants", "Pants"], ["shorts", "Shorts"], ["skirt", "Skirt"]],
  accs: [["none", "None"], ["glasses", "Glasses"], ["sunglasses", "Shades"], ["beanie", "Beanie"], ["cap", "Cap"], ["flower", "Flower"], ["bow", "Bow"], ["scarf", "Scarf"]]
};
const AV_DEFAULT = {
  a: { skin: "#f1c9a5", hair: "short", hairColor: "#2b1d16", top: "tee", topColor: "#7bab6e", bottom: "pants", bottomColor: "#5d6d8a", shoes: "#ffffff", acc: "none", accColor: "#f7c531" },
  b: { skin: "#f1c9a5", hair: "long", hairColor: "#5b3a29", top: "dress", topColor: "#f9a8c0", bottom: "pants", bottomColor: "#5d6d8a", shoes: "#ffffff", acc: "flower", accColor: "#f7c531" }
};
const BASE_GROUPS = [
  { key: "skin", label: "Skin", type: "color", opts: AV.skins },
  { key: "hair", label: "Hair", type: "chip", opts: AV.hair },
  { key: "hairColor", label: "Hair colour", type: "color", opts: AV.hairColors }
];
const OUTFIT_KEYS = ["top", "topColor", "bottom", "bottomColor", "shoes", "acc", "accColor"];
const OUTFIT_GROUPS = [
  { key: "top", label: "Top", type: "chip", opts: AV.tops },
  { key: "topColor", label: "Top colour", type: "color", opts: AV.clothColors },
  { key: "bottom", label: "Bottoms", type: "chip", opts: AV.bottoms },
  { key: "bottomColor", label: "Bottoms colour", type: "color", opts: AV.clothColors },
  { key: "shoes", label: "Shoes", type: "color", opts: AV.clothColors },
  { key: "acc", label: "Extra", type: "chip", opts: AV.accs },
  { key: "accColor", label: "Extra colour", type: "color", opts: AV.clothColors }
];

/* base look (About us page) + one day's clothes */
function avatarFor(who, outfit) {
  return Object.assign({}, AV_DEFAULT[who], STATE.about[who] || {}, (outfit && outfit[who]) || {});
}

function avatarInner(c) {
  const o = "#5b3a29", S = c.skin, H = c.hairColor, T = c.topColor, B = c.bottomColor, A = c.accColor, SH = c.shoes;
  const sleeves = c.top === "hoodie" || c.top === "sweater";
  const st = `stroke="${o}" stroke-width="1.5" stroke-linejoin="round"`;
  let s = "";
  // hair behind
  if (c.hair === "long") s += `<path d="M25 42 Q22 88 34 90 L66 90 Q78 88 75 42Z" fill="${H}"/>`;
  if (c.hair === "bob") s += `<path d="M26 42 Q25 70 35 72 L65 72 Q75 70 74 42Z" fill="${H}"/>`;
  if (c.hair === "ponytail") s += `<ellipse cx="78" cy="52" rx="7" ry="15" fill="${H}" transform="rotate(-18 78 52)"/>`;
  if (c.hair === "curly") s += [[27, 40], [25, 52], [29, 62], [73, 40], [75, 52], [71, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${H}"/>`).join("");
  if (c.top === "hoodie") s += `<ellipse cx="50" cy="66" rx="23" ry="9" fill="${T}" ${st}/>`;
  // arms and hands
  const arm = sleeves ? T : S;
  s += `<rect x="25" y="66" width="9" height="27" rx="4.5" fill="${arm}" ${st}/><rect x="66" y="66" width="9" height="27" rx="4.5" fill="${arm}" ${st}/>`;
  s += `<circle cx="29.5" cy="94" r="4.6" fill="${S}" ${st}/><circle cx="70.5" cy="94" r="4.6" fill="${S}" ${st}/>`;
  // legs, bottoms, shoes
  s += `<rect x="39" y="98" width="9" height="28" rx="4" fill="${S}" ${st}/><rect x="52" y="98" width="9" height="28" rx="4" fill="${S}" ${st}/>`;
  if (c.top !== "dress") {
    if (c.bottom === "pants") s += `<path d="M37 97 L63 97 L62 124 L52 124 L50 108 L48 124 L38 124Z" fill="${B}" ${st}/>`;
    else if (c.bottom === "shorts") s += `<path d="M37 97 L63 97 L63 113 L52 113 L50 106 L48 113 L37 113Z" fill="${B}" ${st}/>`;
    else s += `<path d="M35 97 L65 97 L72 114 L28 114Z" fill="${B}" ${st}/>`;
  }
  s += `<ellipse cx="43" cy="128" rx="7.5" ry="4" fill="${SH}" ${st}/><ellipse cx="57" cy="128" rx="7.5" ry="4" fill="${SH}" ${st}/>`;
  // top
  if (c.top === "tee") s += `<path d="M34 66 Q50 72 66 66 L72 82 L64 85 L63 102 L37 102 L36 85 L28 82Z" fill="${T}" ${st}/>`;
  else if (c.top === "tank") s += `<path d="M38 66 Q50 74 62 66 L64 102 L36 102Z" fill="${T}" ${st}/>`;
  else if (c.top === "dress") s += `<path d="M35 66 Q50 72 65 66 L72 84 L63 85 L68 114 L32 114 L37 85 L28 84Z" fill="${T}" ${st}/>`;
  else {
    s += `<path d="M34 66 Q50 72 66 66 L68 86 L63 102 L37 102 L32 86Z" fill="${T}" ${st}/>`;
    if (c.top === "hoodie") s += `<path d="M42 90 H58 L60 98 H40Z" fill="none" stroke="${o}" stroke-width="1.2" opacity=".55"/>`;
    else s += `<path d="M40 67 Q50 77 60 67" fill="none" stroke="${o}" stroke-width="1.5"/><path d="M37 98 H63" stroke="${o}" stroke-width="1.2" opacity=".5"/>`;
  }
  if (c.acc === "scarf") s += `<path d="M34 64 Q50 72 66 64 L66 71 Q50 79 34 71Z" fill="${A}" ${st}/><rect x="57" y="70" width="8" height="17" rx="3" fill="${A}" ${st}/>`;
  // head and face
  s += `<circle cx="27.5" cy="46" r="4.5" fill="${S}" ${st}/><circle cx="72.5" cy="46" r="4.5" fill="${S}" ${st}/>`;
  s += `<circle cx="50" cy="42" r="22" fill="${S}" ${st}/>`;
  s += `<ellipse cx="41" cy="45" rx="2.4" ry="3.2" fill="#3b2a20"/><ellipse cx="59" cy="45" rx="2.4" ry="3.2" fill="#3b2a20"/><circle cx="41.8" cy="43.8" r=".9" fill="#fff"/><circle cx="59.8" cy="43.8" r=".9" fill="#fff"/>`;
  s += `<circle cx="34.5" cy="52" r="3.6" fill="#ff8fa3" opacity=".55"/><circle cx="65.5" cy="52" r="3.6" fill="#ff8fa3" opacity=".55"/><path d="M46 53 Q50 57.5 54 53" fill="none" stroke="#3b2a20" stroke-width="1.8" stroke-linecap="round"/>`;
  // hair in front
  const fringe = `<path d="M27 42 Q24 14 50 14 Q76 14 73 42 Q66 27 50 27 Q34 27 27 42Z" fill="${H}"/>`;
  if (c.hair === "bun") s += `<circle cx="50" cy="11" r="9" fill="${H}"/>` + fringe;
  else if (c.hair === "curly") s += fringe + [[36, 18], [48, 13], [60, 17], [68, 26], [31, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${H}"/>`).join("");
  else if (c.hair === "buzz") s += `<path d="M28 40 Q27 20 50 19 Q73 20 72 40 Q62 32 50 32 Q38 32 28 40Z" fill="${H}" opacity=".9"/>`;
  else if (c.hair !== "bald") s += fringe;
  // extras
  if (c.acc === "glasses") s += `<g fill="none" stroke="#3b2a20" stroke-width="1.8"><circle cx="41" cy="45" r="7"/><circle cx="59" cy="45" r="7"/><path d="M48 45 H52"/></g>`;
  if (c.acc === "sunglasses") s += `<g fill="#2b1d16"><rect x="33" y="40" width="15" height="10" rx="4"/><rect x="52" y="40" width="15" height="10" rx="4"/><rect x="47" y="42" width="6" height="2"/></g>`;
  if (c.acc === "beanie") s += `<path d="M27 38 Q26 12 50 12 Q74 12 73 38Z" fill="${A}" ${st}/><rect x="26" y="34" width="48" height="8" rx="4" fill="${A}" ${st}/><circle cx="50" cy="11" r="5" fill="${A}" ${st}/>`;
  if (c.acc === "cap") s += `<path d="M27 38 Q27 14 50 14 Q73 14 73 38Z" fill="${A}" ${st}/><path d="M60 36 Q82 34 84 42 Q70 42 60 40Z" fill="${A}" ${st}/>`;
  if (c.acc === "flower") s += [0, 72, 144, 216, 288].map(a => `<circle cx="${70 + 5.5 * Math.cos(a * Math.PI / 180)}" cy="${24 + 5.5 * Math.sin(a * Math.PI / 180)}" r="4.2" fill="${A}" stroke="${o}" stroke-width="1"/>`).join("") + `<circle cx="70" cy="24" r="3" fill="#f7c531" stroke="${o}" stroke-width="1"/>`;
  if (c.acc === "bow") s += `<g fill="${A}" ${st}><path d="M68 22 L58 15 L58 29Z"/><path d="M68 22 L78 15 L78 29Z"/><circle cx="68" cy="22" r="3.2"/></g>`;
  return s;
}
function avatarSVG(c, cls = "") {
  return `<svg class="avatar ${cls}" viewBox="0 0 100 140" role="img" aria-label="mini character">${avatarInner(Object.assign({}, AV_DEFAULT.a, c))}</svg>`;
}

/* The builder: live preview + chips and swatches. get() returns the full look, set(key, value) saves a choice. */
function avatarBuilder(mount, { get, set, groups }) {
  const paint = () => {
    const c = get();
    mount.innerHTML = `<div class="avb"><div class="avb-prev">${avatarSVG(c)}</div><div class="avb-ctl">${groups.map(g => `
      <div class="avb-row"><span class="avb-lab">${g.label}</span><div class="avb-opts">${g.opts.map(o => {
        const v = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : "";
        const on = c[g.key] === v ? " on" : "";
        return g.type === "color"
          ? `<button type="button" class="sw${on}" data-k="${g.key}" data-v="${v}" style="--c:${v}" aria-label="${g.label} ${v}"></button>`
          : `<button type="button" class="chipb${on}" data-k="${g.key}" data-v="${v}">${lab}</button>`;
      }).join("")}</div></div>`).join("")}</div></div>`;
  };
  mount.addEventListener("click", e => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    set(b.dataset.k, b.dataset.v);
    paint();
  });
  paint();
}
