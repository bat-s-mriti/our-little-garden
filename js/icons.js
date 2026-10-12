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
  heart: `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 86 C10 56 12 24 32 22 C42 21 48 28 50 34 C52 28 58 21 68 22 C88 24 90 56 50 86Z" fill="#f48fb1" stroke="#d6577f" stroke-width="2"/></svg>`
};

/* suggested stickers on the Stickers page, one tap to add */
const SUGGESTED = ["heart", "e:🌼", "e:🌸", "e:🌷", "e:🪻", "e:🌿", "e:🍀", "e:🐝", "e:🦋", "e:🐞", "e:🐌", "e:🍓", "e:🍒", "e:🧸", "e:🎀", "e:⭐", "e:🌙", "e:☁️", "e:🌈", "e:💛", "e:🍄", "e:🐰", "e:🐱", "e:🧁"];
