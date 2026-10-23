/* heads.js: the two FIXED heads of the mini us. Not editable on the site.
   Each head is two SVG layers: `back` (hair behind the body) and `front` (face, hair, ears).
   Drawn in the shared 100x140 mini-us space around a head centred at (50,42); avatar.js enlarges it a little for the chibi look. */
"use strict";

const OL = `stroke="#6b4a3a" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`;

/* A: fuller face, high slicked-back hairline with a little top bun, thick straight brows, happy squinty eyes, broad moustache, light stubble */
const HEAD_A = (() => {
  const S = "#cf9a72", H = "#2a1d17", D = "#3b2a20";
  const back = `<circle cx="50" cy="9" r="8.5" fill="${H}" ${OL}/><path d="M44.5 7.5 Q50 4.5 55.5 7.5" fill="none" stroke="#6a5444" stroke-width="1.2" opacity=".75"/><rect x="43.5" y="14.2" width="13" height="3" rx="1.5" fill="#8a6a55" opacity=".9"/>`;
  let f = `<ellipse cx="25.6" cy="46" rx="4.4" ry="5.4" fill="${S}" ${OL}/><ellipse cx="74.4" cy="46" rx="4.4" ry="5.4" fill="${S}" ${OL}/>`;
  f += `<path d="M26 40 Q26 21 50 20.5 Q74 21 74 40 Q75 50 70 57 Q62 66 50 66 Q38 66 30 57 Q25 50 26 40Z" fill="${S}" ${OL}/>`;
  f += `<path d="M27 40 Q24.5 14 50 13.5 Q75.5 14 73 40 Q72 33 67 29 Q58 24.5 50 24.5 Q42 24.5 33 29 Q28 33 27 40Z" fill="${H}" ${OL}/>`;
  f += `<path d="M36 22.5 Q50 17.5 64 22.5" fill="none" stroke="#6a5444" stroke-width="1.2" opacity=".6"/>`;
  f += `<circle cx="33" cy="53" r="4" fill="#e0776d" opacity=".4"/><circle cx="67" cy="53" r="4" fill="#e0776d" opacity=".4"/>`;
  f += `<path d="M33 37.5 Q40 34 46.5 37" fill="none" stroke="${H}" stroke-width="2.8"/><path d="M53.5 37 Q60 34 67 37.5" fill="none" stroke="${H}" stroke-width="2.8"/>`;
  f += `<path d="M35.5 43.5 Q40.5 39.5 45.5 43.5" fill="none" stroke="${D}" stroke-width="2.2"/><path d="M54.5 43.5 Q59.5 39.5 64.5 43.5" fill="none" stroke="${D}" stroke-width="2.2"/>`;
  f += `<path d="M46.5 48 Q50 50.5 53.5 48" fill="none" stroke="#9a6446" stroke-width="1.5"/><path d="M48.5 45.5 Q47.5 48.5 49 49" fill="none" stroke="#a8704f" stroke-width="1.1" opacity=".7"/>`;
  f += `<path d="M37 55 Q43 51 50 53.2 Q57 51 63 55 Q57 56.5 50 55.8 Q43 56.5 37 55Z" fill="${H}"/>`;
  f += `<path d="M46.5 59.5 Q50 62.2 53.5 59.5" fill="none" stroke="${D}" stroke-width="1.7"/>`;
  f += [[36, 61], [40, 63.5], [44, 64.3], [56, 64.3], [60, 63.5], [64, 61], [50, 65]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="${H}" opacity=".5"/>`).join("");
  return { back, front: f };
})();

/* B: oval face, long black hair with a centre parting, big warm eyes, thin arched brows, soft closed smile */
const HEAD_B = (() => {
  const S = "#dfab86", H = "#1c1717", D = "#3b2a20";
  const back = `<path d="M24 40 Q17 84 26 98 Q50 104 74 98 Q83 84 76 40Z" fill="${H}" ${OL}/>`;
  let f = `<path d="M28.5 41 Q28.5 21 50 20.5 Q71.5 21 71.5 41 Q72 51 67.5 58 Q60 66 50 66 Q40 66 32.5 58 Q28 51 28.5 41Z" fill="${S}" ${OL}/>`;
  f += `<path d="M50 15 Q22 13 25 52 Q26 64 31 76 Q27 56 33 42 Q40 31 50 22.5 Q60 31 67 42 Q73 56 69 76 Q74 64 75 52 Q78 13 50 15Z" fill="${H}" ${OL}/>`;
  f += `<path d="M50 15.5 L50 22.5" stroke="#6a5444" stroke-width="1.2" opacity=".7"/>`;
  f += `<circle cx="35.5" cy="52" r="4" fill="#ea8a80" opacity=".42"/><circle cx="64.5" cy="52" r="4" fill="#ea8a80" opacity=".42"/>`;
  f += `<path d="M35.5 37.5 Q41 34.5 46 36.5" fill="none" stroke="${H}" stroke-width="1.7"/><path d="M54 36.5 Q59 34.5 64.5 37.5" fill="none" stroke="${H}" stroke-width="1.7"/>`;
  f += `<ellipse cx="41.2" cy="44.5" rx="3.1" ry="3.7" fill="${D}"/><ellipse cx="58.8" cy="44.5" rx="3.1" ry="3.7" fill="${D}"/><circle cx="42.3" cy="43.1" r="1.2" fill="#fff"/><circle cx="59.9" cy="43.1" r="1.2" fill="#fff"/><circle cx="40.4" cy="46" r=".6" fill="#fff" opacity=".8"/><circle cx="58" cy="46" r=".6" fill="#fff" opacity=".8"/>`;
  f += `<path d="M37 41.6 Q41 39 45.6 41" fill="none" stroke="${H}" stroke-width="1.7"/><path d="M54.4 41 Q59 39 63 41.6" fill="none" stroke="${H}" stroke-width="1.7"/>`;
  f += `<path d="M48.7 47 Q47.8 50 49.6 50.4" fill="none" stroke="#b27652" stroke-width="1.2"/>`;
  f += `<path d="M44.5 54.5 Q50 59.5 55.5 54.5" fill="none" stroke="#b5483f" stroke-width="1.9"/><path d="M47.5 57 Q50 58.3 52.5 57" fill="none" stroke="#d9786d" stroke-width="1.2" opacity=".8"/>`;
  return { back, front: f };
})();

const HEADS = { a: HEAD_A, b: HEAD_B };

/* the heads as stickers (used around the site like any other sticker) */
const headSticker = w => `<svg viewBox="14 0 72 72" aria-hidden="true">${HEADS[w].back}${HEADS[w].front}</svg>`;
ICONS.headA = headSticker("a");
ICONS.headB = headSticker("b");
