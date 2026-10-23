# Our Little Garden

A cottagecore memory site for two: a gallery, one page per day, and little extras (map, calendar, stats, bucket list, date jar, letters). Plain files, no build step.

## How it is hosted
- The site files live in a private GitHub repo.
- Netlify is linked to that repo and redeploys automatically whenever the repo changes.
- The site needs the root of a domain (clean URLs like `/day/2026-02-14`) and a "send everything to index.html" fallback. `_redirects` (Netlify) and `404.html` (GitHub Pages) are included.

## Editing
Open the site with `?edit` (for example `https://your-site/?edit`). Edit mode sticks until you open `?edit=off`.
- **Everything you change is saved in this browser only** until you publish.
- Toolbar: Settings (title, names, date, currency, our song), Stickers, Publish, ⚙︎ (publish settings), Export, Import, Reset, Done.
- About us has a card for each of you: full name, nicknames, birthday (age in years, months and days, countdown to the next birthday, star sign), home address with a map pin, phone, email, your own extra details, and your own favourite songs, foods, films and places. Pinning both homes shows them on the map with the straight-line distance (displacement) and the road distance (from the free OSRM service).
- Each day is built from optional, reorderable sections: note, photos and videos, polaroids, places and map, food, spending, outfit, song, movies, quotes, love notes, highlight, bucket ticks, scorecard, tickets, voice notes.
- Photos and videos can be added in bulk or dropped onto a section. Videos autoplay one at a time.
- Outfits are not editable. Each person has a fixed head (`js/heads.js`) and wears an outfit from the outfit library: a few built-in ones plus any you upload as an outfit file (made from a photo with the outfit prompt). In About us (edit mode) scroll the library and tap one to wear it; in a day's outfit section upload a file for both of you and pick per person. The heads are also in the sticker library.
- Places have an “Open in Google Maps” link (no key needed); maps stay on OpenStreetMap.
- The Stickers page controls the flowers and emoji used around the site and in the background.

## Publishing (one click)
Press **Publish** in edit mode. It saves your data, photos, videos and songs into the repo's `content` folder; Netlify then updates the live site about a minute later, so everyone sees it.

One-time setup (⚙︎ next to Publish):
1. Repository: `owner/name` of the GitHub repo. Branch: usually `main`. Site folder: empty unless the site is inside a subfolder.
2. Access token: GitHub → Settings → Developer settings → Fine-grained tokens, limited to this repository only, with **Contents: Read and write**. Give it an expiry.

The token stays in that one browser and is never put in the site data or in exports. Only set it up on your own devices. If two devices publish, the last one wins. Videos over 50 MB are too big to publish this way.

## Privacy
The site is open to anyone who has the link. In About us (edit mode), tick the 🔒 next to anything visitors should not see. Phone, email and home are locked by default. Locked details stay on your device and **Publish leaves them out** (a locked home also hides the map pins and distances). Exports are full backups and include them, so keep exports to yourself.

## Backup
**Export** downloads a zip with `content/data.json` and `content/media/*`. **Import** restores it into a browser (it also accepts the old v1 `.json` backup). Export before big changes.

## Look
One cottagecore look with a day and night mode (sun/moon button, top right). The homepage links are objects in a little room: calendar and map on the wall, a window for the timeline, a picture frame for About us, jar and bucket on the tables, and a surprise egg. On small screens the room becomes a panel under the title.

## Updating the site files
Upload changed files to the repo (GitHub: Add file → Upload files; folders keep their structure). Do not touch the `content` folder, which holds what you published. After a deploy, hard refresh (Ctrl+Shift+R).

## Files
- `index.html`, `404.html`: the page shell (identical).
- `css/style.css`, `css/cottage.css`, `css/edit.css`: styles; `edit.css` only loads in edit mode.
- `js/`: the site's code (`core`, `ui`, `pages`, `sections`, `app`, `publish`, `zip`, `music`, `tinymap`, `heads`, `avatar`, `toys`, `icons`).
- `data.js`: starter content shown until something is published.
- `content/`: your published data and media.
- `_redirects`: Netlify fallback. `serve.py`: local preview (`python3 serve.py`, then open http://localhost:8000).

## Notes
- Music needs one tap on the first visit (browsers block autoplay). YouTube and Spotify links show as an embed instead of playing in the background.
- The map and place search need internet.
- Opening `index.html` by double-clicking does not work; use the hosted site or `serve.py`.
