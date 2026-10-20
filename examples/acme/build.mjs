// Example: a static comparison on a light background, themed from the DESIGN.md next to it.
// Usage (from examples/acme/): node build.mjs [--preview]  → cache-vs-database.svg
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { C, chromium, createMeasurer, loadTheme, preview, spriteG, spriteSize, svgDoc, text, useTheme } from "../../skills/glyphsprite/scripts/engine.mjs";
import { DATABASE, KEY, TIMER } from "../../skills/glyphsprite/scripts/sprites.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
// DESIGN.md is picked up from cwd; the signature is not in it, so it is added here.
const t = await useTheme({ ...loadTheme(null, here), sign: { label: "acme.example", mark: "logo.svg", tint: true } });
console.log("theme:", t.name, t.mapping);
const browser = await (await chromium()).launch();
const M = await createMeasurer(browser);

async function compare() {
  const W = 1400, H = 600;
  let body =
    text(56, 100, ["Caching"], { size: 20, weight: 700, fill: C.accent[0], ls: 0.14, upper: true }) +
    text(56, 170, ["A cache answers fast. The database answers right."], { size: 50, weight: 700, fill: C.ink });
  const BT = 240, BW = 590, GAP = 108;
  const box = async (x, color, rows, k, title, desc) => {
    const [sw, sh] = spriteSize(rows, 8);
    const tx = x + 32 + sw + 28, tmax = BW - (tx - x) - 28;
    const tl = await M.wrap(title, tmax, { size: 30, weight: 700 });
    const dl = await M.wrap(desc, tmax, { size: 19 });
    const dy = 80 + (tl.length - 1) * 33 + 36;
    const h = Math.max(sh + 64, dy + (dl.length - 1) * 26 + 32);
    return (BH) =>
      `<rect x="${x}" y="${BT + 8}" width="${BW}" height="${BH}" fill="${color}"/>` +
      `<rect x="${x + 1.5}" y="${BT + 1.5}" width="${BW - 3}" height="${BH - 3}" fill="#fff" stroke="${C.ink}" stroke-width="3"/>` +
      spriteG(rows, { x: x + 32, y: Math.round(BT + (BH - sh) / 2), cell: 8 }) +
      text(tx, BT + 42, [k], { size: 16, weight: 700, fill: color, ls: 0.12, upper: true }) +
      text(tx, BT + 80, tl, { size: 30, weight: 700, fill: C.ink, lh: 1.1 }) +
      text(tx, BT + dy, dl, { size: 19, fill: C.muted, lh: 1.35 });
  };
  const BH = 230;
  body += (await box(56, C.accent[2], TIMER, "Cache · milliseconds", "Fast, maybe stale", "Answers from memory. Right until the data changes underneath it."))(BH);
  body += (await box(56 + BW + GAP, C.accent[4], DATABASE, "Database · source of truth", "Slower, always right", "Every answer is the current one. You pay for it on every read."))(BH);
  const cx = 56 + BW + GAP / 2;
  body += spriteG(KEY, { x: cx - 30, y: BT + BH / 2 - 14, cell: 4 });
  body += text(cx, BT + BH + 70, ["Invalidate on write, not on a timer."], { size: 24, weight: 700, fill: C.accent[0], anchor: "middle" });
  return svgDoc({ w: W, h: H, bg: C.paper, body, title: "A cache answers fast but may be stale; the database is slower but always right", sign: { fill: C.muted } });
}

const file = path.join(here, "cache-vs-database.svg");
fs.writeFileSync(file, await compare());
console.log("ok", path.basename(file), (fs.statSync(file).size / 1024).toFixed(0) + " KB");
if (process.argv.includes("--preview")) for (const f of await preview(browser, file, [0], path.join(here, "out"))) console.log("  ", f);
await browser.close();
