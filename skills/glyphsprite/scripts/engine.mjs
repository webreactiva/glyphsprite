// glyphsprite engine: ASCII sprites → SVG. Usage guide in ../SKILL.md, theme format in ../references/theming.md.
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Reference palette: the fallback the user can pick when the project has no
// design of its own. Never applied silently.
export const REFERENCE = {
  name: "glyphsprite reference",
  ink: "#22252a",
  paper: "#f4f3ef",
  accents: ["#c0654f", "#8a84b0", "#d6b25e", "#86a97f", "#6e93b5", "#a7708f"],
  font: { family: "Inter", google: true },
};

const hex = (h) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h).trim());
  if (!m) return null;
  const s = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const toHex = (rgb) => "#" + rgb.map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0")).join("");
// mix(a, b, t): t=0 → a, t=1 → b.
export const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
export const shade = (h, t = 0.25) => mix(h, "#000000", t);
export const tint = (h, t = 0.45) => mix(h, "#ffffff", t);
export const luminance = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Filled by useTheme(). Scripts read C for layout colors and PAL is the sprite legend.
export const C = {};
export const PAL = {};
let theme = null;

// Sprite letters are roles, not colors: r/l/y/g/b/n are accents 0–5, upper case is
// the shadow. s/S (metal) and m/M (wood) stay neutral so the catalog reads under any
// theme. d e f F h p copy l k y r pen y in their own group so a part can be animated.
const fillPalette = (t) => {
  const a = [...t.accents];
  while (a.length < 6) a.push(a[a.length % t.accents.length]);
  Object.assign(C, {
    ink: t.ink,
    paper: t.paper,
    panel: t.panel || mix(t.ink, t.paper, 0.06),
    line: t.line || mix(t.ink, t.paper, 0.18),
    text: t.text || mix(t.paper, t.ink, 0.06),
    muted: t.muted || mix(t.ink, t.paper, 0.55),
    accent: a,
    pen: shade(a[0], 0.15),
  });
  Object.assign(PAL, {
    w: C.paper, k: C.ink,
    r: a[0], R: shade(a[0]),
    l: a[1], L: tint(a[1]),
    y: a[2], Y: shade(a[2]),
    g: a[3], G: shade(a[3], 0.35),
    b: a[4], B: shade(a[4]),
    n: a[5],
    s: "#c3cad6", S: "#7b8494",
    m: "#b9773f", M: "#7a4a24",
    d: a[1], e: C.ink, f: a[2], F: a[0], h: C.pen, p: a[2],
    ...(t.pixels || {}),
  });
};

// shortcut: reads only the `colors:` and `typography:` blocks of the front matter,
// flat `key: value` lines; switch to a YAML parser if themes need more.
export function parseDesignMd(src) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(src)?.[1] || "";
  const colors = [];
  let family = null;
  let block = null;
  for (const raw of fm.split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;
    const [k, ...rest] = raw.trim().split(":");
    const v = rest.join(":").trim().replace(/^["']|["']$/g, "");
    if (indent === 0) block = k;
    else if (block === "colors" && hex(v)) colors.push({ name: k, value: toHex(hex(v)) });
    else if (block === "typography" && k === "fontFamily" && !family) family = v;
  }
  if (colors.length < 3) return null;
  const byLum = [...colors].sort((x, y) => luminance(x.value) - luminance(y.value));
  const ink = byLum[0];
  const paper = byLum[byLum.length - 1];
  // Near-greys go last so accent 0 (highlights, badges) is a real color.
  const chroma = (c) => Math.max(...hex(c.value)) - Math.min(...hex(c.value));
  const rest = colors.filter((c) => c !== ink && c !== paper);
  const accents = [...rest.filter((c) => chroma(c) >= 40), ...rest.filter((c) => chroma(c) < 40)];
  return {
    name: /^name:\s*(.+)$/m.exec(fm)?.[1].trim().replace(/^["']|["']$/g, "") || "DESIGN.md",
    ink: ink.value,
    paper: paper.value,
    accents: accents.map((c) => c.value),
    font: family ? { family } : undefined,
    mapping: { ink: ink.name, paper: paper.name, accents: accents.map((c) => c.name) },
  };
}

// Theme lookup: explicit object/file → glyphsprite/theme.json → DESIGN.md (both in
// cwd). Returns null when nothing is found: the agent asks, it does not default.
export function loadTheme(input, cwd = process.cwd()) {
  if (input && typeof input === "object") return { ...input, base: input.base || cwd };
  const file = input ? path.resolve(cwd, input) : [path.join(cwd, "glyphsprite", "theme.json"), path.join(cwd, "DESIGN.md")].find((f) => fs.existsSync(f));
  if (!file) return null;
  const src = fs.readFileSync(file, "utf8");
  const t = file.endsWith(".md") ? parseDesignMd(src) : JSON.parse(src);
  if (!t) throw new Error(`${file}: no usable colors (need at least 3 hex colors in the front matter)`);
  return { ...t, base: path.dirname(file) };
}

// Downloads the latin woff2 of a Google Fonts family once and caches it.
const CACHE = path.join(os.homedir(), ".cache", "glyphsprite", "fonts");
async function googleFont(familyName, weights) {
  fs.mkdirSync(CACHE, { recursive: true });
  const files = {};
  for (const w of weights) {
    const file = path.join(CACHE, `${familyName.replace(/\W+/g, "-")}-${w}.woff2`);
    if (!fs.existsSync(file)) {
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familyName)}:wght@${w}&display=swap`;
      // A modern user agent is what makes the API answer with woff2.
      const css = await (await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" } })).text();
      const src = (/\/\* latin \*\/[\s\S]*?url\((https:[^)]+\.woff2)\)/.exec(css) || /url\((https:[^)]+\.woff2)\)/.exec(css))?.[1];
      if (!src) throw new Error(`Google Fonts has no "${familyName}" at weight ${w}`);
      fs.writeFileSync(file, Buffer.from(await (await fetch(src)).arrayBuffer()));
    }
    files[w] = file;
  }
  return files;
}

export async function useTheme(input, cwd) {
  const t = loadTheme(input, cwd);
  if (!t) throw new Error("glyphsprite: no theme. Pass one, add glyphsprite/theme.json or DESIGN.md, or ask the user (REFERENCE is an option to offer).");
  for (const k of ["ink", "paper"]) if (!hex(t[k])) throw new Error(`theme.${k} must be a hex color, got ${t[k]}`);
  if (!Array.isArray(t.accents) || !t.accents.length || !t.accents.every(hex)) throw new Error("theme.accents must be a non-empty array of hex colors");
  if (t.font?.google && !t.font.files) t.font = { ...t.font, files: await googleFont(t.font.family, t.font.weights || [400, 700]) };
  theme = t;
  fontCss = undefined;
  fillPalette(t);
  return t;
}

const family = () => theme?.font?.family || "system-ui";
const stack = () => `'${family()}',system-ui,-apple-system,'Segoe UI',sans-serif`;

const groups = (rows, pal) => {
  const by = {};
  // Same-character runs in a row → one <rect>.
  rows.forEach((r, y) => {
    const cells = [...r];
    for (let x = 0; x < cells.length; ) {
      const ch = cells[x];
      let n = 1;
      while (cells[x + n] === ch) n++;
      if (pal[ch]) (by[ch] ||= []).push(`<rect x="${x}" y="${y}" width="${n}" height="1"/>`);
      x += n;
    }
  });
  return Object.entries(by)
    .map(([ch, rects]) => `<g class="c-${ch}" fill="${pal[ch]}">${rects.join("")}</g>`)
    .join("");
};
const size = (rows) => [Math.max(...rows.map((r) => r.length)), rows.length];

// Sprite as a standalone <svg> (for HTML) or as a <g> inside an SVG.
export const sprite = (rows, { cell = 8, o = C.ink, v = "#c3cad6", cls = "" } = {}) => {
  const [w, h] = size(rows);
  return `<svg class="px ${cls}" width="${w * cell}" height="${h * cell}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${groups(rows, { ...PAL, o, v })}</svg>`;
};
// The class goes on an outer <g>: a CSS transform animation would override the inner translate/scale.
export const spriteG = (rows, { x = 0, y = 0, cell = 8, o = C.ink, v = "#c3cad6", cls = "" } = {}) =>
  `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${cell})" shape-rendering="crispEdges">${groups(rows, { ...PAL, o, v })}</g></g>`;
export const spriteSize = (rows, cell = 8) => size(rows).map((n) => n * cell);

// Chromium from playwright, resolved from the caller's project first.
export async function chromium() {
  for (const from of [process.cwd(), here]) {
    try {
      return createRequire(path.join(from, "noop.js"))("playwright").chromium;
    } catch {}
  }
  throw new Error("glyphsprite needs playwright: npm i -D playwright && npx playwright install chromium");
}

// Latin + Latin-1 + dashes, quotes, bullet, ellipsis, arrows and ≠. Override with theme.font.unicodes.
const SUBSET = "U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2190-2193,U+21BA,U+2260";
const FORMAT = { ".woff2": "woff2", ".woff": "woff", ".ttf": "truetype", ".otf": "opentype" };
const fontB64 = (file) => {
  const out = path.join(os.tmpdir(), `glyphsprite-${path.basename(file)}.subset.woff2`);
  try {
    execFileSync("pyftsubset", [file, `--unicodes=${theme.font.unicodes || SUBSET}`, "--flavor=woff2", `--output-file=${out}`], { stdio: "pipe" });
    return [fs.readFileSync(out).toString("base64"), "woff2"];
  } catch {
    console.warn(`warning: ${path.basename(file)} not subset (pyftsubset or brotli missing); embedding the whole font`);
    return [fs.readFileSync(file).toString("base64"), FORMAT[path.extname(file)] || "woff2"];
  }
};
let fontCss;
// An SVG inside <img> cannot load external fonts, so the files go in as base64.
// No font files → empty: the SVG falls back to the viewer's system font.
export const fontFaces = () =>
  (fontCss ??= Object.entries(theme?.font?.files || {})
    .map(([weight, file]) => {
      const [b64, fmt] = fontB64(path.resolve(theme.base, file));
      return `@font-face{font-family:'${family()}';font-weight:${weight};src:url(data:font/${fmt};base64,${b64}) format("${fmt}")}`;
    })
    .join(""));

// Playwright page with the font loaded, to measure text for real.
export async function createMeasurer(browser) {
  const page = await browser.newPage();
  await page.setContent(`<style>${fontFaces()}</style><span style="font-family:${stack()};font-weight:700">.</span><span style="font-family:${stack()}">.</span>`);
  await page.evaluate(async (f) => {
    await document.fonts.load(`400 20px '${f}'`);
    await document.fonts.load(`700 20px '${f}'`);
  }, family());
  const width = (str, { size = 20, weight = 400, ls = 0 } = {}) =>
    page.evaluate(
      ([s, f, l]) => {
        const c = (window.__c ||= document.createElement("canvas").getContext("2d"));
        c.font = f;
        return c.measureText(s).width + l * Math.max(0, [...s].length - 1);
      },
      [str, `${weight} ${size}px ${stack()}`, ls * size]
    );
  const wrap = async (str, max, font) => {
    const lines = [];
    let line = "";
    for (const word of str.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (line && (await width(next, font)) > max) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    return [...lines, line];
  };
  return { width, wrap };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Multiline text. `lines` is an array; a line is a string or an array of {t, fill?, weight?}
// chunks to mix styles. `ls` is in em, like CSS.
export const text = (x, y, lines, { size = 20, weight = 400, fill = C.text, lh = 1.3, ls = 0, anchor = "start", family: fam = "brand", upper = false, cls = "" } = {}) => {
  const ff = fam === "mono" ? "ui-monospace,Menlo,monospace" : fam === "hand" ? "'Bradley Hand','Marker Felt',cursive" : stack();
  const tspans = lines
    .map((ln, i) => {
      const parts = Array.isArray(ln) ? ln : [{ t: ln }];
      const inner = parts
        .map((p) => `<tspan${p.fill ? ` fill="${p.fill}"` : ""}${p.weight ? ` font-weight="${p.weight}"` : ""}>${esc(upper ? p.t.toUpperCase() : p.t)}</tspan>`)
        .join("");
      return `<tspan x="${x}" ${i ? `dy="${size * lh}"` : ""}>${inner}</tspan>`;
    })
    .join("");
  return `<text class="${cls}" x="${x}" y="${y}" font-family="${esc(ff)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls * size}"` : ""}>${tspans}</text>`;
};

// Canvas presets. Height of an infographic follows its content; these are starting points.
export const CANVAS = {
  cover: { w: 1200, h: 630 },
  wide: { w: 1600, h: 900 },
  square: { w: 1080, h: 1080 },
  infographic: { w: 1400, h: 900 },
};

// Optional logo from theme.sign.mark (an SVG file), small and translucent in the
// top-right corner. tint: true repaints it in `o`.
const mark = (o) => {
  const s = theme?.sign;
  if (!s?.mark) return "";
  const src = fs.readFileSync(path.resolve(theme.base, s.mark), "utf8");
  const vb = /viewBox="([^"]+)"/.exec(src)?.[1] || "0 0 100 100";
  let inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(src)?.[1] || "";
  if (s.tint) inner = `<g fill="${o}">${inner.replace(/\sfill="(?!none)[^"]*"/g, "")}</g>`;
  const px = s.size || 80;
  return { px, svg: `<svg viewBox="${vb}" width="${px}" height="${px}">${inner}</svg>` };
};
export const signature = ({ w, h, label = theme?.sign?.label, fill = C.muted, o = C.ink, markRight = 56 }) => {
  const m = mark(o);
  return (
    (label ? text(w - 48, h - 30, [label], { size: 18, fill, anchor: "end", ls: 0.04 }) : "") +
    (m ? `<g opacity="${theme.sign.opacity ?? 0.3}" transform="translate(${w - markRight - m.px} 40)">${m.svg}</g>` : "")
  );
};
export const signatureHtml = ({ label = theme?.sign?.label, o = C.ink, markRight = 56 } = {}) => {
  const m = mark(o);
  return (
    (label ? `<p class="signature">${esc(label)}</p>` : "") +
    (m ? `<div style="position:absolute;right:${markRight}px;top:40px;opacity:${theme.sign.opacity ?? 0.3}">${m.svg}</div>` : "")
  );
};

// Full SVG document. `css` carries the piece's @keyframes; reduced motion stops them all.
// `sign` adds the theme's signature; pass false to leave it out.
export const svgDoc = ({ w, h, bg, body, css = "", title = "", sign = {} }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ""}>
<style>${fontFaces()}
text{font-kerning:normal}
.px *{shape-rendering:crispEdges}
${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
<rect width="${w}" height="${h}" fill="${bg}"/>
${body}
${sign ? signature({ w, h, ...sign }) : ""}
</svg>`;

// Screenshots of an SVG at several instants (seconds) to review the animation:
// pauses every animation and sets currentTime.
export async function preview(browser, svgFile, times, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const svg = fs.readFileSync(svgFile, "utf8");
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.evaluate(() => document.fonts.ready);
  const files = [];
  for (const t of times) {
    await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.pause(), (a.currentTime = ms))), t * 1000);
    const f = path.join(outDir, `${path.basename(svgFile, ".svg")}-${t}s.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  await page.close();
  return files;
}

// HTML → 2x PNG → WebP (needs cwebp), for static pieces laid out in HTML.
export async function htmlToWebp(browser, { name, html, w, h, outDir, webpDir }) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${name}.html`);
  fs.writeFileSync(file, html);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.goto(`file://${file}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const png = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: png });
  execFileSync("cwebp", ["-q", "84", "-quiet", png, "-o", path.join(webpDir, `${name}.webp`)]);
  await page.close();
}
