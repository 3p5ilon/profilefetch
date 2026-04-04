#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const cfg = require(path.join(ROOT, "src", "config.js"));
const themeCfg = require(path.join(ROOT, "src", "theme.js"));

const pal = themeCfg.theme.palette;
const theme = themeCfg.theme;
const font = themeCfg.font;
const layout = themeCfg.layout;
const options = cfg.options;

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const escUrl = (url) => url.replace(/&/g, "&amp;");
const color = (name) => pal[name] ?? pal.text;

const fontSize = font.size;
const charWidth = fontSize * font.charRatio;
const fontFamily = esc(font.family);

const lineHeight = layout.lineHeight;
const startY = layout.paddingTop;

const svgText = (x, y, fill, content, bold = false) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" xml:space="preserve"${bold ? ' font-weight="700"' : ""}>${esc(content)}</text>`;

const strPx = (str) => Math.round(str.length * charWidth);

const asciiFile = path.join(ROOT, "src", cfg.ascii.file);
const asciiLines = fs
  .readFileSync(asciiFile, "utf8")
  .replace(/\r\n/g, "\n")
  .split("\n");
if (asciiLines.length && asciiLines[asciiLines.length - 1].trim() === "") {
  asciiLines.pop();
}

// --- Compute Dynamic Info Column X Position ---
const maxAsciiLen = Math.max(0, ...asciiLines.map((line) => line.length));
const maxAsciiPx = Math.round(maxAsciiLen * charWidth);
const infoColX = layout.paddingLeft + maxAsciiPx + layout.columnGap;

function buildRows(rawInfo, autoBlankBetweenGroups) {
  const rows = [];
  let prevColor = null;
  for (const item of rawInfo) {
    // Allow manually inserting "break" (or null) to force an empty line
    if (!item || item === "break") {
      rows.push({ type: "blank" });
      prevColor = null; // Reset to avoid double empty lines
      continue;
    }

    // Auto-gap if colors are different
    if (
      autoBlankBetweenGroups &&
      prevColor !== null &&
      item.color !== prevColor
    ) {
      rows.push({ type: "blank" });
    }

    rows.push({
      type: "data",
      key: item.key,
      value: item.value,
      keyColor: item.color,
    });
    prevColor = item.color;
  }
  return rows;
}
const renderedRows = buildRows(cfg.info, options.blankBetweenGroups);

const infoEls = [];
let row = 0;
const currentY = () => startY + row * lineHeight;

// Title: user@host
const sep = options.userHostSep || "@";
const userPx = strPx(cfg.user);
const sepPx = strPx(sep);
const title = `${cfg.user}${sep}${cfg.host}`;

infoEls.push(svgText(infoColX, currentY(), color("sky"), cfg.user, true));
infoEls.push(svgText(infoColX + userPx, currentY(), color("text"), sep, false));
infoEls.push(
  svgText(infoColX + userPx + sepPx, currentY(), color("sky"), cfg.host, true),
);
row++;

// Title underline matching exact length
const dashes = "-".repeat(title.length);
infoEls.push(svgText(infoColX, currentY(), color("text"), dashes));
row++;

// Info rows formatting
for (const r of renderedRows) {
  if (r.type === "blank") {
    row++;
    continue;
  }
  const keyStr = r.key + ":";
  const keyPx = strPx(keyStr);
  const spacePx = strPx(" ");

  infoEls.push(svgText(infoColX, currentY(), color(r.keyColor), keyStr, true));
  infoEls.push(
    svgText(infoColX + keyPx + spacePx, currentY(), color("text"), r.value),
  );

  row++;
}

// Color Swatches
let swX = infoColX;
const swatchEls = [];
if (options.showSwatches) {
  const sw = theme.swatches;
  const boxSize = 18;
  const swY1 = startY + row * lineHeight + 6;
  const swY2 = swY1 + boxSize;

  sw.normal.forEach((hex, i) =>
    swatchEls.push(
      `<rect x="${swX + i * boxSize}" y="${swY1}" width="${boxSize}" height="${boxSize}" fill="${hex}"/>`,
    ),
  );
  sw.bright.forEach((hex, i) =>
    swatchEls.push(
      `<rect x="${swX + i * boxSize}" y="${swY2}" width="${boxSize}" height="${boxSize}" fill="${hex}"/>`,
    ),
  );
}

const asciiEls = asciiLines.map((line, i) =>
  svgText(
    layout.paddingLeft,
    startY + i * lineHeight,
    color(cfg.ascii.color),
    line,
  ),
);

const swatchExtra = options.showSwatches ? lineHeight + 28 : 0;
const infoBottom =
  startY + row * lineHeight + swatchExtra + layout.paddingBottom;
const asciiBottom =
  startY + asciiLines.length * lineHeight + layout.paddingBottom;
const svgH = Math.max(infoBottom, asciiBottom);

// --- Compute Dynamic SVG Width ---
let maxInfoPx = strPx(`${cfg.user}${sep}${cfg.host}`);
for (const r of renderedRows) {
  if (r.type === "data") {
    // Add extra room for the space between key and value
    maxInfoPx = Math.max(maxInfoPx, strPx(r.key + ":   " + r.value));
  }
}
if (options.showSwatches) {
  // swatches pixel width: length * box width (18)
  const swatchesPx = theme.swatches.normal.length * 18;
  maxInfoPx = Math.max(maxInfoPx, swatchesPx);
}

// Calculate the final SVG width enforcing the minimum GitHub profile context width
const calculatedSvgW = infoColX + maxInfoPx + layout.paddingRight;
const svgW = Math.max(layout.minWidth, calculatedSvgW);

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
  `  <style>@import url('${escUrl(font.import)}');</style>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="${theme.bg}"/>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="none" stroke="${theme.border}" stroke-width="1"/>`,
  ...asciiEls.map((el) => "  " + el),
  ...infoEls.map((el) => "  " + el),
  ...swatchEls.map((el) => "  " + el),
  `</svg>`,
].join("\n");

const outDir = path.join(ROOT, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "profilefetch.svg");
fs.writeFileSync(outPath, svg, "utf8");

console.log(`✓  output/profilefetch.svg  (${svgW} × ${svgH}px)`);
