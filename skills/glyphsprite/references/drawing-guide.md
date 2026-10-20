# Drawing sprites

## Format

A sprite is an array of strings; each character is one cell. `.` is transparent.
`spriteG(rows, { x, y, cell, o, v, cls })` draws it as a `<g>` inside an SVG;
`sprite(...)` as a standalone `<svg>` for HTML. Rows may have different lengths.

Start from the catalog: `node scripts/catalog.mjs <theme> catalog.svg` renders
every sprite in `scripts/sprites.mjs` under the theme. Copy the closest one and
change it rather than starting from an empty grid.

## Legend

Letters are **roles**, not fixed colors. The theme decides the actual hex.

| Char | Role | Use |
|---|---|---|
| `o` | per call | outline: `C.paper` on dark backgrounds, `C.ink` (default) on light ones |
| `v` | per call | steam, smoke, air |
| `w` / `k` | paper / ink | light fills, drawn text |
| `r` `R` | accent 0 / its shadow | |
| `l` `L` | accent 1 / its light tint | |
| `y` `Y` | accent 2 / shadow | |
| `g` `G` | accent 3 / shadow | |
| `b` `B` | accent 4 / shadow | |
| `n` | accent 5 | |
| `s` `S` | light / mid grey | metal, ruled paper (neutral under every theme) |
| `m` `M` | wood / dark wood | (neutral under every theme) |
| `d` `e` `f` `F` `h` `p` | copies of `l`, `k`, `y`, `r`, pen, `y` | **animatable parts**: same color, own group |

Each character ends up in its own `<g class="c-X">`. To animate one part (eyes,
a flame, a drop, a cursor), draw it with its animatable letter and target it in
CSS as `.my-sprite .c-e`.

Pick letters by role, not by the color you see in the reference palette: under
another theme `r` may be blue. If a sprite needs a real-world color (a green
"ok", a red "error"), say so to the user when the theme's accents don't carry it,
or override with `pixels` in the theme.

## Rules that work

- **1-cell outline** around everything. That is the "fat pixel" style.
- **2–4 fill colors + 1 shadow** (the dark variant on the bottom or right edge).
  More colors look dirty.
- **Highlight**: 1–3 `w` cells in the top-left of round objects.
- **Size**: 10–24 cells a side. Cell of 4–6 px for supporting icons, 7–9 px for
  the main subject, 11+ px for one object alone on a shelf.
- **Silhouettes that read without color**: if you can't tell what it is with
  the color removed, change the shape, not the color.
- **Composition**: two sprites with a sign between them (`≠`, `→`) tell a
  comparison better than one complex sprite.

## What went wrong before, and the fix

- **Spoons that read as wrenches**: the bowl was a rectangle as wide as the
  handle. Fix: a 5-cell oval bowl, a 1-cell handle, a highlight on the bowl.
- **A pen cut out of another sprite** dragged pieces of the original outline.
  Fix: draw it as its own sprite (`PEN`).
- **A flat book did not read as a book**. Fix: a spine in another color on the
  left, a `w` page edge on the right and a ribbon hanging below.
- **Light grey steam on paper**: invisible. On light backgrounds use `v: C.muted`.
- **Stains on top of text**: put them in empty areas at 0.2–0.3 opacity.
- **Callout leader lines that cross their own label**: the line leaves from the
  side of the label that faces the target, never through it.
- **Labels that overflow their card**: wrap titles with `wrap()` too, not only
  body text, and avoid a single orphan word.
- **Top callouts that overlap**: measure each label (`M.width`) before laying
  them out in a row.

## Catalog (`scripts/sprites.mjs`)

Objects: `BELL`, `BLOB` (stain), `BOARD` (chalkboard), `BOOK`, `BULB`, `CAN`,
`CHAT`, `CLOCHE`, `CLOUD`, `DATABASE`, `DOC` (`h` lines that write themselves),
`FOLDER`, `GATE` (light `f`), `GEAR`, `HAT`, `KEY`, `PEN`, `TERMINAL` (cursor
`f`), `TICKET`, `TIMER`. Status: `CHECK`, `CROSS`, `BUG`. Character: `ROBOT`
(eyes `e` blink, antenna light `f`).

A sprite drawn for one piece lives next to that piece's script. Add it to the
catalog only when it is useful outside it.
