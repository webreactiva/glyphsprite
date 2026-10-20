# Theming

glyphsprite has no look of its own. Every piece is drawn with a **theme**: two
base colors, a list of accents, an optional font and an optional signature.
`useTheme()` must run before anything is drawn.

## Where the theme comes from

In this order, first match wins:

1. **What the user gave you** in the conversation: hex values, a brand page, a
   theme file path. Write it to `theme.json` in the `glyphsprite/` workspace
   (see SKILL.md) so the next piece reuses it.
2. **`glyphsprite/theme.json`** in the working directory, or the theme file of
   an existing workspace the user points to.
3. **`DESIGN.md`** in the working directory ([format](https://github.com/google-labs-code/design.md)).
   The engine reads the `colors:` and `typography:` blocks of its front matter.
4. **Nothing found: ask.** Never pick colors on your own. Ask once, in a single
   message, for:
   - background style (dark ink or light paper) and the two base colors,
   - 3–6 accent colors, most important first,
   - font: a Google Fonts family (easiest) or their own font files
     (.woff2/.ttf/.otf). Font files are the user's: never copy them into the skill.
   - signature: a short label (a domain or a path) and an optional logo SVG.

   Offer the **reference palette** (`REFERENCE` in `engine.mjs`) as one ready
   answer: a deliberately quiet one, graphite `#22252a`, paper `#f4f3ef`,
   accents brick `#c0654f`, dusk `#8a84b0`, ochre `#d6b25e`, sage `#86a97f`,
   steel `#6e93b5`, mauve `#a7708f`, font Inter from Google Fonts. If they
   pick it, use it; do not apply it without asking.

## How DESIGN.md is mapped

The spec has no "ink" or "paper" roles, so the engine maps by luminance: the
darkest color is `ink`, the lightest is `paper`, and the rest become accents in
the order they appear. The first `fontFamily` in `typography:` is the font;
if it is on Google Fonts, add `google: true` to embed it, otherwise ask for the
files or accept the system fallback.
`useTheme()` returns the theme with a `mapping` field naming which token went
where. **Tell the user that mapping before drawing** and fix it if it is wrong
(a theme file overrides DESIGN.md). Only hex colors are read; token references
and `oklch()` are skipped.

## theme.json

```json
{
  "name": "Acme",
  "ink": "#14213d",
  "paper": "#fbf7f0",
  "accents": ["#e4572e", "#7b5ea7", "#f3a712", "#29bf12", "#3a86ff", "#c4508f"],
  "font": {
    "family": "Inter",
    "files": { "400": "fonts/Inter-Regular.woff2", "700": "fonts/Inter-Bold.woff2" }
  },
  "sign": { "label": "acme.example/blog", "mark": "brand/logo.svg", "tint": true, "opacity": 0.3, "size": 80 }
}
```

| Key | Required | Notes |
|---|---|---|
| `ink`, `paper` | yes | Hex. Dark and light base: background, outlines, text. |
| `accents` | yes | 1–6 hex colors. Fewer than six cycle. |
| `panel`, `line`, `text`, `muted` | no | Derived from ink and paper when missing. |
| `font.family` | no | Without it, `system-ui`. |
| `font.google` | no | `true` downloads `family` from Google Fonts (latin subset, cached in `~/.cache/glyphsprite/fonts`) and embeds it. The easiest way to get a real font: no files to ship. |
| `font.weights` | no | With `google`: weights to fetch. Default `[400, 700]`. |
| `font.files` | no | Weight → file, relative to the theme file. Embedded in every SVG (an SVG in `<img>` cannot load fonts). Without files the viewer's installed font is used, so text measured in the preview may wrap differently elsewhere. |
| `fonts` | no | Extra families for display text, e.g. `[{ "family": "Silkscreen", "google": true, "weights": [400, 700] }]`. Same keys as `font`; `weights` defaults to `[400]`. Use one with `text(..., { family: "Silkscreen" })` and measure it with `M.width(s, { family: "Silkscreen" })`. Each family adds weight to every SVG: keep them for titles. |
| `font.unicodes` | no | Subset range for pyftsubset. Default covers Latin-1 plus dashes, quotes, arrows and `≠`. |
| `sign.label` | no | Bottom-right text. |
| `sign.mark` | no | Logo SVG, top-right, small and translucent. `tint: true` repaints it in the outline color. |
| `pixels` | no | Override any sprite letter, e.g. `{ "s": "#d0d4dc" }`. |

Paths resolve against the folder of the theme file (or the working directory
for a theme object). To combine sources, spread them:
`useTheme({ ...loadTheme(), sign: { label: "acme.example" } })`.

## What the theme drives

`C` holds layout colors: `C.ink`, `C.paper`, `C.panel`, `C.line`, `C.text`,
`C.muted`, `C.accent[0..5]`, `C.pen`. `PAL` is the sprite legend (see
`drawing-guide.md`): accent letters follow the theme, so every catalog sprite
recolors itself; metal (`s/S`) and wood (`m/M`) stay neutral.
