// Contact sheet of every sprite in sprites.mjs under a theme, to pick from or to copy before drawing a new one.
// Usage: node catalog.mjs [theme.json|DESIGN.md|--reference] [out.svg]
import fs from "fs";
import { C, REFERENCE, spriteG, spriteSize, svgDoc, text, useTheme } from "./engine.mjs";
import * as SPRITES from "./sprites.mjs";

const [arg, out = "catalog.svg"] = process.argv.slice(2);
await useTheme(arg === "--reference" ? REFERENCE : arg);

const COLS = 6, CELL = 6, BOX = 180, PAD = 48;
const entries = Object.entries(SPRITES);
const rows = Math.ceil(entries.length / COLS);
const w = PAD * 2 + COLS * BOX;
const h = PAD * 2 + rows * BOX;
const body = entries
  .map(([name, rows], i) => {
    const x = PAD + (i % COLS) * BOX;
    const y = PAD + Math.floor(i / COLS) * BOX;
    const [sw, sh] = spriteSize(rows, CELL);
    return (
      `<rect x="${x + 6}" y="${y + 6}" width="${BOX - 12}" height="${BOX - 12}" fill="${C.panel}"/>` +
      spriteG(rows, { x: x + (BOX - sw) / 2, y: y + 20 + (110 - sh) / 2, cell: CELL, o: C.paper }) +
      text(x + BOX / 2, y + BOX - 26, [name], { size: 16, fill: C.muted, anchor: "middle", family: "mono" })
    );
  })
  .join("");
fs.writeFileSync(out, svgDoc({ w, h, bg: C.ink, body, title: "glyphsprite sprite catalog", sign: false }));
console.log(`${entries.length} sprites → ${out}`);
