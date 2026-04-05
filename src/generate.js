#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const cfg = require(path.join(ROOT, "src", "config.js"));
const { theme, font, layout } = require(path.join(ROOT, "src", "theme.js"));
const { palette } = theme;
const { options } = cfg;

// Utilities
const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => escMap[m]);
const color = (name) => palette[name] ?? palette.text;

// Font Metrics
const { size: fontSize, charRatio, family } = font;
const charWidth = fontSize * charRatio;
const fontFamily = esc(family);

// Layout Metrics
const { lineHeight, paddingTop: startY, width: svgW } = layout;

const svgText = (x, y, fill, content, bold = false) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" xml:space="preserve"${bold ? ' font-weight="700"' : ""}>${esc(content)}</text>`;

const strPx = (str) => Math.round(str.length * charWidth);
const spacePx = strPx(" "); // Cached space width

// Parse ASCII art dynamically
const asciiFile = path.join(ROOT, "src", cfg.ascii.file);
const asciiLines = fs.readFileSync(asciiFile, "utf8").trimEnd().split(/\r?\n/);

// --- Compute Dynamic Info Column X Position ---
const maxAsciiLen = Math.max(0, ...asciiLines.map((line) => line.length));
const maxAsciiPx = Math.round(maxAsciiLen * charWidth);
const infoColX = layout.paddingLeft + maxAsciiPx + layout.columnGap;

const buildRows = (rawInfo, autoBlank) => {
  let prevColor = null;
  return rawInfo.flatMap((item) => {
    if (!item || item === "break") {
      prevColor = null;
      return [{ type: "blank" }];
    }
    
    const rows = [];
    if (autoBlank && prevColor && item.color !== prevColor) {
      rows.push({ type: "blank" });
    }
    
    rows.push({ type: "data", key: item.key, value: item.value, keyColor: item.color });
    prevColor = item.color;
    return rows;
  });
};

const renderedRows = buildRows(cfg.info, options.blankBetweenGroups);

const infoEls = [];
let row = 0;
const currentY = () => startY + row * lineHeight;

// Title: user@host
const { user, host } = cfg;
const sep = options.userHostSep || "@";
const userPx = strPx(user);
const sepPx = strPx(sep);
const title = `${user}${sep}${host}`;

infoEls.push(
  svgText(infoColX, currentY(), color("sky"), user, true),
  svgText(infoColX + userPx, currentY(), color("text"), sep),
  svgText(infoColX + userPx + sepPx, currentY(), color("sky"), host, true)
);
row++;

// Title underline matching exact length
infoEls.push(svgText(infoColX, currentY(), color("text"), "-".repeat(title.length)));
row++;

// Info rows formatting
for (const r of renderedRows) {
  if (r.type === "blank") {
    row++;
    continue;
  }
  
  const keyStr = `${r.key}:`;
  const keyPx = strPx(keyStr);
  const startValueX = infoColX + keyPx + spacePx;
  
  infoEls.push(svgText(infoColX, currentY(), color(r.keyColor), keyStr, true));

  const availableWidth = svgW - layout.paddingRight - startValueX;
  const words = r.value.split(" ");
  let currentLine = "";
  const valueLines = [];
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && strPx(testLine) > availableWidth) {
      valueLines.push(currentLine);
      currentLine = word; // Drop to next line
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) valueLines.push(currentLine);

  // Render text blocks sequentially on new rows
  if (valueLines.length === 0) {
    row++; // Failsafe empty value
  } else {
    valueLines.forEach(line => {
      infoEls.push(svgText(startValueX, currentY(), color("text"), line));
      row++;
    });
  }
}

// Color Swatches
const swatchEls = [];
if (options.showSwatches) {
  const { swatches } = theme;
  const boxSize = 18;
  const swY1 = startY + row * lineHeight + 6;

  swatches.normal.forEach((hex, i) =>
    swatchEls.push(`<rect x="${infoColX + i * boxSize}" y="${swY1}" width="${boxSize}" height="${boxSize}" fill="${hex}"/>`)
  );
  swatches.bright.forEach((hex, i) =>
    swatchEls.push(`<rect x="${infoColX + i * boxSize}" y="${swY1 + boxSize}" width="${boxSize}" height="${boxSize}" fill="${hex}"/>`)
  );
}

const asciiEls = asciiLines.map((line, i) =>
  svgText(layout.paddingLeft, startY + i * lineHeight, color(cfg.ascii.color), line)
);

const svgH = Math.max(
  startY + row * lineHeight + (options.showSwatches ? lineHeight + 28 : 0) + layout.paddingBottom,
  startY + asciiLines.length * lineHeight + layout.paddingBottom
);

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
  `  <style>@import url('${font.import.replace(/&/g, "&amp;")}');</style>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="${theme.bg}"/>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="none" stroke="${theme.border}" stroke-width="1"/>`,
  ...asciiEls.map(el => `  ${el}`),
  ...infoEls.map(el => `  ${el}`),
  ...swatchEls.map(el => `  ${el}`),
  `</svg>`,
].join("\n");

const outDir = path.join(ROOT, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "profilefetch.svg");
fs.writeFileSync(outPath, svg, "utf8");

console.log(`✓  output/profilefetch.svg  (${svgW} × ${svgH}px)`);
