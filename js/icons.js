/* icons.js: the built-in drawn stickers. More stickers (emoji or pictures) are added from the Stickers page. */
"use strict";

const ICONS = {
  sunflower: `<svg viewBox="0 0 100 100" aria-hidden="true">
    ${[0, 30, 60, 90, 120, 150].map(a => `<g transform="rotate(${a} 50 50)"><ellipse cx="50" cy="20" rx="8" ry="17" fill="#f7c531" stroke="#e0a400" stroke-width="1.5"/><ellipse cx="50" cy="80" rx="8" ry="17" fill="#f7c531" stroke="#e0a400" stroke-width="1.5"/></g>`).join("")}
    <circle cx="50" cy="50" r="17" fill="#6b4226"/>
    <circle cx="44" cy="46" r="2" fill="#8a5a36"/><circle cx="56" cy="46" r="2" fill="#8a5a36"/>
    <circle cx="50" cy="55" r="2" fill="#8a5a36"/><circle cx="50" cy="44" r="2" fill="#8a5a36"/>
  </svg>`,
  lily: `<svg viewBox="0 0 100 100" aria-hidden="true">
    ${[0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a} 50 50)"><path d="M50 50 C38 34 42 12 50 6 C58 12 62 34 50 50Z" fill="#f9c6d4" stroke="#e58ca8" stroke-width="1.8"/><path d="M50 46 L50 18" stroke="#e58ca8" stroke-width="1.2" stroke-linecap="round"/></g>`).join("")}
    <circle cx="50" cy="50" r="6" fill="#f7c531"/>
    ${[0, 72, 144, 216, 288].map(a => `<circle cx="${50 + 12 * Math.cos(a * Math.PI / 180)}" cy="${50 + 12 * Math.sin(a * Math.PI / 180)}" r="2.4" fill="#c2527a"/>`).join("")}
  </svg>`,
  mushroom: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M38 52 Q36 88 42 90 L58 90 Q64 88 62 52Z" fill="#fff1d6" stroke="#c9a77a" stroke-width="2"/>
    <path d="M10 54 C10 22 30 10 50 10 C70 10 90 22 90 54 Q50 62 10 54Z" fill="#e0534a" stroke="#a83a33" stroke-width="2"/>
    <circle cx="32" cy="34" r="6" fill="#fff"/><circle cx="56" cy="24" r="5" fill="#fff"/>
    <circle cx="72" cy="40" r="6" fill="#fff"/><circle cx="48" cy="44" r="3.5" fill="#fff"/>
  </svg>`,

  daisy: `<svg viewBox="0 0 100 100" aria-hidden="true">
    ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="22" rx="6.5" ry="17" fill="#fffdf5" stroke="#d8cbb0" stroke-width="1.5" transform="rotate(${i * 30} 50 50)"/>`).join("")}
    <circle cx="50" cy="50" r="12" fill="#f7c531" stroke="#e0a400" stroke-width="1.5"/><circle cx="46" cy="47" r="2" fill="#fbe08a"/>
  </svg>`,
  tulip: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M50 94 V52" stroke="#5a8a55" stroke-width="5" stroke-linecap="round"/>
    <path d="M50 88 C30 86 24 70 22 58 C38 62 48 72 50 88Z" fill="#8bbf7f" stroke="#5a8a55" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 88 C70 86 76 72 78 58 C62 62 52 72 50 88Z" fill="#a3d095" stroke="#5a8a55" stroke-width="2" stroke-linejoin="round"/>
    <path d="M26 20 C26 48 36 60 50 60 C64 60 74 48 74 20 L62 32 L50 14 L38 32Z" fill="#f48fa1" stroke="#c9566f" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 14 C44 30 44 48 50 60 C56 48 56 30 50 14Z" fill="#f9b4c1" opacity=".85"/>
  </svg>`,
  strawberry: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M50 92 C20 76 14 50 20 38 C26 28 40 30 50 34 C60 30 74 28 80 38 C86 50 80 76 50 92Z" fill="#ee4f5e" stroke="#b83344" stroke-width="2" stroke-linejoin="round"/>
    ${[[34, 48], [50, 46], [66, 48], [40, 62], [58, 62], [50, 76], [30, 62], [70, 62]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="#fde8a0"/>`).join("")}
    <path d="M50 34 L36 24 L44 30 L40 16 L50 28 L60 16 L56 30 L64 24Z" fill="#6fae63" stroke="#4a7d44" stroke-width="2" stroke-linejoin="round"/>
  </svg>`,
  butterfly: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M50 46 C36 14 10 16 12 40 C13 56 34 58 50 50Z" fill="#cdb7f0" stroke="#8d6fc4" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 46 C64 14 90 16 88 40 C87 56 66 58 50 50Z" fill="#cdb7f0" stroke="#8d6fc4" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 52 C38 56 22 62 26 78 C30 90 46 80 50 60Z" fill="#f9c6d4" stroke="#d6577f" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 52 C62 56 78 62 74 78 C70 90 54 80 50 60Z" fill="#f9c6d4" stroke="#d6577f" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="28" cy="34" r="5" fill="#fff" opacity=".8"/><circle cx="72" cy="34" r="5" fill="#fff" opacity=".8"/>
    <rect x="47" y="30" width="6" height="42" rx="3" fill="#5b3a29"/>
    <path d="M48 32 Q42 20 36 18 M52 32 Q58 20 64 18" fill="none" stroke="#5b3a29" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  cherry: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M32 66 C34 44 44 26 62 14 M70 70 C68 46 66 28 62 14" fill="none" stroke="#5a8a55" stroke-width="3" stroke-linecap="round"/>
    <path d="M62 14 C74 10 86 16 90 26 C78 28 68 24 62 14Z" fill="#8bbf7f" stroke="#5a8a55" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="30" cy="72" r="17" fill="#d6304a" stroke="#9e2236" stroke-width="2"/><circle cx="70" cy="76" r="17" fill="#e04058" stroke="#9e2236" stroke-width="2"/>
    <ellipse cx="24" cy="66" rx="4" ry="6" fill="#fff" opacity=".45"/><ellipse cx="64" cy="70" rx="4" ry="6" fill="#fff" opacity=".45"/>
  </svg>`,
  bee: `<svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="38" cy="32" rx="12" ry="18" fill="#d9eef7" stroke="#8fb9cc" stroke-width="2" transform="rotate(-22 38 32)"/><ellipse cx="62" cy="32" rx="12" ry="18" fill="#d9eef7" stroke="#8fb9cc" stroke-width="2" transform="rotate(22 62 32)"/>
    <ellipse cx="50" cy="60" rx="30" ry="23" fill="#f7c531" stroke="#5b3a29" stroke-width="2.5"/>
    <clipPath id="bc"><ellipse cx="50" cy="60" rx="30" ry="23"/></clipPath>
    <g clip-path="url(#bc)"><rect x="30" y="30" width="9" height="60" fill="#5b3a29"/><rect x="58" y="30" width="9" height="60" fill="#5b3a29"/></g>
    <circle cx="36" cy="56" r="2.6" fill="#3b2a20"/><circle cx="46" cy="56" r="2.6" fill="#3b2a20"/><path d="M38 62 Q41 66 44 62" fill="none" stroke="#3b2a20" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  heart: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 86 C10 56 12 24 32 22 C42 21 48 28 50 34 C52 28 58 21 68 22 C88 24 90 56 50 86Z" fill="#f48fb1" stroke="#d6577f" stroke-width="2"/></svg>`
};

/* suggested stickers on the Stickers page, one tap to add */
const SUGGESTED = ["heart", "daisy", "tulip", "strawberry", "butterfly", "cherry", "bee", "e:🌼", "e:🌸", "e:🌷", "e:🪻", "e:🌿", "e:🍀", "e:🐝", "e:🦋", "e:🐞", "e:🐌", "e:🍓", "e:🍒", "e:🧸", "e:🎀", "e:⭐", "e:🌙", "e:☁️", "e:🌈", "e:💛", "e:🍄", "e:🐰", "e:🐱", "e:🧁"];
