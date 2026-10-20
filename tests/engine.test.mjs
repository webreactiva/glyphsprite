import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { C, PAL, REFERENCE, fontFaces, loadTheme, mix, parseDesignMd, sprite, text, useTheme } from "../skills/glyphsprite/scripts/engine.mjs";
import * as SPRITES from "../skills/glyphsprite/scripts/sprites.mjs";

test("runs of the same character become one rect", async () => {
  await useTheme({ ...REFERENCE, font: undefined });
  const svg = sprite(["oooo", "o..r"]);
  assert.equal((svg.match(/<rect/g) || []).length, 3);
  assert.match(svg, /<rect x="0" y="0" width="4" height="1"\/>/);
});

test("palette letters are accent roles with derived shadows", async () => {
  await useTheme({ ink: "#000000", paper: "#ffffff", accents: ["#ff0000", "#00ff00"] });
  assert.equal(PAL.r, "#ff0000");
  assert.equal(PAL.l, "#00ff00");
  assert.equal(PAL.y, "#ff0000", "missing accents cycle the theme's own");
  assert.equal(PAL.R, mix("#ff0000", "#000000", 0.25));
  assert.equal(C.accent.length, 6);
});

test("DESIGN.md front matter maps darkest to ink, lightest to paper", async () => {
  const t = parseDesignMd(`---\nname: X\ncolors:\n  brand: "#e4572e"\n  dark: "#14213d"\n  light: "#fbf7f0"\ntypography:\n  h1:\n    fontFamily: Inter\n---\n`);
  assert.equal(t.ink, "#14213d");
  assert.equal(t.paper, "#fbf7f0");
  assert.deepEqual(t.accents, ["#e4572e"]);
  assert.equal(t.font.family, "Inter");
  assert.equal(parseDesignMd("# no front matter"), null);
  const heritage = parseDesignMd(`---\ncolors:\n  primary: "#1A1C1E"\n  secondary: "#6C7278"\n  tertiary: "#B8422E"\n  neutral: "#F7F5F2"\n---`);
  assert.deepEqual(heritage.mapping.accents, ["tertiary", "secondary"], "greys go after real colors");
});

test("no theme anywhere returns null and useTheme refuses", async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "glyphsprite-"));
  assert.equal(loadTheme(null, empty), null);
  fs.mkdirSync(path.join(empty, "glyphsprite"));
  fs.writeFileSync(path.join(empty, "glyphsprite", "theme.json"), JSON.stringify({ ink: "#000000", paper: "#ffffff", accents: ["#ff0000"] }));
  assert.equal(loadTheme(null, empty).base, path.join(empty, "glyphsprite"), "finds the workspace theme");
  await assert.rejects(useTheme(null, fs.mkdtempSync(path.join(os.tmpdir(), "glyphsprite-"))), /no theme/);
  await assert.rejects(useTheme({ ink: "black", paper: "#fff", accents: ["#f00"] }), /theme.ink/);
});

test("every catalog sprite only uses legend characters", async () => {
  await useTheme({ ...REFERENCE, font: undefined });
  const known = new Set([...Object.keys(PAL), "o", "v", "."]);
  for (const [name, rows] of Object.entries(SPRITES))
    for (const ch of rows.join("")) assert.ok(known.has(ch), `${name} uses unknown "${ch}"`);
});

test("extra theme fonts are embedded and usable by name", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glyphsprite-"));
  fs.writeFileSync(path.join(dir, "pix.woff2"), "not a real font");
  await useTheme({ ...REFERENCE, font: { family: "Base" }, fonts: [{ family: "Pix", files: { 400: "pix.woff2" } }], base: dir });
  assert.match(fontFaces(), /font-family:'Pix';font-weight:400/);
  assert.match(text(0, 0, ["hi"], { family: "Pix" }), /font-family="'Pix','Base'/);
});
