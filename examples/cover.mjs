// Example: a simple 1200×630 cover (blog header, social card) with the reference theme.
// Usage: node examples/cover.mjs [--preview]  → examples/cover.svg
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { C, CANVAS, REFERENCE, chromium, createMeasurer, preview, spriteG, spriteSize, svgDoc, text, useTheme } from "../skills/glyphsprite/scripts/engine.mjs";
import { CHAT, ROBOT } from "../skills/glyphsprite/scripts/sprites.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
await useTheme({ ...REFERENCE, sign: { label: "example.com" } });
const browser = await (await chromium()).launch();
const M = await createMeasurer(browser);

const { w: W, h: H } = CANVAS.cover;
const title = await M.wrap("Your agent forgets everything between sessions", 620, { size: 64, weight: 700 });
const [rw, rh] = spriteSize(ROBOT, 18);
let body =
  `<rect x="0" y="${H - 16}" width="${W}" height="16" fill="${C.accent[0]}"/>` +
  text(72, 150, ["Field notes"], { size: 22, weight: 700, fill: C.accent[0], ls: 0.14, upper: true }) +
  text(72, 228, title, { size: 64, weight: 700, fill: C.ink, lh: 1.05 }) +
  spriteG(ROBOT, { x: W - 72 - rw, y: H - 80 - rh, cell: 18, cls: "robot" }) +
  spriteG(CHAT, { x: W - 72 - rw - 40, y: H - 80 - rh - 90, cell: 7 });
const css = `.robot .c-e{transform-box:fill-box;transform-origin:center;animation:blink 4s steps(1) infinite}
@keyframes blink{0%,88%{transform:scaleY(1)}90%{transform:scaleY(.1)}94%{transform:scaleY(1)}}`;

const file = path.join(here, "cover.svg");
fs.writeFileSync(file, svgDoc({ w: W, h: H, bg: C.paper, body, css, title: title.join(" "), sign: { fill: C.muted } }));
console.log("ok", path.basename(file), (fs.statSync(file).size / 1024).toFixed(0) + " KB");
if (process.argv.includes("--preview")) for (const f of await preview(browser, file, [0], path.join(here, "out"))) console.log("  ", f);
await browser.close();
