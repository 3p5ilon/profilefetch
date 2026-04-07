#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const cfg = require(path.join(ROOT, "src", "config.js"));
const { theme, font, layout } = require(path.join(ROOT, "src", "theme.js"));
const { palette } = theme;
const { options } = cfg;

const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (m) => escMap[m]);
const color = (name) => palette[name] ?? palette.text;

const { size: fontSize, charRatio, family, keyWeight } = font;
const charWidth = fontSize * charRatio;
const fontFamily = esc(family);

const { lineHeight, paddingTop: startY, width: svgW } = layout;

const svgText = (x, y, fill, content, bold = false, size = fontSize) => {
  const sizeAttr = size !== fontSize ? ` font-size="${size}"` : "";
  const weightAttr = bold ? ` font-weight="${keyWeight}"` : "";
  return `<text x="${x}" y="${y}" fill="${fill}" class="f"${sizeAttr}${weightAttr} xml:space="preserve">${esc(content)}</text>`;
};

const strPx = (str) => Math.round(str.length * charWidth);
const spacePx = strPx(" "); // Cached space width

// Handle Graphic Asset Loading
const { type: asciiType, text: textCfg, image: imageCfg } = cfg.ascii;
const isImageMode = asciiType === "image";

let asciiLines = [];
let embeddedImage = "";
let maxAsciiPx = 0;
let asciiContentHeight = 0;

if (isImageMode) {
  // Mode: High-quality Image Embedding (Base64)
  const imgPath = path.resolve(ROOT, "src", imageCfg.path);
  const ext = path.extname(imgPath).slice(1).toLowerCase() || "png";
  const buffer = fs.readFileSync(imgPath);
  embeddedImage = `data:image/${ext};base64,${buffer.toString("base64")}`;
  maxAsciiPx = imageCfg.width;
  asciiContentHeight = imageCfg.height;
} else {
  // Mode: Classic ASCII Art Parsing
  const asciiFile = path.resolve(ROOT, "src", textCfg.file);
  const rawLines = fs.readFileSync(asciiFile, "utf8").trimEnd().split(/\r?\n/);

  // Strip trailing invisible blanks and visually crop ASCII bounding box
  asciiLines = rawLines.map(line => line.replace(/[\s\u2800]+$/, ""));
  
  let minLeading = Infinity;
  for (const line of asciiLines) {
    if (line.length === 0) continue;
    const match = line.match(/^[\s\u2800]+/);
    const leadingCount = match ? match[0].length : 0;
    if (leadingCount < minLeading) minLeading = leadingCount;
  }
  if (minLeading === Infinity) minLeading = 0;

  if (minLeading > 0) {
    asciiLines = asciiLines.map(line => line.length >= minLeading ? line.substring(minLeading) : line);
  }

  // Calculate section-specific metrics for independent ASCII scaling
  const asciiFontSize = textCfg.fontSize > 0 ? textCfg.fontSize : fontSize;
  const asciiCharWidth = asciiFontSize * charRatio;
  const asciiLineHeight = textCfg.fontSize > 0 ? Math.round((textCfg.fontSize / fontSize) * lineHeight) : lineHeight;

  const maxChars = Math.max(0, ...asciiLines.map(line => line.length));
  maxAsciiPx = Math.round(maxChars * asciiCharWidth);
  asciiContentHeight = asciiLines.length * asciiLineHeight;
  
  // Store height-scaling meta for the rendering loop
  textCfg._render = { fontSize: asciiFontSize, lineHeight: asciiLineHeight };
}

// Compute Info Column X Position
const infoColX = layout.paddingLeft + maxAsciiPx + layout.columnGap;

const buildRows = (rawInfo, autoBlank) => {
  let prevColor = null;
  const result = [];

  for (const entry of rawInfo) {
    // If entry is a sub-array, treat it as a logical "Block" with automatic gapping
    if (Array.isArray(entry)) {
      if (result.length > 0 && result[result.length - 1].type !== "blank") {
        result.push({ type: "blank" });
      }
      for (const item of entry) {
        result.push({ type: "data", key: item.key, value: item.value, keyColor: item.color });
      }
      prevColor = null; // Reset color tracking between logical blocks
      continue;
    }

    // Standard item processing (flat entries or manual breaks)
    if (!entry || entry === "break") {
      result.push({ type: "blank" });
      prevColor = null;
      continue;
    }

    if (autoBlank && prevColor && entry.color !== prevColor) {
      result.push({ type: "blank" });
    }
    
    result.push({ type: "data", key: entry.key, value: entry.value, keyColor: entry.color });
    prevColor = entry.color;
  }
  return result;
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

const assetEls = isImageMode
  ? [`<image x="${layout.paddingLeft}" y="${startY}" width="${imageCfg.width}" height="${imageCfg.height}" href="${embeddedImage}"/>`]
  : asciiLines.map((line, i) =>
      svgText(layout.paddingLeft, startY + i * textCfg._render.lineHeight, color(textCfg.color), line, false, textCfg._render.fontSize)
    );

const svgH = Math.max(
  startY + row * lineHeight + (options.showSwatches ? lineHeight + 28 : 0) + layout.paddingBottom,
  startY + asciiContentHeight + layout.paddingBottom
);

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
  `  <style>`,
  `    @import url('${font.import.replace(/&/g, "&amp;")}');`,
  `    .f { font-family: ${fontFamily}; font-size: ${fontSize}px; }`,
  `  </style>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="${theme.bg}"/>`,
  `  <rect width="${svgW}" height="${svgH}" rx="8" fill="none" stroke="${theme.border}" stroke-width="1"/>`,
  ...assetEls.map(el => `  ${el}`),
  ...infoEls.map(el => `  ${el}`),
  ...swatchEls.map(el => `  ${el}`),
  `</svg>`,
].join("\n");

const outDir = path.join(ROOT, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "profilefetch.svg");
fs.writeFileSync(outPath, svg, "utf8");

console.log(`✓  output/profilefetch.svg  (${svgW} × ${svgH}px)`);
