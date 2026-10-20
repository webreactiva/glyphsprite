# Animation inside the SVG

The SVG is served with `<img>`, so only **CSS inside the SVG itself** works (no
JS, no external resources). The `@keyframes` go in `svgDoc({ css })`.

## Rules

1. **One common period**. Pick 4 s and make every duration divide it (0.5, 1,
   2, 4 s). Otherwise the loop jumps visibly.
2. **`steps()` for everything pixel art**. Eased motion on pixels looks fake.
   Keep `linear` for lines and strokes (`stroke-dashoffset`).
3. **The animation class goes outside the sprite**. `spriteG({ cls })` puts it on
   an outer `<g>` because an animated `transform` would override the inner
   `translate/scale`. Units: on the outer `<g>`, canvas px; on color groups
   (`.c-X`), cells.
4. **`transform-box: fill-box`** before rotating or scaling something around
   itself (`transform-origin` relative to the piece, not the canvas).
5. **Frame 0 must tell the story on its own**. With `prefers-reduced-motion`
   everything stops (`svgDoc` adds that), and it is what the static preview shows.
6. **Move little and on purpose**: 1–3 things that explain the concept plus one
   ambient detail. If everything moves, nothing stands out.

## Recipes (used in `examples/build.mjs`)

```css
/* Directed flow: the dashed line "walks" toward the arrow */
.march{stroke-dasharray:10 8;animation:march 1s linear infinite}
@keyframes march{to{stroke-dashoffset:-18}}

/* Something being written: DOC "h" lines grow and the pen follows */
.doc .c-h{transform-box:fill-box;transform-origin:left;animation:write 4s steps(8) infinite}
.pen{animation:pen 4s steps(8) infinite}
@keyframes write{0%{transform:scaleX(0)}70%,100%{transform:scaleX(1)}}
@keyframes pen{0%{transform:translate(-44px,-10px)}70%,100%{transform:translate(0,0)}}

/* Taking turns between two pieces (compare, alternate) */
.hop-a{animation:hop 2s steps(1) infinite}
.hop-b{animation:hop 2s steps(1) infinite 1s}
@keyframes hop{0%{transform:translateY(0)}25%{transform:translateY(-10px)}50%{transform:translateY(0)}}

/* One-off alert at the end of the cycle (bell, notification) */
.bell{transform-box:fill-box;transform-origin:50% 10%;animation:ring 4s steps(1) infinite}
@keyframes ring{0%,80%{transform:rotate(0)}84%{transform:rotate(-12deg)}88%{transform:rotate(12deg)}92%{transform:rotate(-6deg)}96%{transform:rotate(0)}}

/* Work in progress: a gear turning a quarter at a time */
.spin{transform-box:fill-box;transform-origin:center;animation:spin 2s steps(4) infinite}
@keyframes spin{to{transform:rotate(90deg)}}

/* Ambient: rising steam, flame, drop, blink, cursor */
.x .c-v{animation:rise 2s steps(4) infinite}
@keyframes rise{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-3px);opacity:0}}
.x .c-f{animation:flick .5s steps(1) infinite}
@keyframes flick{50%{transform:translateY(-1px)}}
.x .c-d{animation:drip 1s steps(4) infinite}
@keyframes drip{0%{transform:translateY(-3px);opacity:0}25%{opacity:1}100%{transform:translateY(2px);opacity:1}}
.robot .c-e{transform-box:fill-box;transform-origin:center;animation:blink 4s steps(1) infinite}
@keyframes blink{0%,88%{transform:scaleY(1)}90%{transform:scaleY(.1)}94%{transform:scaleY(1)}}
.term .c-f{animation:cursor 1s steps(1) infinite}
@keyframes cursor{50%{opacity:0}}
```

## Review

`preview(browser, svgFile, [0, 0.9, 2.6, 3.5], outDir)` pauses every animation,
sets the instant and takes one screenshot per time. Look at least at 0 (the
still version) and one frame in the middle of each movement. Then, in the page
where the SVG lives, take two screenshots in a row: if they are identical, the
animation is not running inside the `<img>`.

Rough weight: two subset fonts add about 30 KB per piece; the rest is geometry.
