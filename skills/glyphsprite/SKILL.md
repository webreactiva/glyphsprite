---
name: glyphsprite
argument-hint: "What should the picture explain? [--keep=image|sources|archive]"
description: 'Draws pixel-art sprites as ASCII rows and turns them into crisp SVG illustrations: infographics, explainer diagrams, blog covers and social cards, static or animated with CSS inside the SVG. Ships a themeable engine (ASCII → SVG, real-font text measuring and wrapping, embedded Google Fonts, frame-by-frame preview) and a catalog of reference sprites to start from. Takes colors and fonts from a DESIGN.md, a theme file or the user, and asks when there are none. Use it whenever someone wants "an infographic", "a diagram for this post", "a pixel-art illustration", "an animated SVG", "motion graphics without video", "a blog cover", "an OG / social image", "a header image", "explain this visually", or wants a cycle, a process, a comparison or a set of levels drawn as an image, even if they do not mention pixel art or SVG.'
---

# glyphsprite

Pixel-art illustrations with your own typography and colors, written as SVG.
A sprite is a few lines of ASCII; the engine turns it into rectangles, sets the
text with the real font, and can animate parts of it. The result is one `.svg`
served with a plain `<img>`: sharp at any size, no JS, the animation inside
the file.

Output text (titles, labels) goes in the user's language.

## Files here

| | |
|---|---|
| `scripts/engine.mjs` | The engine. Import it from the piece script; do not edit it to build a piece. |
| `scripts/sprites.mjs` | Reference sprites. Start new ones from the closest one. |
| `scripts/catalog.mjs` | Renders every sprite under a theme into one SVG to look at. |
| `references/theming.md` | **Read before drawing.** Where colors and fonts come from and what to ask. |
| `references/drawing-guide.md` | Sprite legend and drawing rules. Read before drawing a new sprite. |
| `references/animation.md` | Animation rules and ready keyframes. Read only if the piece moves. |

## Pre-flight

1. **Node 18+** and **playwright** with Chromium, resolved from the working
   project (`npm i -D playwright && npx playwright install chromium`). It is
   used to measure text and to preview; the SVG itself needs nothing.
2. Optional: `pyftsubset` (fonttools + brotli) shrinks embedded fonts. Without
   it the whole font file is embedded and the engine warns.
3. Optional: `cwebp`, only for `htmlToWebp()`.

## Workflow

### 1. Theme first

Follow `references/theming.md`: what the user gave you → `glyphsprite/theme.json`
→ `DESIGN.md` → **ask**. When DESIGN.md is used, tell the user which token
became ink, paper and each accent. Never invent colors; offer the reference
palette as one of the answers when you ask.

### 2. One idea per piece

Before drawing, write in one sentence what the reader has to understand. Each
piece explains **one** thing: a cycle, a comparison, a ladder of levels, a
before/after, or (for a cover) one title and one image. Find a visual metaphor
and carry it all the way: verbs, sprites and microcopy from the same world. If
the page already has a table that says the same, the picture must add something
the table does not, or it is not needed.

### 3. The workspace and the piece script

Everything except the final image lives in **one folder named `glyphsprite/`**,
next to where the image is delivered (for example `assets/glyphsprite/` when the
image goes to `assets/`):

```
assets/
  phases.svg            the deliverable, the only file the page references
  glyphsprite/
    theme.json          colors, font, signature
    phases.mjs          one script per piece; writes ../phases.svg
    sprites.mjs         only if the piece has sprites of its own
    .gitignore          "out/"
    out/                preview frames, never committed
```

Never scatter theme files, scripts or frames elsewhere in the project. The
script imports the engine from this skill:

```js
import { C, CANVAS, chromium, createMeasurer, preview, spriteG, spriteSize, svgDoc, text, useTheme }
  from "<skill dir>/scripts/engine.mjs";
import { DOC, PEN, TERMINAL } from "<skill dir>/scripts/sprites.mjs";

await useTheme(path.join(here, "theme.json"));   // or an object
const browser = await (await chromium()).launch();
const M = await createMeasurer(browser);
```

Canvas: `CANVAS.cover` (1200×630, blog header and social card),
`CANVAS.wide` (1600×900), `CANVAS.square` (1080×1080) or
`CANVAS.infographic` (1400 wide, height from content: 540–1040).

### 4. Lay out

Formats that work:

- **Cover**: eyebrow + title (2–3 lines) on one side, one large sprite (cell
  14–20) on the other, a thin accent band or nothing. One accent color, no cards.
- **Cycle / process**: a row of 3–4 cards, 40–46 px apart, numbered, arrows
  between them, and **one highlighted card** (border and solid offset shadow in
  its color plus a small badge). A dashed loop-back line if the process repeats.
- **Comparison**: two boxes with a sprite each and a sign or a sprite between them.
- **Ladder**: steps of increasing height, one sprite per step.
- **Footer** (optional): dashed rule, small sprite, one sentence with the takeaway.

Margins 56–72. Square corners and solid shadows read best with pixel art;
follow the theme's DESIGN.md if it says otherwise. Backgrounds: `C.ink`
(chalkboard) or `C.paper`.

**Signature**: `svgDoc` adds the theme's `sign` (label bottom right, optional
logo top right, small and translucent). Pass `sign: false` to leave it out and
`sign: { o: C.paper }` on dark backgrounds.

**Text is never placed by eye.** `M.wrap(text, maxWidth, font)` and
`M.width(text, font)` measure with the real font; compute box heights from the
lines they return. Body text at least 19 px on a 1400 canvas: it must still read
at half size on a phone.

### 5. Draw sprites

Look at the catalog first (`node scripts/catalog.mjs <theme> catalog.svg`, then
open or screenshot it). Read `references/drawing-guide.md` before making a new
one. The essentials: ASCII grid, 1-cell outline with `o`, 2–4 fills plus one
shadow, outline in **paper** on dark backgrounds and **ink** on light ones
(`{ o: C.paper }`).

### 6. Animate (optional)

Only if movement **explains** something: the direction of a flow, what repeats,
what is being written. Ambient detail (steam, blinking) accompanies, it does not
lead. Patterns and pitfalls in `references/animation.md`. Minimum rules: one
common period (4 s) that every duration divides, `steps()` on everything pixel
art; `svgDoc` already stops everything under `prefers-reduced-motion`.

### 7. Review by looking

`preview(browser, svgFile, [0, 0.9, 2.6, 3.5], outDir)` writes one PNG per
instant. **Read each PNG** before calling it done. Look for text overflowing its
box, sprites that are not obvious at first sight, overlaps, dead gaps, and that
frame 0 works alone (it is what reduced-motion users see). Fix and repeat. First
drafts are never right.

### 8. Deliver

Save the `.svg` where the user's site serves images and reference it as a file
(`<img src="…svg" alt="what the picture says, not what it is">`), never as an
inline `<svg>` pasted into Markdown. For a social card that platforms must
render, also export a PNG (any `preview` frame at 0 s works).

### 9. Keep the image, or the sources too

If the user passed `--keep=image`, `--keep=sources` or `--keep=archive`, do that
without asking. Otherwise, once the image is approved, ask one question with
these options, in this order:

- **image**: keep the deliverable and `glyphsprite/theme.json`; delete the rest
  of the workspace (scripts, piece sprites, `out/`). Changing the picture later
  means drawing it again, but the next piece keeps the same look.
- **sources**: keep the whole workspace, so anyone can edit the script and
  regenerate the image with `node <workspace>/<piece>.mjs`. Recommend this when
  the content is likely to change (a process, a list of features).
- **archive**: keep the deliverable and `theme.json` in the project and move the
  rest of the workspace out of it, to
  `~/.cache/glyphsprite/archive/<project folder>/<piece>-<YYYY-MM-DD>/`. The repo
  stays clean and the piece can still be recovered. Tell the user the path.

The theme is never deleted with a piece: it is the style shared by every piece.
Delete it only when the user asks for that explicitly. Name the exact files or
folder before deleting or moving them, and touch nothing else.

## Do not

- Video, GIF or animated WebP: the animation lives inside the SVG.
- External fonts or `<script>` in the SVG: inside `<img>` they do not load. The
  engine embeds the font as base64.
- Hard-coded hex colors in a piece: use `C` and `PAL` so the theme decides.
- Long comments in piece scripts: the explanation lives in this file and in
  `references/`.
