/* toys.js: the cute little clip-art characters used as homepage buttons. All drawn here, all original. */
"use strict";

const INK = "#5b3a29";
const face = (x, y, s = 1) => `<g class="face" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-7" cy="0" rx="2.4" ry="3.2" fill="#3b2a20"/><ellipse cx="7" cy="0" rx="2.4" ry="3.2" fill="#3b2a20"/><circle cx="-6.2" cy="-1.1" r=".9" fill="#fff"/><circle cx="7.8" cy="-1.1" r=".9" fill="#fff"/><circle cx="-12.5" cy="5" r="3.2" fill="#ff8fa3" opacity=".6"/><circle cx="12.5" cy="5" r="3.2" fill="#ff8fa3" opacity=".6"/><path d="M-3.5 4.5 Q0 9 3.5 4.5" fill="none" stroke="#3b2a20" stroke-width="1.8" stroke-linecap="round"/></g>`;
const ln = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

const TOYS = {
  snail: () => `
    <g class="t-snail">
      <path d="M8 80 Q8 64 24 64 L66 64 Q90 64 92 80 Q92 86 84 86 L14 86 Q8 86 8 80Z" fill="#fde3a7" ${ln}/>
      <g class="t-ant"><path d="M20 64 Q16 52 12 42" fill="none" ${ln}/><path d="M32 64 Q32 52 31 42" fill="none" ${ln}/>
        <circle cx="12" cy="40" r="4.2" fill="#fff" ${ln}/><circle cx="31" cy="40" r="4.2" fill="#fff" ${ln}/><circle cx="12" cy="40" r="1.7" fill="#3b2a20"/><circle cx="31" cy="40" r="1.7" fill="#3b2a20"/></g>
      <g class="t-shell"><circle cx="58" cy="46" r="27" fill="#f9c6d4" ${ln}/>
        <path d="M58 46 q3 -4 6 0 q4 7 -4 11 q-11 3 -15 -8 q-3 -15 12 -19 q18 -2 24 14" fill="none" stroke="#e58ca8" stroke-width="3" stroke-linecap="round"/></g>
      ${face(24, 76, .62)}
    </g>`,
  map: () => `
    <g class="t-map">
      <path d="M10 24 L36 17 L64 25 L90 17 L90 80 L64 88 L36 80 L10 87Z" fill="#fff0c7" ${ln}/>
      <path d="M36 17 V80 M64 25 V88" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".35"/>
      <path class="t-route" d="M20 70 Q36 40 54 58 T80 32" fill="none" stroke="#e0534a" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
      <path d="M74 26 l12 12 M86 26 l-12 12" stroke="#e0534a" stroke-width="4.5" stroke-linecap="round"/>
      <g class="t-pin"><path d="M20 72 C12 62 14 52 20 52 C26 52 28 62 20 72Z" fill="#7bab6e" ${ln}/><circle cx="20" cy="58" r="2.6" fill="#fff"/></g>
      ${face(52, 74, .6)}
    </g>`,
  calendar: () => `
    <g class="t-cal">
      <rect x="14" y="20" width="72" height="68" rx="9" fill="#fff" ${ln}/>
      <path d="M14 29 Q14 20 23 20 H77 Q86 20 86 29 V40 H14Z" fill="#f48fa1" ${ln}/>
      <rect x="29" y="11" width="7" height="16" rx="3.5" fill="#fde3a7" ${ln}/><rect x="64" y="11" width="7" height="16" rx="3.5" fill="#fde3a7" ${ln}/>
      <g class="t-page"><path d="M70 88 L86 72 V88Z" fill="#fde3a7" ${ln}/></g>
      <path d="M50 77 C38 68 40 58 46 58 C49 58 50 61 50 62 C50 61 51 58 54 58 C60 58 62 68 50 77Z" fill="#f9a8c0" stroke="${INK}" stroke-width="1.6" opacity="0"/>
      ${face(50, 58, .75)}
    </g>`,
  bee: () => `
    <g class="t-bee">
      <g class="t-wings"><ellipse cx="38" cy="30" rx="12" ry="17" fill="#cfeaf5" opacity=".85" ${ln} transform="rotate(-24 38 30)"/><ellipse cx="62" cy="30" rx="12" ry="17" fill="#cfeaf5" opacity=".85" ${ln} transform="rotate(24 62 30)"/></g>
      <ellipse cx="50" cy="60" rx="31" ry="24" fill="#f7c531" ${ln}/>
      <clipPath id="beeclip"><ellipse cx="50" cy="60" rx="31" ry="24"/></clipPath>
      <g clip-path="url(#beeclip)"><rect x="24" y="30" width="9" height="60" fill="#5b3a29"/><rect x="66" y="30" width="9" height="60" fill="#5b3a29"/></g>
      <ellipse cx="50" cy="60" rx="31" ry="24" fill="none" ${ln}/>
      <path d="M80 62 L92 60 L82 69Z" fill="#5b3a29"/>
      <path d="M42 38 Q38 28 32 25 M58 38 Q62 28 68 25" fill="none" ${ln}/><circle cx="32" cy="25" r="2.4" fill="${INK}"/><circle cx="68" cy="25" r="2.4" fill="${INK}"/>
      ${face(50, 60, .95)}
    </g>`,
  egg: () => `
    <g class="t-egg">
      <ellipse cx="50" cy="94" rx="22" ry="3.5" fill="#000" opacity=".1"/>
      <path d="M50 8 C74 8 84 44 84 62 C84 82 68 92 50 92 C32 92 16 82 16 62 C16 44 26 8 50 8Z" fill="#fff4d6" ${ln}/>
      <path d="M17 58 l8 -9 8 9 8 -9 8 9 8 -9 8 9 8 -9 8 9 8 -9" fill="none" stroke="#f48fa1" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="30" cy="30" r="4" fill="#9bd1e0"/><circle cx="66" cy="26" r="3.4" fill="#f7c531"/><circle cx="72" cy="42" r="2.6" fill="#7bab6e"/>
      <path class="t-crack" d="M30 40 l8 8 -6 6 9 7 -4 8" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
      ${face(50, 72, .85)}
    </g>`,
  heart: () => `
    <g class="t-heart">
      <path d="M50 90 C8 60 10 22 32 20 C42 19 48 26 50 32 C52 26 58 19 68 20 C90 22 92 60 50 90Z" fill="#f9a1b8" ${ln}/>
      <path d="M24 34 Q26 26 34 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
      <g class="t-spark"><path d="M82 14 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4Z" fill="#f7c531" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 70 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6Z" fill="#f7c531" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/></g>
      ${face(50, 50, .95)}
    </g>`,
  balloon: () => `
    <g class="t-balloon">
      <path d="M50 8 C72 8 82 26 80 42 C78 58 62 66 50 70 C38 66 22 58 20 42 C18 26 28 8 50 8Z" fill="#ff9a8a" ${ln}/>
      <path d="M50 8 C40 18 38 54 50 70 C62 54 60 18 50 8Z" fill="#ffd27a" opacity=".9"/>
      <path d="M50 8 C72 8 82 26 80 42 C78 58 62 66 50 70 C38 66 22 58 20 42 C18 26 28 8 50 8Z" fill="none" ${ln}/>
      <path d="M45 70 L55 70 L52 76 L48 76Z" fill="#e0534a" ${ln}/>
      <path d="M48 76 L40 86 M52 76 L60 86" stroke="${INK}" stroke-width="2" fill="none"/>
      <rect x="36" y="86" width="28" height="11" rx="3" fill="#c68a4b" ${ln}/>
      ${face(50, 40, .9)}
    </g>`,
  jar: () => `
    <g class="t-jar">
      <path d="M27 26 H73 V80 Q73 93 60 93 H40 Q27 93 27 80Z" fill="#ffffff" fill-opacity=".55" ${ln}/>
      <g class="t-slips"><rect x="33" y="56" width="16" height="10" rx="2" fill="#f9a8c0" transform="rotate(-14 41 61)"/><rect x="50" y="50" width="16" height="10" rx="2" fill="#fde3a7" transform="rotate(10 58 55)"/><rect x="36" y="72" width="18" height="10" rx="2" fill="#bfe3b4" transform="rotate(8 45 77)"/><rect x="54" y="70" width="14" height="10" rx="2" fill="#cfeaf5" transform="rotate(-10 61 75)"/></g>
      <rect x="24" y="14" width="52" height="13" rx="5" fill="#c68a4b" ${ln}/>
      <path d="M33 33 V60" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
      ${face(50, 44, .8)}
    </g>`,
  letter: () => `
    <g class="t-letter">
      <rect x="12" y="32" width="76" height="52" rx="6" fill="#fff4d6" ${ln}/>
      <path d="M13 83 L40 58 M87 83 L60 58" stroke="${INK}" stroke-width="1.8" fill="none" opacity=".4"/>
      <g class="t-flap"><path d="M12 34 Q12 32 16 32 H84 Q88 32 88 34 L50 62Z" fill="#fde3a7" ${ln}/></g>
      <path class="t-heart2" d="M50 66 C42 60 43 54 47 54 C49 54 50 56 50 56 C50 56 51 54 53 54 C57 54 58 60 50 66Z" fill="#f2698b" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
      ${face(50, 76, .55)}
    </g>`,

  pail: () => `
    <g class="t-pail">
      <g class="t-slips2">
        <rect x="30" y="14" width="18" height="24" rx="2.5" fill="#fff4d6" ${ln} transform="rotate(-14 39 26)"/><path d="M34 22 l9 -2 M33 28 l9 -2" stroke="#e58ca8" stroke-width="2" stroke-linecap="round" transform="rotate(-14 39 26)"/>
        <rect x="50" y="10" width="18" height="24" rx="2.5" fill="#cfeaf5" ${ln} transform="rotate(10 59 22)"/><path d="M54 18 l9 1 M54 24 l9 1" stroke="#7bab6e" stroke-width="2" stroke-linecap="round" transform="rotate(10 59 22)"/>
        <g transform="translate(20 22)"><circle r="6" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle r="3" fill="#f7c531"/></g>
        <path d="M20 28 V46" stroke="#5a8a55" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M78 36 C73 30 74 22 78 20 C82 22 83 30 78 36Z" fill="#f48fa1" ${ln}/><path d="M78 36 V50" stroke="#5a8a55" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <path d="M22 42 C30 30 70 30 78 42" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>
      <path d="M16 44 H84 L76 90 Q75 94 70 94 H30 Q25 94 24 90Z" fill="#d9a56a" ${ln}/>
      <path d="M20 58 H80 M22 74 H78" stroke="${INK}" stroke-width="2.4" opacity=".55"/>
      <path d="M36 46 L38 92 M50 46 V94 M64 46 L62 92" stroke="${INK}" stroke-width="1.4" opacity=".28"/>
      <ellipse cx="50" cy="44" rx="34" ry="5" fill="#b9854c" ${ln}/>
      ${face(50, 76, .8)}
    </g>`,
  wreath: () => `
    <g class="t-wreath">
      ${Array.from({ length: 14 }, (_, i) => { const a = i * 360 / 14; return `<ellipse cx="50" cy="12" rx="6.5" ry="12" fill="${i % 2 ? "#8bbf7f" : "#6fae63"}" stroke="#4a7d44" stroke-width="1.6" transform="rotate(${a} 50 52) rotate(${i % 2 ? 24 : -24} 50 12)"/>`; }).join("")}
      ${[[50, 10, "#f9c6d4"], [88, 40, "#f7c531"], [74, 86, "#fff"], [24, 84, "#f9c6d4"], [12, 38, "#f7c531"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<circle cx="0" cy="-5" r="3.8" fill="${c}" stroke="#a9784b" stroke-width="1.2" transform="rotate(${a})"/>`).join("")}<circle r="2.4" fill="#e0a400"/></g>`).join("")}
      <path class="t-wh" d="M50 76 C26 58 28 38 40 38 C46 38 50 43 50 46 C50 43 54 38 60 38 C72 38 74 58 50 76Z" fill="#f9a1b8" ${ln}/>
      ${face(50, 54, .62)}
    </g>`,
  eggnest: () => `
    <g class="t-eggnest">
      <g transform="translate(14 -6) scale(.74)">${TOYS.egg()}</g>
      <path d="M8 80 Q8 66 22 66 H78 Q92 66 92 80 Q92 94 50 96 Q8 94 8 80Z" fill="#cf9a5b" ${ln}/>
      <path d="M14 74 q10 6 20 0 t20 0 t20 0 t12 0 M12 84 q10 6 22 0 t22 0 t22 0" fill="none" stroke="#9a6a36" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M20 68 l-6 -8 M30 66 l-3 -9 M70 66 l3 -9 M80 68 l6 -8" stroke="#e5be6f" stroke-width="2.4" stroke-linecap="round"/>
    </g>`,
  window: () => `
    <g class="t-window">
      <defs><clipPath id="wclip"><rect x="16" y="14" width="68" height="62" rx="4"/></clipPath></defs>
      <rect x="16" y="14" width="68" height="62" rx="4" style="fill:var(--sky2)"/>
      <g clip-path="url(#wclip)">
        <rect x="16" y="14" width="68" height="34" style="fill:var(--sky1)"/>
        <g class="w-day"><circle cx="72" cy="28" r="7" fill="#f7c531"/><g class="w-cloud"><ellipse cx="34" cy="30" rx="11" ry="5" fill="#fff"/><ellipse cx="42" cy="27" rx="7" ry="5" fill="#fff"/></g></g>
        <g class="w-night"><path d="M70 20 A8 8 0 1 0 77 33 A6.5 6.5 0 0 1 70 20Z" fill="#fde9a6"/>${[[30, 24], [44, 34], [56, 22], [38, 42]].map(([x, y]) => `<circle class="w-star" cx="${x}" cy="${y}" r="1.3" fill="#fff"/>`).join("")}</g>
        <path d="M16 70 Q34 56 52 66 T84 62 V78 H16Z" fill="#8bbf7f"/><path d="M16 74 Q40 64 60 72 T84 70 V78 H16Z" fill="#6fae63"/>
        <g transform="translate(34 12) scale(.4)"><g class="t-balloon">
          <path d="M50 8 C72 8 82 26 80 42 C78 58 62 66 50 70 C38 66 22 58 20 42 C18 26 28 8 50 8Z" fill="#ff9a8a" ${ln}/>
          <path d="M50 8 C40 18 38 54 50 70 C62 54 60 18 50 8Z" fill="#ffd27a" opacity=".9"/>
          <path d="M48 70 L40 86 M52 70 L60 86" stroke="${INK}" stroke-width="2.4" fill="none"/>
          <rect x="36" y="86" width="28" height="12" rx="3" fill="#c68a4b" ${ln}/>
        </g></g>
      </g>
      <path d="M50 14 V76 M16 45 H84" stroke="#fff6e0" stroke-width="3.4"/>
      <rect x="16" y="14" width="68" height="62" rx="4" fill="none" stroke="#c68a4b" stroke-width="5"/>
      <rect x="16" y="14" width="68" height="62" rx="4" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".5"/>
      <path d="M10 14 H34 Q26 38 28 62 H10Z" fill="#f4c7cf" stroke="${INK}" stroke-width="2" stroke-linejoin="round" opacity=".95"/>
      <path d="M90 14 H66 Q74 38 72 62 H90Z" fill="#f4c7cf" stroke="${INK}" stroke-width="2" stroke-linejoin="round" opacity=".95"/>
      <rect x="8" y="76" width="84" height="7" rx="3" fill="#d9a56a" ${ln}/>
      <g transform="translate(28 74)"><path d="M-6 0 L-4 -9 H4 L6 0Z" fill="#e58c6a" ${ln}/><circle cx="0" cy="-13" r="4.4" fill="#f9c6d4" stroke="${INK}" stroke-width="1.6"/><circle cx="0" cy="-13" r="1.7" fill="#f7c531"/></g>
    </g>`,
  us: () => `
    <g class="t-us">
      <g transform="translate(-1 14) scale(.5)"><g class="t-a">${avatarInner("a")}</g></g>
      <g transform="translate(51 14) scale(.5)"><g class="t-b">${avatarInner("b")}</g></g>
      <path class="t-lh" d="M50 24 C44 19 45 13 48 13 C49.5 13 50 15 50 15 C50 15 50.5 13 52 13 C55 13 56 19 50 24Z" fill="#f2698b" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
    </g>`
};

TOYS.frame = () => `
    <g class="t-frame">
      <rect x="7" y="7" width="86" height="86" rx="9" fill="#d9a56a" ${ln}/>
      <rect x="14" y="14" width="72" height="72" rx="5" fill="#fff4d6" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(17 19) scale(.66)">${TOYS.us()}</g>
      <g transform="translate(86 16)">${[0, 72, 144, 216, 288].map(a => `<circle cx="0" cy="-5" r="3.6" fill="#f9c6d4" stroke="#a9784b" stroke-width="1" transform="rotate(${a})"/>`).join("")}<circle r="2.8" fill="#f7c531" stroke="#a9784b" stroke-width="1"/></g>
    </g>`;

function toySVG(name) {
  return `<svg viewBox="0 0 100 100" class="toy-svg" aria-hidden="true">${TOYS[name]()}</svg>`;
}
