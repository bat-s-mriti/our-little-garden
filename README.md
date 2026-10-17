# Our Little Garden (v2)

## Run it
Needs a host at a domain root (clean URLs like /day/2026-02-14) with a "send everything to index.html" fallback.
- Netlify / Cloudflare Pages: `_redirects` is included.
- GitHub Pages: `404.html` is included (a copy of index.html).
- Locally: `python3 serve.py` then open http://localhost:8000  (double-clicking index.html no longer works).

If you are replacing the old v1 site, delete its old files (day.html, script.js, etc.) first. Your v1 data stays in your browser and is migrated automatically.

## Edit
Open the site with `?edit` (e.g. https://yoursite/?edit). Edit mode sticks until you open `?edit=off`.
Everything is saved in this browser. Toolbar: Settings (names, theme, currency, our song), Stickers, Export, Import, Reset.

## Let her see your edits
Export downloads a zip. Unzip it and upload the `content` folder into the site's root (replace the old one). Visitors always see what's in `content`. The same zip is your backup; Import restores it.

## Files
- data.js: starter content only.  content/: your published data + media.  js/ css/: the site itself.
