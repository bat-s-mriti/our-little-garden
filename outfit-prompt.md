# Outfit prompt (paste this together with the outfit photo)

Attach the full outfit photo (both of you in one photo, or two photos), paste everything below the line, and fill in the three [brackets].

---

Turn the outfit photo(s) I attached into a **mini-us outfit file** for my cottagecore website. Reply with ONLY one JSON code block, nothing else, so I can save it as `<id>.json`.

**Who is who:** person A = [Batsal, describe where they are in the photo], person B = [Smriti, describe where they are in the photo].
**Outfit name / occasion / date:** [e.g. Picnic day / picnic / 2026-10-11]

**Format (exact):**
```
{"format":"mini-us-outfit","v":1,"id":"<date>-<short-name, lowercase-with-dashes>","name":"<outfit name>","date":"YYYY-MM-DD","occasion":"<occasion>",
 "a":{"body":"<svg shapes>","over":"<svg shapes>"},
 "b":{"body":"<svg shapes>","over":"<svg shapes>"}}
```
**Fixed canvas (never change it):** every figure is drawn in a 100 wide x 140 tall coordinate space, cute chibi proportions: a big head on a small, soft, rounded body. Same size and pose for everyone (standing, arms by the sides, facing front). The head is NOT drawn: it is a fixed head the site adds (a circle centred at 50,38 with radius 25, plus hair). Do not draw a head, face, hair or neck above y=64.
Skeleton to follow (all garments must sit on this):
- Torso: soft rounded blob x 30-70, y 64-105. Shoulders at y~66.
- Arms: short rounded capsules centred x~26.5 and x~73.5, y 70-93, ending in round mitten hands (circles r5 at 24.5,95 and 75.5,95).
- Legs: short stubby capsules x 37.5-48 and 52-62.5, y 100-123.
- Shoes: round ovals (rx 8.5, ry 5) centred at 42.5,127 and 57.5,127.
- Skin colour for visible arms, hands and legs: `#e3b48d`.
`body` = everything under the head: top, bottoms or dress, sleeves, shoes, bag straps, jacket, plus the skin of arms/legs/hands. `over` = things drawn on top of the head: hats, glasses, hair clips, bows, flowers, scarf or necklace reaching the face. Use "" if none (a hat sits around y 8-30).
Make everything **cute and soft**: rounded corners, puffy shapes, slightly oversized collars, cuffs and pockets, no sharp points or straight stiff edges. Copy the real colours, patterns (stripes, checks, dots as simple shapes), sleeve length, hem length, footwear, logos as a tiny simple mark, and accessories from the photo as faithfully as a tiny flat icon allows.

**Style rules (the site rejects anything else):**
- Only these tags: g, path, circle, ellipse, rect, line, polygon, polyline.
- Flat solid fills (hex colours). Outline every garment with stroke `#6b4a3a`, stroke-width 1.6, stroke-linecap round, stroke-linejoin round, like the existing icons.
- NO gradients, filters, `<defs>`, `<use>`, `<image>`, `<text>`, ids, `url(...)`, scripts, event handlers, or CSS.
- Each of `body` and `over` under 30,000 characters. Round numbers to 1 decimal.
- Same layers, same canvas and same level of detail for both people so they match as a set.
