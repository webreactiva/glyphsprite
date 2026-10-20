// Example: an animated cycle on a dark background with the reference theme.
// Usage: node examples/build.mjs [--preview]  → examples/ship-a-fix.svg (+ PNG frames in examples/out/)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { C, REFERENCE, chromium, createMeasurer, preview, spriteG, spriteSize, svgDoc, text, useTheme } from "../skills/glyphsprite/scripts/engine.mjs";
import { BELL, BUG, CHECK, CLOUD, DOC, GEAR, PEN, TERMINAL } from "../skills/glyphsprite/scripts/sprites.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
await useTheme({ ...REFERENCE, sign: { label: "example.com/guides" } });
const browser = await (await chromium()).launch();
const M = await createMeasurer(browser);

// Common 4 s period: every duration divides it.
const ANIM = `
.doc .c-h{transform-box:fill-box;transform-origin:left;animation:write 4s steps(8) infinite}
.pen{animation:pen 4s steps(8) infinite}
.term .c-f{animation:blink 1s steps(1) infinite}
.hop-a{animation:hop 2s steps(1) infinite}
.hop-b{animation:hop 2s steps(1) infinite 1s}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 2s steps(4) infinite}
.march{stroke-dasharray:10 8;animation:march 1s linear infinite}
.bell{transform-box:fill-box;transform-origin:50% 10%;animation:ring 4s steps(1) infinite}
@keyframes write{0%{transform:scaleX(0)}70%,100%{transform:scaleX(1)}}
@keyframes pen{0%{transform:translate(-44px,-10px)}70%,100%{transform:translate(0,0)}}
@keyframes blink{50%{opacity:0}}
@keyframes hop{0%{transform:translateY(0)}25%{transform:translateY(-10px)}50%{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(90deg)}}
@keyframes march{to{stroke-dashoffset:-18}}
@keyframes ring{0%,80%{transform:rotate(0)}84%{transform:rotate(-12deg)}88%{transform:rotate(12deg)}92%{transform:rotate(-6deg)}96%{transform:rotate(0)}}
`;

// Sprite centered on x, standing on baseline y.
const place = (rows, cx, base, opts) => {
  const [w, h] = spriteSize(rows, opts.cell);
  return spriteG(rows, { ...opts, x: Math.round(cx - w / 2), y: Math.round(base - h) });
};

async function cycle() {
  const W = 1400, H = 1000, chalk = { o: C.paper, v: C.muted };
  const [steel, violet, ochre, brick] = [C.accent[4], C.accent[1], C.accent[2], C.accent[0]];
  let body =
    text(56, 100, ["Shipping a fix"], { size: 20, weight: 700, fill: ochre, ls: 0.14, upper: true }) +
    text(56, 176, ["The test you skip is the bug", "you ship."], { size: 60, weight: 700, fill: "#fff", lh: 1.02 });

  const Y0 = 300, CW = 287.5, GAP = 46, CH = 450;
  const stations = [
    { verb: "Write", title: "Fix the smallest thing", body: "One change, one reason. The diff should fit on a screen.", color: violet,
      art: (cx, b) => place(DOC, cx - 18, b, { ...chalk, cell: 8, cls: "doc" }) + place(PEN, cx + 70, b - 20, { ...chalk, cell: 6, cls: "pen" }) },
    { verb: "Test", title: "Prove it broke first", body: "A test that fails before the fix and passes after it.", color: ochre,
      art: (cx, b) => place(TERMINAL, cx, b, { ...chalk, cell: 8, cls: "term" }) },
    { verb: "Review", title: "Bug or no bug", body: "Someone else reads it with the failing case in hand. This is where it holds or not.", color: brick, hot: true,
      art: (cx, b) =>
        place(BUG, cx - 62, b - 10, { ...chalk, cell: 8, cls: "hop-a" }) +
        text(cx, b - 34, ["≠"], { size: 34, fill: C.muted, anchor: "middle" }) +
        place(CHECK, cx + 62, b - 6, { ...chalk, cell: 8, cls: "hop-b" }) },
    { verb: "Deploy", title: "Ship and watch", body: "Small releases, watched for the first hour.", color: steel,
      art: (cx, b) => place(CLOUD, cx - 30, b, { ...chalk, cell: 8 }) + place(GEAR, cx + 78, b - 34, { ...chalk, cell: 5, cls: "spin" }) },
  ];
  const xs = stations.map((_, i) => 56 + i * (CW + GAP));
  for (const [i, st] of stations.entries()) {
    const x = xs[i], cx = x + CW / 2, base = Y0 + 200;
    if (st.hot) body += `<rect x="${x}" y="${Y0 + 8}" width="${CW}" height="${CH}" fill="${st.color}"/>`;
    body += `<rect x="${x + 1.5}" y="${Y0 + 1.5}" width="${CW - 3}" height="${CH - 3}" fill="${C.panel}" stroke="${st.hot ? st.color : C.line}" stroke-width="3"/>`;
    body += text(x + CW - 18, Y0 + 52, [String(i + 1)], { size: 44, weight: 700, fill: C.line, anchor: "end" });
    body += st.art(cx, base);
    body += text(x + 24, base + 50, [st.verb], { size: 38, weight: 700, fill: st.color });
    const tl = await M.wrap(st.title, CW - 48, { size: 22, weight: 700 });
    body += text(x + 24, base + 86, tl, { size: 22, weight: 700, fill: "#fff", lh: 1.25 });
    const bl = await M.wrap(st.body, CW - 48, { size: 19 });
    body += text(x + 24, base + 86 + (tl.length - 1) * 27.5 + 36, bl, { size: 19, fill: C.muted, lh: 1.38 });
    if (i < 3) body += text(x + CW + GAP / 2, Y0 + 118, ["→"], { size: 40, fill: C.muted, anchor: "middle" });
    if (st.hot) {
      const label = "Where it holds";
      const lw = await M.width(label.toUpperCase(), { size: 17, weight: 700, ls: 0.1 });
      body += `<rect x="${x + 20}" y="${Y0 - 19}" width="${lw + 24}" height="32" fill="${st.color}"/>`;
      body += text(x + 32, Y0 + 3, [label], { size: 17, weight: 700, fill: "#fff", ls: 0.1, upper: true });
    }
  }

  // Loop back from Deploy to Review, under the cards.
  const B = Y0 + CH, x1 = xs[3] + CW / 2, x2 = xs[2] + CW / 2, yl = B + 44;
  body += `<path class="march" d="M${x1} ${B + 12} V${yl} H${x2} V${B + 24}" fill="none" stroke="${ochre}" stroke-width="4"/>`;
  body += `<path d="M${x2 - 11} ${B + 30} L${x2} ${B + 14} L${x2 + 11} ${B + 30}" fill="none" stroke="${ochre}" stroke-width="4"/>`;
  body += text((x1 + x2) / 2, yl + 30, ["↺ on every incident"], { size: 20, weight: 700, fill: ochre, anchor: "middle" });

  const by = 860;
  body += `<line x1="56" y1="${by}" x2="1344" y2="${by}" stroke="${C.line}" stroke-width="3" stroke-dasharray="6 6"/>`;
  body += spriteG(BELL, { ...chalk, x: 56, y: by + 26, cell: 6, cls: "bell" });
  body += text(162, by + 58, [
    [{ t: "When the loop holds, " }, { t: "the pager", fill: C.accent[3], weight: 700 }],
    [{ t: "stays quiet", fill: C.accent[3], weight: 700 }, { t: " at night." }],
  ], { size: 23, fill: C.text, lh: 1.3 });
  return svgDoc({ w: W, h: H, bg: C.ink, body, css: ANIM, title: "Shipping a fix: write, test, review and deploy, looping back to review on every incident", sign: { o: C.paper } });
}

const file = path.join(here, "ship-a-fix.svg");
fs.writeFileSync(file, await cycle());
console.log("ok", path.basename(file), (fs.statSync(file).size / 1024).toFixed(0) + " KB");
if (process.argv.includes("--preview")) for (const f of await preview(browser, file, [0, 0.9, 2.6, 3.5], path.join(here, "out"))) console.log("  ", f);
await browser.close();
