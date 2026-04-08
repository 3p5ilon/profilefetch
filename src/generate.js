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
  // Round x/y for clean SVG source, but allow decimals for high-precision logo alignment
  const xPos = Number.isInteger(x) ? x : x.toFixed(3);
  const yPos = Number.isInteger(y) ? y : y.toFixed(3);
  return `<text x="${xPos}" y="${yPos}" fill="${fill}" class="f"${sizeAttr}${weightAttr} xml:space="preserve">${esc(content)}</text>`;
};

const strPx = (str) => Math.round(str.length * charWidth);
const spacePx = strPx(" "); // Cached space width

// Handle Logo Graphic Asset Loading (Image or Text)
const { type: logoType, text: textCfg, image: imageCfg } = cfg.logo;
const isImageMode = logoType === "image";

let logoLines = [];
let embeddedImage = "";
let maxGraphicPx = 0;
let graphicContentHeight = 0;

if (isImageMode) {
  // Mode: High-quality Image Embedding (Base64)
  const imgPath = path.resolve(ROOT, "src", imageCfg.path);
  const ext = path.extname(imgPath).slice(1).toLowerCase() || "png";
  const buffer = fs.readFileSync(imgPath);
  embeddedImage = `data:image/${ext};base64,${buffer.toString("base64")}`;
  maxGraphicPx = imageCfg.width;
  graphicContentHeight = imageCfg.height;
} else {
  // Mode: Classic Text-based Logo Art Parsing
  const textFile = path.resolve(ROOT, "src", textCfg.file);
  const rawLines = fs.readFileSync(textFile, "utf8").trimEnd().split(/\r?\n/);

  // Strip trailing invisible blanks and visually crop logo bounding box
  logoLines = rawLines.map(line => line.replace(/[\s\u2800]+$/, ""));
  
  let minLeading = Infinity;
  for (const line of logoLines) {
    if (line.length === 0) continue;
    const match = line.match(/^[\s\u2800]+/);
    const leadingCount = match ? match[0].length : 0;
    if (leadingCount < minLeading) minLeading = leadingCount;
  }
  if (minLeading === Infinity) minLeading = 0;

  if (minLeading > 0) {
    logoLines = logoLines.map(line => line.length >= minLeading ? line.substring(minLeading) : line);
  }

  // Calculate a scale factor for vector-based logo scaling
  const textFontSize = textCfg.fontSize > 0 ? textCfg.fontSize : fontSize;
  const logoScale = textFontSize / fontSize;

  // Horizontal/Vertical metrics scale perfectly via the SVG transform
  const maxChars = Math.max(0, ...logoLines.map(line => line.length));
  maxGraphicPx = maxChars * charWidth * logoScale;
  graphicContentHeight = logoLines.length * lineHeight * logoScale;
  
  textCfg._render = { scale: logoScale };
}

// Compute Info Column X Position based on dynamic graphic width
const infoColX = layout.paddingLeft + maxGraphicPx + layout.columnGap;

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
      prevColor = null; 
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

infoEls.push(svgText(infoColX, currentY(), color("text"), "-".repeat(title.length)));
row++;

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

  if (valueLines.length === 0) {
    row++;
  } else {
    valueLines.forEach(line => {
      infoEls.push(svgText(startValueX, currentY(), color("text"), line));
      row++;
    });
  }
}

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
  : [
      `<g transform="translate(${layout.paddingLeft}, ${startY}) scale(${textCfg._render.scale}) translate(${-layout.paddingLeft}, ${-startY})">`,
      ...logoLines.map((line, i) =>
        svgText(layout.paddingLeft, startY + i * lineHeight, color(textCfg.color), line)
      ),
      `</g>`
    ];

const svgH = Math.max(
  startY + row * lineHeight + (options.showSwatches ? lineHeight + 28 : 0) + layout.paddingBottom,
  startY + graphicContentHeight + layout.paddingBottom
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

const outPath = path.join(ROOT, "profilefetch.svg");
fs.writeFileSync(outPath, svg, "utf8");

console.log(`✓  profilefetch.svg  (${svgW} × ${svgH}px)`);
